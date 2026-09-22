# Deploy na Vercel — eStaciona 1.0.12 (candidato)

## Variáveis obrigatórias

Configure em **Vercel > Project > Settings > Environment Variables**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_ANON
SUPABASE_SERVICE_ROLE_KEY=SUA_CHAVE_SERVICE_ROLE
NEXT_PUBLIC_APP_URL=https://SEU-DOMINIO.vercel.app
RATE_LIMIT_SECRET=SEGREDO_ALEATORIO_DE_32_BYTES_OU_MAIS
```

A `SUPABASE_SERVICE_ROLE_KEY` é segredo de servidor. Nunca prefixe com `NEXT_PUBLIC_`.

## Banco

Execute no Supabase, nesta ordem:

1. `supabase/migrations/001_initial.sql`
2. `supabase/migrations/002_tariffs_advanced.sql`
3. `supabase/migrations/003_mvp_complete.sql`
4. `supabase/migrations/004_hardening.sql`
5. `supabase/migrations/005_admin_onboarding.sql`
6. `supabase/migrations/006_stay_customer_flags.sql`
7. `supabase/migrations/007_atomic_operations_and_tariff_snapshot.sql`
8. `supabase/migrations/008_security_rls_rate_limit_and_provisioning.sql`

## Build

Na Vercel use os padrões do Next.js:

- Framework Preset: Next.js
- Install Command: `npm ci`
- Build Command: `npm run build`
- Output Directory: padrão do Next.js

## Observação

A versão 1.0.4 inclui correções de tipagem para Vercel, hardening de RLS, resolução correta de perfil multiusuário e finalização/pagamento atômicos.
