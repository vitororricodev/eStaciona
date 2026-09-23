# Guia de desenvolvimento e contribuição

## Setup

1. Use Node.js compatível com Next.js 15.
2. Copie `.env.example` para o ambiente local e preencha somente segredos próprios.
3. Execute `npm ci`.
4. Aplique as migrations 001–010 em ordem em um Supabase de desenvolvimento.
5. Execute `npm run verify`.

## Scripts

- `npm run dev`: desenvolvimento.
- `npm run lint`: ESLint sem warnings.
- `npm run typecheck`: TypeScript sem emissão.
- `npm run test`: testes unitários.
- `npm run test:integration`: contratos das migrations.
- `npm run build`: build de produção.
- `npm run verify`: toda a sequência acima.
- `npm run format:check`: verificação de formatação.

## Fluxo obrigatório de mudança

1. Leia [[00-INDEX]] e [[05-CONTEXTO-PARA-IA-PROMPT-BASE]].
2. Leia os documentos do domínio afetado.
3. Inspecione código, migrations e testes reais.
4. Avise se a solicitação conflitar com segurança, RLS, multiempresa ou regras de negócio.
5. Implemente a menor mudança completa e adicione testes.
6. Atualize versão/changelog apenas conforme a série vigente.
7. Atualize o Vault e mantenha `vault/` dentro do pacote.
8. Execute as validações e registre limites sem alegar deploy não realizado.

Detalhes em [[14-PROTOCOLO-DE-ATUALIZACAO-DO-VAULT]].
