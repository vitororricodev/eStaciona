# Segurança, autenticação e acesso

## Controles confirmados na versão 1.1.0

- Autenticação Supabase validada no servidor.
- Autorização por papel centralizada em `lib/permissions.ts` e aplicada nas rotas.
- Escopo de organização reforçado em APIs, RPCs e políticas RLS.
- Políticas sensíveis foram endurecidas pela migration 008.
- `service_role` fica restrita ao backend e não concede acesso sem checagem de negócio.
- Rotas públicas usam `api_rate_limits` e `consume_rate_limit`.
- Identificadores do rate limit são armazenados como hash; dados brutos não são persistidos.
- Token público é UUID aleatório.
- Consulta por placa exige confirmação do WhatsApp completo.
- Troca obrigatória de senha é finalizada server-side.
- Provisionamento de organização é atômico.
- Masters são validados server-side por UUID/configuração e `platform_users`.
- Licença é validada por middleware, APIs, RLS e RPCs.
- Vitor e Levi são isentos porque administram a plataforma, não porque possuem licença especial.
- Supabase Realtime bloqueia/libera telas abertas; polling de contingência evita depender apenas do canal.
- Gestão Master de usuários valida organização e usuário no servidor antes de usar Auth Admin.
- E-mails vêm do Supabase Auth; senhas provisórias nunca são persistidas em tabelas ou auditoria.
- Exclusão/rebaixamento do último proprietário ativo é bloqueada no backend.
- Inclusão, edição, exclusão e redefinição de senha pelo Master geram auditoria da plataforma.

## Matriz resumida

| Capacidade                      |  platform_admin | admin_master |              admin | operator |
| ------------------------------- | --------------: | -----------: | -----------------: | -------: |
| Gerir plataforma/organizações   |             Sim |          Não |                Não |      Não |
| Gerir organização própria       | Conforme função |          Sim | Conforme permissão |      Não |
| Operação diária                 | Conforme escopo |          Sim |                Sim |      Sim |
| Ações administrativas sensíveis |      Explícitas |          Sim | Conforme permissão |      Não |

A matriz efetiva é definida por `lib/permissions.ts`, rotas e RLS; não deve ser duplicada no cliente como fonte de verdade.

## Pendências externas

Ainda é necessário testar RLS com dois tenants reais, concorrência no PostgreSQL, rotação/retenção de dados do rate limit e configuração dos segredos no ambiente implantado.
