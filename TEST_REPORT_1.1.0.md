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
- Testes de contrato das migrations: 5 aprovados.
- Build Next.js 15.5.26: aprovado, com 57 páginas/rotas processadas.
- Auditoria de dependências de produção: 0 vulnerabilidades.

## Cobertura nova

- expiração calculada pelo horário do servidor;
- bloqueio manual prevalecendo sobre validade futura;
- códigos estáveis de licença;
- contratos SQL para planos, licenças, auditoria, RPC atômica, RLS e Realtime;
- contrato SQL para cadastro separado e primeira ativação posterior da licença;
- rotas Master para editar estacionamento e administrar usuários/e-mails/senhas;
- navegação Voltar padronizada e home sem conteúdo redundante;
- manutenção dos testes de senha, RBAC, placa, tarifa e totais.

## Limitações

- As migrations 009 e 010 não foram aplicadas a um Supabase real nesta sessão.
- A gestão Auth Admin não foi exercitada com usuários reais de homologação.
- Realtime não foi exercitado com duas sessões reais.
- RLS não foi validada ao vivo com dois tenants.
- Não houve teste visual em navegadores/dispositivos reais.
- Não houve deploy, commit ou push.
