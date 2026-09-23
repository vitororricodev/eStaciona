# Visão geral e negócio

O eStaciona é um SaaS multiempresa para operação de estacionamentos. O fluxo principal cobre entrada, permanência, serviços, cobrança, caixa, consulta pública e administração.

## Regras de negócio invariantes

- Cada registro operacional pertence a uma organização.
- Usuários comuns só atuam na organização do próprio perfil; administrador de plataforma tem escopo explícito.
- Uma permanência aberta guarda um snapshot imutável da tarifa usada na entrada.
- O valor final é calculado no servidor/banco, não confiado ao cliente.
- Operações compostas críticas devem ser atômicas e auditáveis.
- Consulta pública por placa exige confirmação do WhatsApp completo cadastrado.
- Token público não pode expor telefone, CPF ou dados administrativos.
- Alteração de senha obrigatória deve ser concluída no servidor.
- RLS nunca deve ser enfraquecida para contornar falhas de autorização.
- A licença pertence à organização, nunca ao usuário individual.
- Vitor e Levi são masters da plataforma e não possuem validade.
- Estacionamentos só operam com licença ativa e dentro do vencimento.
- Alterações de plano/licença são atômicas, auditadas e não apagam dados.

## Papéis

- `platform_admin`/`master`: gestão explícita da plataforma, organizações, planos e licenças.
- `admin_master`: gestão da organização.
- `admin`: administração operacional conforme permissões.
- `operator`: operação diária dentro do escopo permitido.

Veja [[06-MODULOS-E-FLUXOS]] e [[07-SEGURANCA-AUTENTICACAO-E-ACESSO]].
