# SECURITY.md — Mundo Pine

Documentação técnica das medidas de segurança e conformidade LGPD da
plataforma **Mundo Pine** (ferramentas terapêuticas para psicologia
infantojuvenil).

> **Princípios fundadores:** *Privacy by Design*, *Security by Design*,
> *Minimização de dados* e *Defesa em profundidade*. Última auditoria
> interna: **28 de maio de 2026**.

---

## 1. Conformidade LGPD (Lei 13.709/2018)

### 1.1 Minimização de dados (art. 6º, III)

A Plataforma **não armazena**:

- Prontuários ou anotações clínicas
- Transcrições de sessão
- Nomes, idades ou qualquer PII de pacientes (crianças/adolescentes)
- Conteúdo gerado durante os jogos (desenhos, respostas, falas)

Tudo o que acontece dentro de uma sessão colaborativa (`/sala/$code`)
é **efêmero**: trafega via Supabase Realtime entre os dois pares
conectados e não é persistido em banco. As tabelas `sessions` e
`patients` foram removidas em 2026-05-28 para eliminar a superfície
de risco.

**Único dado pessoal armazenado:** cadastro profissional da(o)
psicóloga(o) — nome, e-mail e hash de senha — na tabela `profiles`.

### 1.2 Direitos do titular (art. 18)

| Direito | Como exercer |
|---|---|
| Acesso aos dados | `/conta` mostra o e-mail e o profissional pode solicitar exportação ao DPO |
| Correção | Atualização via `/conta` (em desenvolvimento) ou suporte |
| **Eliminação** | Botão "Excluir minha conta" em `/conta` — exclusão imediata e irreversível |
| Revogação de consentimento | Equivale à exclusão de conta |

### 1.3 Bases legais

- **Execução de contrato** (art. 7º, V): fornecimento da Plataforma.
- **Legítimo interesse** (art. 7º, IX): segurança e prevenção a fraudes
  (logs mínimos de autenticação).

### 1.4 Política de retenção

- Dados de cadastro: enquanto a conta existir.
- Logs de autenticação: rotacionados pelo provedor de infraestrutura.
- Após exclusão de conta: profile + roles deletados imediatamente; o
  registro em `auth.users` é removido via `supabaseAdmin.auth.admin.deleteUser`.

---

## 2. Autenticação e gestão de sessão

- **Provedor:** Supabase Auth.
- **Métodos:** e-mail/senha + Google OAuth (via broker Lovable —
  não usamos `signInWithOAuth` direto).
- **HIBP ativado:** senhas presentes em vazamentos públicos
  (haveibeenpwned) são rejeitadas no cadastro e na troca.
- **Hash de senha:** bcrypt (gerenciado pelo Supabase).
- **Tokens:** JWT assinado, transportado em `Authorization: Bearer`
  via middleware `attachSupabaseAuth` em todas as Server Functions.
- **Recuperação de senha:** fluxo `/forgot-password` → e-mail →
  `/reset-password` com token de uso único.
- **Política de sessão:** `installSessionOnlyGuard()` em
  `src/lib/session-policy.ts` força expiração configurável.

---

## 3. Modelo de autorização

### 3.1 Roles em tabela separada

Roles **nunca** ficam em `profiles`. Vivem em `public.user_roles` com
enum `app_role` (`admin`, `psicologo`). Verificação via função
`SECURITY DEFINER` `public.has_role(uuid, app_role)`.

### 3.2 Row-Level Security

Toda tabela `public` tem RLS habilitada. Policies sempre escopadas em
`auth.uid()`.

**`user_roles` — hardening anti-escalation:**

- Policy PERMISSIVE "Admins manage roles" (ALL) → admins.
- Policy PERMISSIVE "Users view own roles" (SELECT) → próprio user_id.
- **Policies RESTRICTIVE adicionais** em INSERT/UPDATE/DELETE
  exigindo `has_role(admin)` → bloqueio explícito de escalonamento.
- `handle_new_user` (trigger, SECURITY DEFINER) atribui role
  `psicologo` no signup, bypassando RLS como dono.

### 3.3 Validação no backend

`src/lib/admin.functions.ts` revalida admin via `ensureAdmin(userId)`
em **todas** as operações administrativas. O frontend nunca decide
autorização sozinho.

---

## 4. Proteção contra ataques

| Vetor | Mitigação |
|---|---|
| **SQL Injection** | Supabase JS client (parametrização nativa). Server fns usam Zod antes de qualquer query. |
| **XSS** | React escapa tudo por padrão; sem `dangerouslySetInnerHTML` com conteúdo de usuário. |
| **CSRF** | Auth via Bearer JWT em header (não cookie automático); SameSite por padrão no Supabase. |
| **Vazamento de tokens** | `SUPABASE_SERVICE_ROLE_KEY` apenas em `client.server.ts` (server-only). Import protection bloqueia uso no bundle do cliente. |
| **Brute force** | HIBP + rate limit do Supabase Auth. |
| **Privilege escalation** | Policies RESTRICTIVE em `user_roles` (ver §3.2). |
| **Abuso de API** | `/api/public/lentes-sfx` rate-limited por `cf-connecting-ip` (header confiável de borda); cache em memória; chave ElevenLabs nunca exposta. |
| **Spam/scraping** | Endpoints sensíveis exigem autenticação; público apenas em `/api/public/*` com rate limit. |
| **Upload malicioso** | Nenhum endpoint de upload de arquivo do usuário. Imagens são assets de build. |

### 4.1 Sanitização de inputs

Todo input que chega no backend passa por **Zod**
(`.inputValidator((input) => z.object({...}).parse(input))`). Sem
validador → server fn não compila no padrão do projeto.

---

## 5. Segredos e variáveis de ambiente

| Variável | Escopo | Onde |
|---|---|---|
| `VITE_SUPABASE_URL` | Público (build) | Client + server |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Público (anon, sujeito a RLS) | Client |
| `SUPABASE_URL` | Server | `process.env` em server fns |
| `SUPABASE_PUBLISHABLE_KEY` | Server | `process.env` em server fns |
| `SUPABASE_SERVICE_ROLE_KEY` | **Segredo** — bypassa RLS | Apenas em `client.server.ts`; nunca importado no cliente |
| `ELEVENLABS_API_KEY` | Segredo | Apenas em server route `lentes-sfx.ts` |
| `LOVABLE_API_KEY` | Segredo | Gerenciado pela plataforma |

Regras:

- Nenhuma chave secreta no frontend ou no `.env` exposto.
- `process.env.*` lido apenas dentro de `.handler()` de server fns.
- `.server.ts` e `client.server.ts` rejeitados pelo bundler client-side.

---

## 6. Criptografia

- **Em trânsito:** HTTPS/TLS 1.2+ em toda a borda Cloudflare + Supabase.
- **Em repouso:** AES-256 em disco (gerenciado por Supabase + GCP).
- **Senhas:** bcrypt (Supabase Auth).
- **JWT:** HS256 com chave gerenciada por Supabase.

---

## 7. Endpoints públicos

Apenas dois caminhos públicos sem autenticação:

- `GET /` — landing page (HTML estático, sem PII).
- `GET /api/public/lentes-sfx?lens=…` — gera SFX para o jogo
  "Entre Lentes". Rate-limited por `cf-connecting-ip`, cache em
  memória, sem PII.

Todo o restante exige sessão Supabase válida.

---

## 8. Backups e recuperação

- **Backups automáticos diários** do banco Supabase (PITR habilitado
  pela plataforma).
- **Restore:** procedimento via painel Lovable Cloud em até 24h.
- **Disaster recovery:** RTO ≤ 24h, RPO ≤ 24h.

---

## 9. Logs e observabilidade

- Logs de autenticação: Supabase Auth (retenção do provedor).
- Logs de server fn: Cloudflare Workers + Lovable Cloud.
- Erros não vazam stack trace nem mensagem do provider para o cliente
  (server fns retornam mensagem genérica).

---

## 10. Riscos aceitos e roadmap

### Aceitos

- **`role` no search param de `/sala/$code`:** controla apenas
  affordances de UI (lock do whiteboard, atribuição visual em
  mensagens Realtime). Nenhuma escrita privilegiada de banco depende
  desse valor; sala é 100% efêmera. Refatorar para gating server-side
  está no roadmap caso a sala passe a expor dados persistentes.

### Roadmap

- Exportação de dados em JSON (portabilidade LGPD).
- Logs de acesso por usuário (auditoria detalhada).
- Refatoração do modelo de sala para validação server-side de papel.
- Página dedicada de gestão do consentimento dos responsáveis legais.

---

## 11. Contato e DPO

E-mail do encarregado pelo tratamento de dados pessoais:
**contato@mundo-pine.com.br** (substituir antes de publicar).

Relate vulnerabilidades de segurança para o mesmo endereço com a
tag `[SECURITY]` no assunto. Não divulgue publicamente até confirmação
e correção.
