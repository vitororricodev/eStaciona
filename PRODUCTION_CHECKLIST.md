# Checklist de produção — eStaciona 1.1.0

## Obrigatório

- [ ] Criar projeto Supabase de produção.
- [ ] Executar migrations 001 a 010, em ordem, e comparar com o schema implantado.
- [ ] Confirmar Vitor e Levi por UUID em `PLATFORM_ADMIN_USER_IDS`.
- [ ] Conferir preços dos planos; a migration cria os três planos com preço inicial zero.
- [ ] Validar bloqueio/liberação em duas sessões reais e confirmar evento Realtime.
- [ ] Revisar as licenças iniciais de 30 dias criadas para organizações existentes.
- [ ] Cadastrar um estacionamento sem licença e depois ativá-lo pelo módulo Licenças.
- [ ] Testar inclusão, edição, exclusão e redefinição de senha pelo módulo Estacionamentos.
- [ ] Confirmar que o último proprietário ativo não pode ser removido ou rebaixado.
- [ ] Criar usuário proprietário e bootstrap da organização.
- [ ] Configurar `NEXT_PUBLIC_SUPABASE_URL`.
- [ ] Configurar `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- [ ] Configurar `SUPABASE_SERVICE_ROLE_KEY` somente no servidor/Vercel.
- [ ] Configurar `NEXT_PUBLIC_APP_URL` com HTTPS.
- [ ] Configurar `RATE_LIMIT_SECRET` como segredo server-only.
- [ ] Validar `npm ci` e `npm run verify`.
- [ ] Testar RLS com duas organizações isoladas.
- [ ] Testar QR em Android e iPhone.
- [ ] Testar tarifa com tolerância, frações, teto e >24h.
- [ ] Testar entrada duplicada e cancelamento.
- [ ] Confirmar que alteração de tarifa não afeta permanência aberta com snapshot.
- [ ] Testar limite 429 e `Retry-After` sem registrar PII.
- [ ] Testar troca obrigatória de senha e perfil inativo.
- [ ] Testar caixa: abertura, dinheiro, suprimento, sangria e fechamento.
- [ ] Definir política de privacidade e base legal/LGPD para nome, telefone e placa.

## Opcionais por fornecedor

- [ ] Configurar WhatsApp Cloud API + template aprovado.
- [ ] Configurar API veicular.
- [ ] Escolher gateway para PIX online e implementar webhook assinado antes de liberar `Pagar agora`.

## Teste de fumaça sugerido

1. Entrar como owner.
2. Criar tarifa padrão.
3. Abrir caixa.
4. Registrar placa nova.
5. Abrir portal pelo QR.
6. Consultar a mesma permanência por placa + telefone.
7. Adicionar serviço.
8. Cobrar em dinheiro.
9. Conferir dashboard/relatório.
10. Fechar caixa e conferir diferença.
11. Conferir audit log.
12. Como Master, criar estacionamento, usuário adicional e redefinir senha.
13. Ativar a primeira licença separadamente e conferir o acesso.
