# Contexto obrigatório para IA e manutenção

Antes de alterar o eStaciona:

1. Leia `vault/00-INDEX.md` e `vault/14-PROTOCOLO-DE-ATUALIZACAO-DO-VAULT.md`.
2. Leia arquitetura, dados, segurança e o módulo afetado.
3. Confira o código, as migrations, o lockfile e os testes; o Vault orienta, mas não substitui a implementação.
4. Se houver conflito entre pedido e invariantes, informe antes de implementar.

## Invariantes

- Manter Next.js App Router, TypeScript, Tailwind e Supabase.
- Manter desenho mobile-first e identidade existente.
- Nunca enfraquecer RLS ou confiar autorização ao cliente.
- Escopar operações por organização no servidor.
- Manter snapshot tarifário e cálculo final server-side.
- Usar atomicidade em operações compostas críticas.
- Preservar auditoria para alterações sensíveis.
- Nunca expor `service_role`, telefone, CPF ou dados administrativos.
- Consulta pública por placa exige WhatsApp completo.
- Não confundir usuário inativo com licença de organização.
- Masters da plataforma não dependem de licença de estacionamento.
- Toda rota operacional nova deve respeitar a licença no servidor e no banco.
- Alterações de licença exigem atomicidade, auditoria e propagação em tempo real.
- Atualizar testes, changelog e Vault junto com a mudança.
- Todo pacote entregue deve conter a pasta `vault/`.
- Não afirmar deploy, migração real ou teste móvel sem evidência.

## Entrega

Resuma resultado, arquivos afetados, regras aplicadas, validações executadas, limitações e riscos pendentes.
