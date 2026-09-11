# eStaciona 1.0.10

## Redefinição de senha da equipe

Resolve usuários antigos criados pelo fluxo de convite que não possuíam senha utilizável.

- Proprietário redefine senha provisória de gerentes e operadores.
- Gerente redefine senha provisória de operadores.
- Atualização feita pelo Supabase Admin no servidor.
- Contas antigas de convite têm o e-mail confirmado ao receber senha provisória.
- `must_change_password` passa a `true`.
- No próximo login, o usuário é enviado para `/alterar-senha`.
- O acesso ao sistema só continua após criação da senha definitiva.
- A ação é registrada em `audit_logs`.
- Nenhuma migration nova é necessária.
