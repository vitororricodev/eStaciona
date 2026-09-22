# Test report — eStaciona 1.0.12 (candidato não publicado)

Data da validação local: 2026-09-22.

## Comandos executados

- `npm ci`
- `npm run format:check`
- `npm audit --omit=dev`
- `npm run verify`

## Resultado

- ESLint: aprovado, sem warnings.
- Prettier: aprovado em todos os arquivos correspondentes.
- TypeScript (`tsc --noEmit`): aprovado.
- Testes unitários: 17 aprovados em 6 arquivos.
- Testes de contrato das migrations: 2 aprovados em 1 arquivo.
- Build Next.js 15.5.26: aprovado; 46 páginas/rotas processadas.
- Auditoria npm de produção: 0 vulnerabilidades após override de PostCSS 8.5.28.

## Cobertura incluída

- motor tarifário, tolerância, frações e teto;
- snapshot de tarifa e prioridade sobre o plano editável;
- placa antiga/Mercosul;
- matriz RBAC;
- política e orquestração de troca obrigatória de senha, incluindo falhas intermediárias;
- contratos SQL para transações, locks, RLS e rate limiting.

## Limitações honestas

- As migrations não foram aplicadas a um projeto Supabase real nesta sessão.
- Não houve teste concorrente real no PostgreSQL nem teste RLS com dois tenants reais.
- Não houve execução visual em navegador nos cinco viewports móveis exigidos; a validação foi estática, por classes responsivas, acessibilidade e build.
- Não houve deploy nem confirmação da versão em produção.
