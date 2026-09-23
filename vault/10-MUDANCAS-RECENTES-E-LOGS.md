# Mudanças recentes e logs

## Histórico

| Versão | Mudanças principais                                                                                                                             | Banco                |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| 1.0.10 | Reset administrativo de senha, convites e auditoria                                                                                             | Sem migration nova   |
| 1.0.11 | TAG, mensalista, consulta e responsividade                                                                                                      | Migration 006        |
| 1.0.12 | Segurança/RBAC, senha server-side, snapshot tarifário, operações atômicas, rate limit persistente, UI móvel, testes/CI/lockfile e Vault oficial | Migrations 007 e 008 |
| 1.1.0  | Painel Master SaaS, gestão de usuários, licenças separadas, navegação padronizada, bloqueio em camadas e Realtime                               | Migrations 009 e 010 |

## 1.1.0 — versão final

- Criado painel `/master` exclusivo da plataforma.
- Adicionados planos mensal, semestral e anual com preço configurável.
- Licença passou a pertencer à organização e ficou separada de `profiles.active`.
- Bloqueio, liberação, renovação e troca de plano usam RPC atômica.
- RLS e APIs recusam organizações sem licença válida.
- Supabase Realtime atualiza sessões abertas; polling de contingência verifica a cada 15 segundos.
- Organizações existentes recebem licença inicial de 30 dias na migration 009.
- Vitor e Levi permanecem sem validade por serem masters configurados por UUID.
- Cadastro de estacionamento deixou de liberar licença automaticamente; a primeira ativação ocorre em `/master/licencas`.
- Criado `/master/estacionamentos` para listar e-mails, incluir, editar, excluir e redefinir senhas de usuários.
- O backend protege o último proprietário ativo e registra as ações em `platform_audit_logs`.
- Home compactada, bloco “3 fluxos” removido e botão Voltar padronizado.

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

Na validação final local da 1.1.0: Prettier, lint e typecheck aprovados; 22 testes unitários e 5 testes de contrato aprovados; build Next.js com 57 páginas/rotas. A auditoria de produção deve ser repetida após a consolidação final.

Não houve deploy nem validação do banco real.
