import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  patientId: z.string().uuid(),
  audioBase64: z.string().min(1),
  mimeType: z.string().min(1).max(100),
});

const PRONTUARIO_PROMPT = `Você é uma assistente clínica especializada em apoiar psicólogas no registro de sessões. Receberá a transcrição completa de uma sessão de psicoterapia. Gere um PRONTUÁRIO PROFISSIONAL em português brasileiro, com linguagem técnica, clara e objetiva, contendo as seguintes seções (use exatamente esses títulos em negrito com markdown):

**Queixa principal / Demanda**
**Conteúdo da sessão**
**Aspectos emocionais e comportamentais observados**
**Intervenções realizadas pela terapeuta**
**Hipóteses clínicas**
**Encaminhamentos e próximos passos**

Regras:
- Não invente informações que não estejam na transcrição.
- Preserve sigilo: não use sobrenomes nem dados identificáveis.
- Use terceira pessoa ("a paciente relatou…", "foi observado…").
- Seja conciso, mas completo.`;

export const generateProntuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Verify patient belongs to this psychologist
    const { data: patient, error: pErr } = await supabase
      .from("patients")
      .select("id")
      .eq("id", data.patientId)
      .maybeSingle();
    if (pErr || !patient) throw new Error("Paciente não encontrado");

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY ausente");

    // Step 1: Transcribe audio with Gemini (supports inline audio)
    const transcribeRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Transcreva integralmente o áudio desta sessão de psicoterapia em português brasileiro. Indique falas distintas como 'Terapeuta:' e 'Paciente:' quando possível. Retorne apenas a transcrição, sem comentários.",
              },
              {
                type: "input_audio",
                input_audio: { data: data.audioBase64, format: data.mimeType.includes("webm") ? "webm" : data.mimeType.includes("mp3") ? "mp3" : "wav" },
              },
            ],
          },
        ],
      }),
    });

    if (!transcribeRes.ok) {
      const txt = await transcribeRes.text();
      if (transcribeRes.status === 429) throw new Error("Limite de uso da IA atingido. Tente novamente em instantes.");
      if (transcribeRes.status === 402) throw new Error("Créditos de IA esgotados. Adicione créditos em Lovable Cloud.");
      throw new Error(`Falha na transcrição: ${txt.slice(0, 200)}`);
    }
    const transcribeJson = await transcribeRes.json();
    const transcript: string = transcribeJson.choices?.[0]?.message?.content ?? "";
    if (!transcript) throw new Error("Não foi possível obter transcrição");

    // Step 2: Generate prontuário from transcript
    const prontRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: PRONTUARIO_PROMPT },
          { role: "user", content: `Transcrição da sessão:\n\n${transcript}` },
        ],
      }),
    });

    if (!prontRes.ok) {
      const txt = await prontRes.text();
      throw new Error(`Falha ao gerar prontuário: ${txt.slice(0, 200)}`);
    }
    const prontJson = await prontRes.json();
    const prontuario: string = prontJson.choices?.[0]?.message?.content ?? "";

    // Save session
    const { data: session, error: sErr } = await supabase
      .from("sessions")
      .insert({
        psychologist_id: userId,
        patient_id: data.patientId,
        transcript,
        prontuario,
        status: "ready",
      })
      .select()
      .single();
    if (sErr) throw new Error(`Erro ao salvar sessão: ${sErr.message}`);

    return { sessionId: session.id, transcript, prontuario };
  });
