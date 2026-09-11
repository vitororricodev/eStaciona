# Deploy na Vercel — eStaciona 1.0.4

## Variáveis obrigatórias

Configure em **Vercel > Project > Settings > Environment Variables**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_ANON
SUPABASE_SERVICE_ROLE_KEY=SUA_CHAVE_SERVICE_ROLE
NEXT_PUBLIC_APP_URL=https://SEU-DOMINIO.vercel.app
```

A `SUPABASE_SERVICE_ROLE_KEY` é segredo de servidor. Nunca prefixe com `NEXT_PUBLIC_`.

## Banco

Execute no Supabase, nesta ordem:

1. `supabase/migrations/001_initial.sql`
2. `supabase/migrations/002_tariffs_advanced.sql`
3. `supabase/migrations/003_mvp_complete.sql`
4. `supabase/migrations/004_hardening.sql`

## Build

Na Vercel use os padrões do Next.js:

- Framework Preset: Next.js
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: padrão do Next.js

## Observação

A versão 1.0.4 inclui correções de tipagem para Vercel, hardening de RLS, resolução correta de perfil multiusuário e finalização/pagamento atômicos.
