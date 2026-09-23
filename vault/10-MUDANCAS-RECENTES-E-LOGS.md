# Mudanças recentes e logs

## Histórico

| Versão | Mudanças principais                                                                                                                             | Banco                |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| 1.0.10 | Reset administrativo de senha, convites e auditoria                                                                                             | Sem migration nova   |
| 1.0.11 | TAG, mensalista, consulta e responsividade                                                                                                      | Migration 006        |
| 1.0.12 | Segurança/RBAC, senha server-side, snapshot tarifário, operações atômicas, rate limit persistente, UI móvel, testes/CI/lockfile e Vault oficial | Migrations 007 e 008 |
| 1.1.0  | Painel Master SaaS, planos, licenças, auditoria, bloqueio em camadas e Realtime                                                                 | Migration 009        |

## 1.1.0 — versão final

- Criado painel `/master` exclusivo da plataforma.
- Adicionados planos mensal, semestral e anual com preço configurável.
- Licença passou a pertencer à organização e ficou separada de `profiles.active`.
- Bloqueio, liberação, renovação e troca de plano usam RPC atômica.
- RLS e APIs recusam organizações sem licença válida.
- Supabase Realtime atualiza sessões abertas; polling de contingência verifica a cada 15 segundos.
- Organizações existentes recebem licença inicial de 30 dias na migration 009.
- Vitor e Levi permanecem sem validade por serem masters configurados por UUID.

## 1.0.12 — base de hardening

- Corrigido o versionamento que havia sido indevidamente tratado como 1.1.0; a sequência correta continua em 1.0.12.
- Entrada, saída, fechamento de caixa e provisionamento passaram a usar contratos atômicos.
- O valor de saída é calculado no servidor com snapshot imutável da tarifa.
- Autorizações e políticas RLS foram endurecidas.
- Rotas públicas ganharam rate limiting persistente.
- Troca obrigatória de senha passou a ser concluída no servidor.
- Foram adicionados lint, formatação, testes, CI e lockfile.
- Navegação administrativa e feedback móvel foram aprimorados.
- A pasta `vault/` passa a integrar obrigatoriamente o projeto.

## Evidência local

Na validação final local da 1.1.0: Prettier, lint e typecheck aprovados; 22 testes unitários e 4 testes de contrato aprovados; build Next.js com 55 páginas/rotas; auditoria de produção com 0 vulnerabilidades.

Não houve deploy nem validação do banco real.
