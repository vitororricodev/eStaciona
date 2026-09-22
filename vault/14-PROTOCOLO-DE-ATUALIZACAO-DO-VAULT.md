# Protocolo de atualização do Vault

Este protocolo é obrigatório para qualquer pessoa ou IA que altere o eStaciona.

## Antes da mudança

1. Confirmar que a pasta `vault/` existe.
2. Ler [[00-INDEX]] e [[05-CONTEXTO-PARA-IA-PROMPT-BASE]].
3. Ler os documentos do domínio afetado.
4. Conferir código, migrations, testes e versão reais.
5. Identificar conflito com segurança, RLS, multiempresa, finanças ou regras de negócio e avisar antes de prosseguir.

## Durante a mudança

- Fazer alteração incremental e rastreável.
- Não enfraquecer invariantes para “fazer funcionar”.
- Criar migration incremental para schema; nunca reescrever histórico já aplicado.
- Adicionar/ajustar testes.
- Manter a versão na série vigente; no estado atual, `1.0.12`.
- Distinguir fatos confirmados, histórico e pendências.

## Depois da mudança

1. Atualizar o documento do domínio afetado.
2. Atualizar [[10-MUDANCAS-RECENTES-E-LOGS]].
3. Atualizar riscos, inventário e auditoria quando aplicável.
4. Executar `npm run verify` e registrar o resultado real.
5. Verificar links internos e procurar afirmações obsoletas.
6. Garantir que `vault/` esteja incluído no pacote final.
7. Informar validações não executadas; nunca inferir deploy.

## Checklist de empacotamento

- [ ] `package.json`, lockfile, changelog e release usam a mesma versão.
- [ ] Migrations e documentação estão alinhadas.
- [ ] Testes relevantes foram executados.
- [ ] Não há segredos no pacote.
- [ ] `vault/` contém índice, contexto, arquitetura, dados, segurança, histórico, riscos, auditoria e este protocolo.
- [ ] O artefato final preserva a estrutura `eStaciona-main/vault/**`.

A ausência do Vault ou sua desatualização torna o pacote incompleto.
