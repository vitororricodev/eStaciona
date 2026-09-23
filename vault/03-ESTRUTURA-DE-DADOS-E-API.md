# Estrutura de dados e API

## Migrations

Aplicar em ordem, primeiro em homologação:

1. `001_initial.sql`
2. `002_tariffs_advanced.sql`
3. `003_mvp_complete.sql`
4. `004_hardening.sql`
5. `005_admin_onboarding.sql`
6. `006_stay_customer_flags.sql`
7. `007_atomic_operations_and_tariff_snapshot.sql`
8. `008_security_rls_rate_limit_and_provisioning.sql`
9. `009_saas_licensing_and_master_panel.sql`
10. `010_separate_organization_and_license_management.sql`

As migrations 007–010 são obrigatórias para a versão 1.1.0 final. O schema implantado deve ser comparado antes do rollout.

## Estruturas novas/relevantes

- `stays.tariff_snapshot`: JSON validado e imutável após definido.
- `api_rate_limits`: contadores persistentes das rotas públicas, com RLS.
- `platform_users`: masters persistidos; `PLATFORM_ADMIN_USER_IDS` continua como bootstrap/emergência.
- `saas_plans`: catálogo comercial com duração e preço configuráveis.
- `organization_licenses`: estado, validade, bloqueio e snapshot do plano por organização.
- `license_events` e `platform_audit_logs`: rastreabilidade imutável da plataforma.
- Perfis, organizações, veículos, tarifas, permanências, serviços, caixa, movimentos e auditoria permanecem segregados por organização.

## RPCs críticas

- `start_stay_atomic`: cria/resolve dados de entrada e grava o snapshot.
- `finish_stay_atomic`: bloqueia a permanência, calcula e encerra no banco.
- `close_cash_session_atomic`: encerra caixa com consistência.
- `provision_organization_atomic`: provisiona organização sem estado parcial.
- `complete_password_change`: conclui a troca obrigatória com validação do usuário.
- `consume_rate_limit`: aplica janela/limite de forma persistente.
- `provision_organization_with_license_atomic`: cria organização e licença inicial na mesma transação.
- `manage_organization_license_atomic`: bloqueia, libera, renova ou troca plano com auditoria.
- Na migration 010, `manage_organization_license_atomic` também cria atomicamente a primeira licença de uma organização já cadastrada.
- `organization_license_status`: calcula expiração usando o horário do servidor.

## Contratos de API

Toda rota privada deve autenticar, resolver papel/organização no servidor, validar entrada e devolver o mínimo necessário. Rotas públicas devem usar respostas uniformes, rate limit e jamais retornar dados pessoais ou administrativos.

Mudanças de schema exigem migration incremental, teste de contrato e atualização deste arquivo.

## Administração Master de organizações e usuários

- `POST /api/platform/organizations`: cria organização, proprietário e tarifa padrão sem liberar licença automaticamente.
- `PATCH /api/platform/organizations/[organizationId]`: edita o nome do estacionamento.
- `/api/platform/organizations/[organizationId]/users`: lista e inclui usuários com e-mail do Supabase Auth.
- `/api/platform/organizations/[organizationId]/users/[userId]`: edita nome, e-mail, papel e situação, ou exclui o usuário.
- `/api/platform/organizations/[organizationId]/users/[userId]/password`: redefine senha provisória e exige troca no próximo acesso.
- Todas essas rotas exigem Master no servidor e registram `platform_audit_logs`; o último proprietário ativo não pode ser removido ou rebaixado.
