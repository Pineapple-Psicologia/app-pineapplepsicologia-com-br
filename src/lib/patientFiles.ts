import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { supabase } from "@/integrations/supabase/client";

export type SaveResult = { ok: true; url: string } | { ok: false; error: string };

/** Gera um PDF a partir de um elemento DOM. Retorna Blob e dataUrl (para download). */
export async function elementToPdf(
  el: HTMLElement,
  title: string,
): Promise<{ blob: Blob; dataUrl: string }> {
  const canvas = await html2canvas(el, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true,
    logging: false,
  });
  const imgData = canvas.toDataURL("image/jpeg", 0.92);

  const pxW = canvas.width;
  const pxH = canvas.height;
  const orientation = pxW >= pxH ? "landscape" : "portrait";
  const pdf = new jsPDF({ orientation, unit: "px", format: [pxW, pxH] });

  pdf.addImage(imgData, "JPEG", 0, 0, pxW, pxH);

  // metadata
  pdf.setProperties({ title, creator: "Mundo Pine" });

  const blob = pdf.output("blob");
  const dataUrl = pdf.output("datauristring");
  return { blob, dataUrl };
}

export function downloadPdfBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function uploadPatientPdf(args: {
  userId: string;
  patientId: string;
  fileName: string;
  game?: string | null;
  blob: Blob;
}): Promise<SaveResult> {
  const { userId, patientId, fileName, game, blob } = args;
  const path = `${userId}/${patientId}/${Date.now()}-${fileName}`;

  const { error: upErr } = await supabase.storage
    .from("patient-files")
    .upload(path, blob, {
      contentType: "application/pdf",
      upsert: false,
    });
  if (upErr) return { ok: false, error: upErr.message };

  const { error: dbErr } = await supabase.from("patient_files").insert({
    user_id: userId,
    patient_id: patientId,
    file_name: fileName,
    file_path: path,
    game: game ?? null,
    mime_type: "application/pdf",
    size_bytes: blob.size,
  });
  if (dbErr) {
    await supabase.storage.from("patient-files").remove([path]);
    return { ok: false, error: dbErr.message };
  }
  return { ok: true, url: path };
}

export async function getSignedPatientFileUrl(path: string, expiresIn = 60) {
  const { data, error } = await supabase.storage
    .from("patient-files")
    .createSignedUrl(path, expiresIn);
  if (error) throw error;

  const signedUrl = data.signedUrl;
  if (/^https?:\/\//i.test(signedUrl)) return signedUrl;

  const supabaseUrl =
    import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;

  if (!supabaseUrl) {
    throw new Error("Configuração do armazenamento indisponível.");
  }

  return new URL(`/storage/v1${signedUrl}`, supabaseUrl).toString();
}
