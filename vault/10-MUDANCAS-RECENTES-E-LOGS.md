# Mudanças recentes e logs

## Histórico

| Versão | Mudanças principais                                                                                                                             | Banco                |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| 1.0.10 | Reset administrativo de senha, convites e auditoria                                                                                             | Sem migration nova   |
| 1.0.11 | TAG, mensalista, consulta e responsividade                                                                                                      | Migration 006        |
| 1.0.12 | Segurança/RBAC, senha server-side, snapshot tarifário, operações atômicas, rate limit persistente, UI móvel, testes/CI/lockfile e Vault oficial | Migrations 007 e 008 |

## 1.0.12 — candidato não publicado

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

Na última validação registrada: lint limpo, typecheck aprovado, 17 testes unitários, 2 testes de contrato e build Next.js aprovado. A execução deve ser repetida em qualquer novo artefato.

Não houve deploy nem validação do banco real.
