# 1.1.0 — versão final

- Painel Master SaaS em `/master` para clientes, planos, licenças e auditoria.
- Planos mensal (30 dias), semestral (180 dias) e anual (365 dias), com preço configurável.
- Licenças separadas de usuários, com snapshots comerciais e validade calculada no servidor.
- Liberação, renovação, troca de plano, bloqueio e cancelamento por RPC transacional.
- Bloqueio imediato em RLS/APIs e atualização de sessões abertas via Supabase Realtime, com polling de contingência.
- Vitor e Levi permanecem sem validade por serem administradores da plataforma identificados por UUID.
- Migration `009_saas_licensing_and_master_panel.sql`, testes e Vault atualizados.
- Organizações existentes recebem licença mensal inicial de 30 dias para evitar interrupção durante o rollout.

# 1.0.12 — não publicado

- Troca obrigatória de senha executada e auditada no servidor, sem endpoint de liberação isolada.
- Rate limiting persistente e anonimizado para lookup público, portal por token e health check.
- Snapshot imutável da tarifa em cada nova permanência, com fallback para registros legados.
- Entrada e fechamento de caixa convertidos para RPCs transacionais com lock.
- Valor final recalculado no PostgreSQL; a RPC não confia no total enviado pelo cliente.
- RLS revisada com políticas explícitas por operação, organização e papel.
- RBAC centralizado; `operator` não acessa Gestão e Admin Master permanece separado do tenant.
- Navegação administrativa, cards, botão Voltar e feedback de cadastro revisados para mobile/acessibilidade.
- Versão centralizada, lockfile/CI/testes/lint adicionados.
- Migrations `007_atomic_operations_and_tariff_snapshot.sql` e `008_security_rls_rate_limit_and_provisioning.sql`.
- Vault técnico incorporado ao projeto, corrigido para 1.0.12 e protegido por protocolo obrigatório de consulta/atualização.
- Versionamento corrigido: esta evolução mantém a série 1.0.x e não constitui a versão 1.1.0.

# 1.0.11

- Validação de placa brasileira no frontend/backend.
- Flags TAG e Mensalista na entrada.
- Envio manual do ticket via wa.me com mensagem pronta.
- Hardening de responsividade mobile.

# 1.0.10

- Redefinição administrativa de senha provisória pela tela Equipe.
- Primeiro login obrigatório com troca de senha.
- Compatibilidade com usuários antigos criados por convite.
- Regras: owner → manager/operator; manager → operator.
- Auditoria de redefinição de senha.

# Changelog

## 1.0.9

- Harmonização da marca com ícone maior e proporções refinadas.
- Landing page revisada com hierarquia, contraste, espaçamento e profundidade visual aprimorados.
- Microanimações sutis de entrada respeitando `prefers-reduced-motion`.
- Splash screen animada exibida uma vez por sessão.
- Tema claro/escuro preservado e integrado à nova apresentação visual.

## 1.0.4

- Corrige tipagem de cookies do Supabase em `lib/supabase/server.ts` e `middleware.ts`.
- Corrige resolução de perfil em organizações com múltiplos funcionários.
- Adiciona política RLS para escrita de auditoria.
- Torna finalização + pagamento atômicos via `finish_stay_atomic`.
- Fortalece consulta pública exigindo o WhatsApp cadastrado completo.
- Adiciona `/api/health` para validar ambiente e acesso ao banco.
- Mantém as correções de `useEffect` necessárias para o build da Vercel.

## 1.0.1 — Identidade visual

- Aplicada a logo oficial do eStaciona.
- Ícone oficial utilizado como favicon e ícone PWA.
- Mantida a assinatura “O controle do seu pátio na palma da mão.”.

## 1.0.0

- Portal do cliente.
- Relatórios e movimentações administrativas.
- Clientes e veículos recorrentes.
- Serviços adicionais por permanência.
- Equipe e permissões.
- Caixa com abertura, suprimento, sangria e fechamento.
- Auditoria.
- Adaptadores opcionais WhatsApp e consulta veicular.
- PWA.

## 0.4.0

- Motor tarifário avançado e pátio.

## 0.3.0

- Núcleo operacional: entrada, QR, cobrança e saída.

## 1.0.5

- Cadastro manual de equipe com e-mail e senha, sem convite.
- Administração SaaS para criação de novos estacionamentos.
- Senha provisória obrigatoriamente alterada no primeiro acesso.
- Controle de acesso da administração SaaS por `PLATFORM_ADMIN_USER_ID`.
- Modo escuro com preferência persistida.
- Migration `005_admin_onboarding.sql`.

## 1.0.6

- Suporte a múltiplos Admins Master da Plataforma via `PLATFORM_ADMIN_USER_IDS`.
- Cadastro de estacionamentos visível e acessível somente para Admin Master.
- Identificação visual de Admin Master separada dos perfis owner/manager/operator.
