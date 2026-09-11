# eStaciona 1.0.6 — Admin Master da Plataforma

Esta versão separa explicitamente a administração do SaaS da administração de cada estacionamento.

## Admin Master da Plataforma

O cadastro de novos estacionamentos é exclusivo dos usuários definidos em `PLATFORM_ADMIN_USER_IDS`.

Configure na Vercel:

```env
PLATFORM_ADMIN_USER_IDS=2d3bda10-c385-48ef-afa9-fd17769a14ec,UUID_DO_SOCIO
```

- Separe os UUIDs por vírgula.
- O primeiro UUID acima é o Admin Master já informado.
- Substitua `UUID_DO_SOCIO` pelo UUID do usuário do sócio no Supabase Auth.
- Quando `PLATFORM_ADMIN_USER_IDS` estiver preenchido, a variável antiga `PLATFORM_ADMIN_USER_ID` é ignorada.

## Proteção aplicada

- O card **Cadastrar estacionamento** só aparece para Admin Master.
- A página `/admin/estacionamentos` valida a permissão e redireciona usuários comuns.
- A API `/api/platform/organizations` continua bloqueando qualquer chamada não autorizada com HTTP 403.
- A interface identifica claramente o perfil como **Admin Master da Plataforma**.

Os perfis `owner`, `manager` e `operator` continuam sendo perfis internos de cada estacionamento e não concedem administração da plataforma.
