# Deploy, ambiente e operação

## Build reproduzível

Use `npm ci` com o `package-lock.json` versionado e execute `npm run verify` antes de publicar.

## Variáveis

Consulte `.env.example`. Segredos administrativos e `RATE_LIMIT_SECRET` são server-only e nunca devem usar prefixo `NEXT_PUBLIC_`. Se `RATE_LIMIT_SECRET` não estiver definido, o backend deriva a chave HMAC da service role; em produção, prefira segredo dedicado.

## Banco

Aplicar migrations 001–010 em ordem, primeiro em homologação. Comparar o schema implantado com o repositório, testar rollback operacional e confirmar as RPCs/políticas antes do deploy da aplicação.

## Checklist mínimo

- [ ] Variáveis configuradas no ambiente correto.
- [ ] Migrations 001–010 aplicadas e verificadas em homologação.
- [ ] Vitor e Levi configurados por UUID em `PLATFORM_ADMIN_USER_IDS`.
- [ ] Preços dos planos revisados; a migration 009 começa com valor zero.
- [ ] Cadastro sem licença e primeira ativação posterior validados pela migration 010.
- [ ] Gestão Master de usuários validada com contas de homologação.
- [ ] Licenças iniciais das organizações existentes revisadas.
- [ ] Bloqueio/liberação e Realtime testados em duas sessões reais.
- [ ] RLS testada com ao menos dois tenants reais.
- [ ] Concorrência das RPCs críticas testada no PostgreSQL.
- [ ] `npm ci && npm run verify` aprovado.
- [ ] Fluxos móveis e QR testados em dispositivos reais.
- [ ] Observabilidade, backup e plano de rollback confirmados.
- [ ] Versão exibida e artefato conferidos.
- [ ] Vault incluído e atualizado no pacote.

## Estado atual

A versão 1.1.0 foi implementada localmente. As migrations 009–010, o RLS de licença, o Auth Admin, o Realtime, o deploy Vercel e os testes em dispositivos reais precisam de validação no ambiente de destino.
