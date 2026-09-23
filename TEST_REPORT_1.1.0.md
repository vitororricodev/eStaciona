# Test report — eStaciona 1.1.0

Data da validação local: 2026-09-23.

## Comandos

- `npm run format:check`
- `npm run verify`
- `npm audit --omit=dev`

## Resultado

- Prettier: aprovado.
- ESLint: aprovado sem warnings.
- TypeScript: aprovado.
- Testes unitários: 22 aprovados em 7 arquivos.
- Testes de contrato das migrations: 4 aprovados.
- Build Next.js 15.5.26: aprovado, com 55 páginas/rotas processadas.
- Auditoria de dependências de produção: 0 vulnerabilidades.

## Cobertura nova

- expiração calculada pelo horário do servidor;
- bloqueio manual prevalecendo sobre validade futura;
- códigos estáveis de licença;
- contratos SQL para planos, licenças, auditoria, RPC atômica, RLS e Realtime;
- manutenção dos testes de senha, RBAC, placa, tarifa e totais.

## Limitações

- A migration 009 não foi aplicada a um Supabase real nesta sessão.
- Realtime não foi exercitado com duas sessões reais.
- RLS não foi validada ao vivo com dois tenants.
- Não houve teste visual em navegadores/dispositivos reais.
- Não houve deploy, commit ou push.
