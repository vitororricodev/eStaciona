# eStaciona 1.1.0 — versão final

## Gestão SaaS

- Painel Master exclusivo em `/master`.
- Gestão de estacionamentos ativos, bloqueados, expirados e pendentes.
- Cadastro e manutenção de planos.
- Liberação, renovação, bloqueio, desbloqueio e troca de plano.
- Auditoria das ações da plataforma.

## Segurança e tempo real

- Licença validada no servidor e no PostgreSQL.
- RLS bloqueia acesso operacional quando a licença deixa de ser válida.
- Supabase Realtime atualiza sessões abertas sem recarregar a página.
- Polling de contingência e validação ao retornar o foco para a janela.
- Administradores de plataforma não dependem de licença de estacionamento.

## Banco

Aplicar `009_saas_licensing_and_master_panel.sql` depois das migrations 001–008. Organizações já existentes recebem uma licença mensal inicial de 30 dias. Os preços iniciais dos planos são zero e devem ser configurados pelo painel antes da comercialização.

## Limites da validação

A implementação foi validada localmente. A migration, o RLS multi-tenant e o Realtime ainda devem ser exercitados no projeto Supabase de destino antes de liberar clientes reais.
