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

As migrations 007 e 008 são parte obrigatória da versão 1.0.12. O schema implantado não foi consultado nesta revisão e pode ter drift.

## Estruturas novas/relevantes

- `stays.tariff_snapshot`: JSON validado e imutável após definido.
- `api_rate_limits`: contadores persistentes das rotas públicas, com RLS.
- Perfis, organizações, veículos, tarifas, permanências, serviços, caixa, movimentos e auditoria permanecem segregados por organização.

## RPCs críticas

- `start_stay_atomic`: cria/resolve dados de entrada e grava o snapshot.
- `finish_stay_atomic`: bloqueia a permanência, calcula e encerra no banco.
- `close_cash_session_atomic`: encerra caixa com consistência.
- `provision_organization_atomic`: provisiona organização sem estado parcial.
- `complete_password_change`: conclui a troca obrigatória com validação do usuário.
- `consume_rate_limit`: aplica janela/limite de forma persistente.

## Contratos de API

Toda rota privada deve autenticar, resolver papel/organização no servidor, validar entrada e devolver o mínimo necessário. Rotas públicas devem usar respostas uniformes, rate limit e jamais retornar dados pessoais ou administrativos.

Mudanças de schema exigem migration incremental, teste de contrato e atualização deste arquivo.
