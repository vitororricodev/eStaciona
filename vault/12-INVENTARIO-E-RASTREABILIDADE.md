# Inventário e rastreabilidade

## Referência

- Projeto: eStaciona.
- Versão: `1.1.0`.
- Stack: Next.js App Router, React, TypeScript, Tailwind e Supabase.
- Migrations: 001–010.
- Qualidade: lockfile, ESLint, Prettier, Vitest e workflow de CI.
- Documentação operacional: raiz do projeto e `vault/`.

## Áreas rastreadas

| Área                     | Código principal                                         | Documentação                                                            |
| ------------------------ | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| Autenticação/autorização | `lib/authz.ts`, `lib/permissions.ts`, middleware e APIs  | [[07-SEGURANCA-AUTENTICACAO-E-ACESSO]]                                  |
| Permanências/tarifas     | APIs de stays, `lib/stayTotals.ts`, migrations 007       | [[03-ESTRUTURA-DE-DADOS-E-API]], [[06-MODULOS-E-FLUXOS]]                |
| Rotas públicas           | `app/api/public/**`, `lib/rateLimit.ts`, migration 008   | [[07-SEGURANCA-AUTENTICACAO-E-ACESSO]]                                  |
| Plataforma/organizações  | `/master/estacionamentos`, APIs platform/users           | [[06-MODULOS-E-FLUXOS]], [[07-SEGURANCA-AUTENTICACAO-E-ACESSO]]         |
| Licenças e planos        | `/master/licencas`, `lib/license.ts`, migrations 009–010 | [[03-ESTRUTURA-DE-DADOS-E-API]], [[07-SEGURANCA-AUTENTICACAO-E-ACESSO]] |
| UI/navegação             | `app/**`, `components/**`, CSS                           | [[08-UX-UI-E-IDENTIDADE]]                                               |
| Deploy/qualidade         | scripts npm, workflow, docs raiz                         | [[09-DEPLOY-AMBIENTE-E-OPERACAO]]                                       |
| Memória técnica          | `vault/**`                                               | [[14-PROTOCOLO-DE-ATUALIZACAO-DO-VAULT]]                                |

## Regra de rastreabilidade

Toda mudança deve atualizar ao menos o documento de domínio afetado e [[10-MUDANCAS-RECENTES-E-LOGS]]. Mudanças que alterem riscos atualizam [[11-LACUNAS-RISCOS-E-DECISOES]]; mudanças estruturais atualizam este inventário.
