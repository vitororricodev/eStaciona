# eStaciona 1.1.0 — versão final

## Gestão SaaS

- Painel Master exclusivo em `/master`.
- Gestão de estacionamentos ativos, bloqueados, expirados e pendentes.
- Cadastro e manutenção de planos.
- Liberação, renovação, bloqueio, desbloqueio e troca de plano.
- Auditoria das ações da plataforma.
- Cadastro de estacionamentos separado do controle de licenças.
- Gestão Master de usuários com visualização de e-mail, edição, ativação, exclusão e redefinição de senha.
- Proteção do último proprietário ativo e auditoria das ações sobre usuários.

## UX e navegação

- Botão Voltar padronizado nas telas operacionais, administrativas, Master, login e consulta pública.
- Home compactada, sem o selo “Mobile-first para estacionamentos”.
- Remoção do bloco redundante “3 fluxos. 1 operação conectada”.
- Um único conjunto de módulos clicáveis permanece na página inicial.

## Segurança e tempo real

- Licença validada no servidor e no PostgreSQL.
- RLS bloqueia acesso operacional quando a licença deixa de ser válida.
- Supabase Realtime atualiza sessões abertas sem recarregar a página.
- Polling de contingência e validação ao retornar o foco para a janela.
- Administradores de plataforma não dependem de licença de estacionamento.

## Banco

Aplicar `009_saas_licensing_and_master_panel.sql` e depois `010_separate_organization_and_license_management.sql`. A 010 permite cadastrar a organização sem licença e criar a primeira licença posteriormente, de forma atômica. Organizações já existentes recebem uma licença mensal inicial de 30 dias pela 009. Os preços iniciais dos planos são zero e devem ser configurados pelo painel antes da comercialização.

## Limites da validação

A implementação foi validada localmente. As migrations 009–010, o RLS multi-tenant e o Realtime ainda devem ser exercitados no projeto Supabase de destino antes de liberar clientes reais.
