import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — Mundo Pine" },
      {
        name: "description",
        content:
          "Política de Privacidade do Mundo Pine em conformidade com a LGPD (Lei 13.709/2018).",
      },
    ],
  }),
  component: PrivacidadePage,
});

function PrivacidadePage() {
  return (
    <main className="min-h-screen px-4 py-10 md:py-14">
      <div className="max-w-3xl mx-auto">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
          </Link>
        </Button>

        <article className="prose prose-neutral max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Política de Privacidade
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            Última atualização: 18 de maio de 2026
          </p>

          <section className="space-y-4 text-foreground/90 leading-relaxed">
            <p>
              Esta Política descreve como o Lúdico Clínico ("Plataforma")
              coleta, utiliza e protege seus dados pessoais, em conformidade
              com a Lei Geral de Proteção de Dados — LGPD (Lei nº
              13.709/2018).
            </p>

            <h2 className="text-xl font-bold mt-6">
              1. Dados que coletamos
            </h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Dados de cadastro</strong> da(o) psicóloga(o): nome,
                e-mail e senha (armazenada de forma criptografada).
              </li>
              <li>
                <strong>Dados de uso</strong>: registros de acesso, sessões
                criadas, jogos utilizados e timestamps.
              </li>
              <li>
                <strong>Conteúdo das sessões</strong>: notas, desenhos,
                transcrições e prontuários inseridos voluntariamente
                pela(o) psicóloga(o).
              </li>
              <li>
                <strong>Dados dos pacientes</strong>: apenas as informações
                que a(o) psicóloga(o) optar por registrar (recomendamos
                identificadores não sensíveis, como iniciais ou apelidos).
              </li>
            </ul>

            <h2 className="text-xl font-bold mt-6">
              2. Bases legais (art. 7º da LGPD)
            </h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Execução de contrato</strong> para fornecimento da
                Plataforma à(ao) profissional.
              </li>
              <li>
                <strong>Consentimento</strong> dos responsáveis legais para
                registros relacionados a pacientes menores de idade — a
                obtenção e guarda do consentimento são responsabilidade
                da(o) psicóloga(o).
              </li>
              <li>
                <strong>Cumprimento de obrigação legal</strong> e exercício
                regular de direitos.
              </li>
            </ul>

            <h2 className="text-xl font-bold mt-6">
              3. Finalidades do tratamento
            </h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Permitir o uso dos jogos e recursos terapêuticos;</li>
              <li>
                Armazenar prontuários e notas para acesso futuro da(o)
                profissional;
              </li>
              <li>Garantir segurança e prevenir fraudes;</li>
              <li>Melhorar a Plataforma com base em métricas agregadas.</li>
            </ul>

            <h2 className="text-xl font-bold mt-6">
              4. Compartilhamento
            </h2>
            <p>
              Não vendemos dados pessoais. Compartilhamos dados apenas com
              operadores necessários ao funcionamento da Plataforma
              (provedor de hospedagem, banco de dados e serviços de
              autenticação) sob obrigações contratuais de
              confidencialidade e segurança, ou quando exigido por
              autoridade competente.
            </p>

            <h2 className="text-xl font-bold mt-6">
              5. Segurança
            </h2>
            <p>
              Adotamos medidas técnicas e administrativas para proteger
              seus dados, incluindo criptografia em trânsito (HTTPS),
              senhas armazenadas com hash, controles de acesso baseados em
              identidade (Row-Level Security) e verificação contra senhas
              vazadas (HIBP). Ainda assim, nenhum sistema é absolutamente
              seguro — recomendamos boas práticas (senhas fortes,
              dispositivos confiáveis).
            </p>

            <h2 className="text-xl font-bold mt-6">
              6. Retenção
            </h2>
            <p>
              Mantemos os dados enquanto a conta estiver ativa ou pelo
              período necessário para cumprir obrigações legais
              (especialmente o prazo mínimo de guarda de prontuário
              psicológico previsto pelo CFP). Após a exclusão da conta, os
              dados são anonimizados ou eliminados em prazo razoável.
            </p>

            <h2 className="text-xl font-bold mt-6">
              7. Seus direitos (art. 18 da LGPD)
            </h2>
            <p>Você pode, a qualquer momento, solicitar:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Confirmação da existência de tratamento;</li>
              <li>Acesso, correção ou atualização dos dados;</li>
              <li>Anonimização, bloqueio ou eliminação;</li>
              <li>Portabilidade;</li>
              <li>Informações sobre compartilhamento;</li>
              <li>Revogação do consentimento.</li>
            </ul>

            <h2 className="text-xl font-bold mt-6">
              8. Cookies
            </h2>
            <p>
              Utilizamos apenas cookies essenciais ao funcionamento (sessão
              de login). Não utilizamos cookies de publicidade ou de
              rastreamento entre sites.
            </p>

            <h2 className="text-xl font-bold mt-6">
              9. Encarregado (DPO)
            </h2>
            <p>
              Para solicitações relacionadas a dados pessoais, entre em
              contato pelo e-mail informado abaixo. Responderemos no prazo
              previsto pela LGPD.
            </p>

            <h2 className="text-xl font-bold mt-6">
              10. Alterações
            </h2>
            <p>
              Esta Política pode ser atualizada. Mudanças relevantes serão
              comunicadas com antecedência razoável.
            </p>

            <h2 className="text-xl font-bold mt-6">
              11. Contato
            </h2>
            <p>
              E-mail do responsável: <em>contato@ludicoclinico.com.br</em>{" "}
              (substitua pelo seu e-mail oficial antes de publicar).
            </p>
          </section>

          <div className="mt-10 pt-6 border-t border-border text-sm text-muted-foreground">
            Veja também os{" "}
            <Link to="/termos" className="text-primary underline">
              Termos de Uso
            </Link>
            .
          </div>
        </article>
      </div>
    </main>
  );
}
