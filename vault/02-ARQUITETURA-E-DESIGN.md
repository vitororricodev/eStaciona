# Arquitetura e design

## Stack confirmada

- Next.js 15 com App Router, React 19 e TypeScript.
- Tailwind CSS para interface mobile-first.
- Supabase Auth, PostgreSQL, RLS e RPCs.
- Zod para validação de entrada.
- Vitest, ESLint, Prettier e CI.
- `package-lock.json` versionado; instalações reproduzíveis usam `npm ci`.

A versão instalada exata é determinada pelo lockfile, não apenas pelos intervalos do `package.json`.

## Camadas

- `app/**/page.tsx`: páginas e fluxos.
- `app/api/**/route.ts`: limites HTTP e autorização server-side.
- `lib/`: domínio, permissões, integrações e clientes Supabase.
- `components/`: navegação, identidade e componentes reutilizáveis.
- `supabase/migrations/`: schema, RLS, triggers e RPCs.
- `tests/`: testes unitários e contratos SQL.
- `vault/`: memória arquitetural obrigatória e histórico.

## Decisões vigentes

- Escopo multiempresa é resolvido no servidor e reforçado por RLS.
- `service_role` só pode existir em código server-only e não substitui autorização.
- Entrada, saída, fechamento de caixa e provisionamento usam operações atômicas.
- `stays.tariff_snapshot` preserva a regra tarifária da entrada.
- Rotas públicas usam rate limiting persistente por hash.
- `lib/version.ts` centraliza a versão exibida pela aplicação.
- `profiles.active` controla usuário; `organization_licenses` controla o acesso comercial da organização.
- `current_org_id()` só libera o tenant quando a licença está válida.
- O painel `/master` e suas APIs validam o master no servidor.
- Mudanças de licença usam RPC atômica, auditoria, Supabase Realtime e polling de contingência.
- Cadastro de estacionamento/usuários e licenciamento são módulos Master separados.
- Usuários gerenciados pelo Master continuam vinculados ao Supabase Auth e a `profiles`; senha nunca é armazenada pela aplicação.
- A primeira licença pode ser ativada depois do cadastro pela RPC atômica atualizada na migration 010.

Consulte [[03-ESTRUTURA-DE-DADOS-E-API]] e [[07-SEGURANCA-AUTENTICACAO-E-ACESSO]].
