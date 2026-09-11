# eStaciona 1.0.5

## Escopo desta versão

Esta versão foi criada de forma incremental, sem refatorar os fluxos estáveis do MVP.

### Gestão de equipe
- Removido o fluxo obrigatório de convite por e-mail.
- Proprietário e gerente podem cadastrar funcionário diretamente com nome, e-mail, senha e perfil.
- O usuário é criado confirmado no Supabase Auth e vinculado à mesma organização.
- Em caso de falha ao criar o perfil, o usuário do Auth é removido para evitar cadastro órfão.

### Administração SaaS de estacionamentos
- Nova tela `/admin/estacionamentos`.
- Nova opção no Dashboard exibida apenas ao administrador da plataforma.
- Criação de organização, proprietário e tarifa padrão em um único fluxo.
- O proprietário recebe uma senha provisória definida no cadastro.
- No primeiro acesso, o sistema obriga a troca da senha antes de liberar operação/admin.

### Segurança da administração SaaS
Defina na Vercel uma variável server-only:

`PLATFORM_ADMIN_USER_IDS=<UUID_ADMIN_1>,<UUID_ADMIN_2>`

Não use prefixo `NEXT_PUBLIC_` nessa variável.

### Banco de dados
Execute após as migrations 001-004:

`supabase/migrations/005_admin_onboarding.sql`

### Modo escuro
- Toggle de claro/escuro no cabeçalho do sistema e na tela de login.
- Preferência persistida no navegador.
- Respeita o tema do sistema operacional quando o usuário ainda não escolheu uma preferência.
- Camada global de compatibilidade mantém as telas atuais sem refatoração visual ampla.

## Ordem recomendada de publicação
1. Executar migration `005_admin_onboarding.sql` no Supabase.
2. Cadastrar `PLATFORM_ADMIN_USER_IDS` na Vercel.
3. Subir esta versão no Git.
4. Validar `/api/health` retornando `1.0.5`.
5. Testar cadastro de funcionário e cadastro de novo estacionamento.
