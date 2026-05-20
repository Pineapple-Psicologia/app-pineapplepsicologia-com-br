import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — Mundo Pine" },
      {
        name: "description",
        content:
          "Termos de Uso do Mundo Pine, plataforma de jogos terapêuticos colaborativos para psicólogas infantojuvenis.",
      },
    ],
  }),
  component: TermosPage,
});

function TermosPage() {
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
            Termos de Uso
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            Última atualização: 18 de maio de 2026
          </p>

          <section className="space-y-4 text-foreground/90 leading-relaxed">
            <h2 className="text-xl font-bold mt-6">1. Aceitação</h2>
            <p>
              Ao acessar ou utilizar o Mundo Pine ("Plataforma"), você
              declara ter lido, compreendido e concordado com estes Termos de
              Uso. Caso não concorde, por favor não utilize a Plataforma.
            </p>

            <h2 className="text-xl font-bold mt-6">2. Sobre a Plataforma</h2>
            <p>
              O Mundo Pine é uma ferramenta de apoio para psicólogas e
              psicólogos que atendem crianças e adolescentes online,
              oferecendo jogos e recursos terapêuticos colaborativos. A
              Plataforma <strong>não substitui</strong> o julgamento clínico
              profissional e não presta atendimento psicológico diretamente.
            </p>

            <h2 className="text-xl font-bold mt-6">3. Cadastro e Conta</h2>
            <p>
              O cadastro é restrito a profissionais habilitados (ou em
              formação supervisionada). Você é responsável por manter a
              confidencialidade de suas credenciais e por todas as atividades
              realizadas em sua conta.
            </p>

            <h2 className="text-xl font-bold mt-6">
              4. Uso Adequado
            </h2>
            <p>Você concorda em <strong>não</strong>:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Utilizar a Plataforma para fins ilícitos ou que violem direitos
                de terceiros;
              </li>
              <li>
                Compartilhar suas credenciais ou permitir acesso indevido por
                terceiros;
              </li>
              <li>
                Tentar burlar, descompilar, copiar ou redistribuir partes da
                Plataforma;
              </li>
              <li>
                Coletar dados de pacientes sem consentimento informado dos
                responsáveis legais.
              </li>
            </ul>

            <h2 className="text-xl font-bold mt-6">
              5. Sigilo Profissional e Dados de Pacientes
            </h2>
            <p>
              Você reconhece que o sigilo profissional é responsabilidade
              exclusiva do(a) psicólogo(a) usuário(a), conforme o Código de
              Ética da Profissão (Resolução CFP nº 010/2005). Recomendamos
              utilizar identificadores não sensíveis (apelidos, iniciais) ao
              registrar informações de pacientes.
            </p>

            <h2 className="text-xl font-bold mt-6">
              6. Propriedade Intelectual
            </h2>
            <p>
              Todo o conteúdo, código, marca e identidade visual da Plataforma
              são de propriedade exclusiva de seus titulares e protegidos pela
              legislação brasileira de direitos autorais (Lei 9.610/98) e de
              software (Lei 9.609/98). O uso da Plataforma não transfere
              qualquer direito de propriedade ao usuário.
            </p>

            <h2 className="text-xl font-bold mt-6">
              7. Limitação de Responsabilidade
            </h2>
            <p>
              A Plataforma é fornecida "como está". Não nos responsabilizamos
              por decisões clínicas tomadas com base no uso dos jogos, por
              indisponibilidades temporárias de serviços de terceiros, ou por
              danos indiretos decorrentes do uso ou da impossibilidade de uso.
            </p>

            <h2 className="text-xl font-bold mt-6">
              8. Modificações
            </h2>
            <p>
              Podemos atualizar estes Termos a qualquer momento. Alterações
              relevantes serão comunicadas com antecedência razoável. O uso
              continuado após a atualização representa concordância com os
              novos Termos.
            </p>

            <h2 className="text-xl font-bold mt-6">9. Encerramento</h2>
            <p>
              Podemos suspender ou encerrar contas que violem estes Termos.
              Você pode encerrar sua conta a qualquer momento solicitando a
              exclusão pelos canais de contato.
            </p>

            <h2 className="text-xl font-bold mt-6">
              10. Lei Aplicável e Foro
            </h2>
            <p>
              Estes Termos são regidos pelas leis da República Federativa do
              Brasil. Fica eleito o foro do domicílio do usuário consumidor
              para dirimir eventuais controvérsias.
            </p>

            <h2 className="text-xl font-bold mt-6">11. Contato</h2>
            <p>
              Dúvidas sobre estes Termos podem ser enviadas ao responsável
              pela Plataforma pelos canais informados na Política de
              Privacidade.
            </p>
          </section>

          <div className="mt-10 pt-6 border-t border-border text-sm text-muted-foreground">
            Veja também a{" "}
            <Link to="/privacidade" className="text-primary underline">
              Política de Privacidade
            </Link>
            .
          </div>
        </article>
      </div>
    </main>
  );
}
