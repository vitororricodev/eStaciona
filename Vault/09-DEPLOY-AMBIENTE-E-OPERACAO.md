# Deploy, ambiente e operação

## Build reproduzível

Use `npm ci` com o `package-lock.json` versionado e execute `npm run verify` antes de publicar.

## Variáveis

Consulte `.env.example`. Segredos administrativos e `RATE_LIMIT_SECRET` são server-only e nunca devem usar prefixo `NEXT_PUBLIC_`. Se `RATE_LIMIT_SECRET` não estiver definido, o backend deriva a chave HMAC da service role; em produção, prefira segredo dedicado.

## Banco

Aplicar migrations 001–008 em ordem, primeiro em homologação. Comparar o schema implantado com o repositório, testar rollback operacional e confirmar as RPCs/políticas antes do deploy da aplicação.

## Checklist mínimo

- [ ] Variáveis configuradas no ambiente correto.
- [ ] Migrations 001–008 aplicadas e verificadas em homologação.
- [ ] RLS testada com ao menos dois tenants reais.
- [ ] Concorrência das RPCs críticas testada no PostgreSQL.
- [ ] `npm ci && npm run verify` aprovado.
- [ ] Fluxos móveis e QR testados em dispositivos reais.
- [ ] Observabilidade, backup e plano de rollback confirmados.
- [ ] Versão exibida e artefato conferidos.
- [ ] Vault incluído e atualizado no pacote.

## Estado atual

O candidato 1.0.12 foi validado localmente. Não há evidência neste pacote de migrations aplicadas, deploy Vercel ou testes em dispositivos reais.
