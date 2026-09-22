# eStaciona 1.0.12 — candidato não publicado

## Segurança e consistência

- Fluxo server-side verificável para troca obrigatória de senha.
- Rate limiting persistente nas três rotas públicas prioritárias, com chaves anonimizadas.
- Snapshot imutável de tarifa e cálculo final no PostgreSQL.
- Entrada, fechamento de caixa e provisionamento PostgreSQL transacionais.
- RLS revisada por operação, organização, usuário ativo e papel.
- RBAC centralizado; Admin Master não herda operação de tenant.

## Interface

- Navegação administrativa horizontal acessível, sem abreviações e com item ativo.
- Cards administrativos inteiramente clicáveis.
- Botão Voltar reutilizável com histórico e fallback por área.
- Feedback acessível no cadastro de estacionamento.

## Engenharia

- Versão centralizada em `package.json`.
- Lockfile, ESLint, Prettier, Vitest e CI adicionados.
- Migrations incrementais 007 e 008.
- Vault técnico incluído no projeto, com protocolo obrigatório de consulta e atualização.

## Versionamento

A versão correta é `1.0.12`, sequência direta da `1.0.11`. O rótulo `1.1.0` usado no artefato intermediário foi corrigido porque as mudanças são correções e endurecimento compatíveis, sem a introdução de uma nova linha funcional minor.

Este arquivo descreve o candidato local. A publicação depende de aplicar as migrations em homologação/produção, validar RLS com dois tenants reais e concluir o deploy.
