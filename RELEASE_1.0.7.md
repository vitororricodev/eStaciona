# eStaciona 1.0.7

Ajuste pontual da tela inicial e do tema escuro, sem refatorar os fluxos operacionais existentes.

## Alterações

- A tela inicial agora identifica a sessão no servidor.
- Usuário autenticado não vê mais o botão **Entrar**; vê **Operação** (ou **Alterar senha**, quando obrigatório).
- Usuário não autenticado permanece na landing page; módulos internos são exibidos apenas como apresentação e não navegam para áreas protegidas.
- O único caminho de autenticação continua sendo o botão **Entrar / Entrar no eStaciona**.
- Usuário autenticado mantém os atalhos para Operação e Gestão.
- Dark mode corrigido especificamente na landing page.
- Wordmark da marca recebe tratamento de contraste no tema escuro.

Nenhuma migration de banco é necessária para esta versão.
