# eStaciona 1.0.0 — MVP comercial

**eStaciona — O controle do seu pátio na palma da mão.**

SaaS mobile-first para estacionamentos, preparado para **Vercel + Supabase**.

## O que está entregue

### eStaciona Operação
- entrada rápida por placa;
- reaproveitamento automático de cliente/veículo recorrente;
- tarifa automática ou manual;
- QR Code individual por permanência;
- tentativa de envio pela WhatsApp Cloud API quando configurada, com fallback `wa.me`;
- pátio em tempo real, busca, filtros, tempo e valor atual;
- cobrança por QR ou placa;
- serviços adicionais vinculados à permanência;
- pagamento no balcão por PIX, cartão, dinheiro ou outro;
- caixa obrigatório para recebimentos em dinheiro;
- cancelamento auditado com permissão de gerente/proprietário.

### eStaciona Cliente
- portal por token seguro;
- consulta alternativa pela placa + 4 últimos dígitos do telefone;
- placa, veículo, entrada e tempo em tempo real;
- valor atual com estacionamento + serviços;
- resumo da tarifa aplicada;
- QR para saída;
- estados aberto/finalizado.

> O botão de pagamento online aparece como indisponível até um provedor PIX ser escolhido e configurado. O MVP não inventa um gateway nem cria cobrança financeira simulada em produção.

### eStaciona Gestão
- dashboard diário;
- movimentações;
- relatórios de 7/30/90/365 dias;
- faturamento, ticket médio e permanência média;
- receita por dia e forma de pagamento;
- clientes e veículos recorrentes;
- motor tarifário avançado;
- serviços;
- equipe com papéis `owner`, `manager`, `operator`;
- convite de funcionário por e-mail via Supabase Auth Admin;
- trilha de auditoria.

### Caixa
- abertura por operador;
- suprimento;
- sangria (gerente/proprietário);
- recebimentos em dinheiro associados à sessão;
- valor esperado;
- fechamento, diferença e observação.

## Motor tarifário

Centralizado em `domain/pricing.ts`:
- tolerância;
- primeira faixa configurável;
- frações adicionais com arredondamento para cima;
- teto por ciclo de 24h;
- múltiplos dias;
- tabelas por dias da semana, vigência, horário e prioridade.

## Segurança e SaaS

- Supabase Auth;
- PostgreSQL;
- Row Level Security por `organization_id`;
- QR contém token, não dados pessoais;
- consulta pública por placa exige validação adicional do telefone;
- ações críticas registradas em `audit_logs`;
- registros financeiros não são apagados pelo fluxo normal;
- service role usada somente em rotas servidoras específicas.

## Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS
- Supabase Auth/PostgreSQL/RLS
- `qrcode`
- `html5-qrcode`
- Zod
- Lucide React
- Vercel
- PWA instalável com service worker apenas para assets estáticos

## Migrations

Execute **nesta ordem** em um projeto Supabase novo:

1. `supabase/migrations/001_initial.sql`
2. `supabase/migrations/002_tariffs_advanced.sql`
3. `supabase/migrations/003_mvp_complete.sql`

Em uma instalação 0.4.0 existente, execute somente a `003_mvp_complete.sql`.

## Primeiro acesso

1. Crie o projeto no Supabase.
2. Rode as 3 migrations.
3. Crie o primeiro usuário em **Authentication > Users**.
4. Rode o bootstrap comentado no fim de `001_initial.sql` para criar organização, perfil `owner` e tarifa padrão.
5. Configure `.env.local` a partir de `.env.example`.
6. Rode `npm install` e `npm run dev`.

## Vercel

1. Suba o projeto no GitHub.
2. Importe o repositório na Vercel.
3. Cadastre as variáveis do `.env.example`.
4. Defina `NEXT_PUBLIC_APP_URL` para a URL final da aplicação.
5. Faça deploy.

## WhatsApp

Sem configuração externa, o operador usa o link de compartilhamento do WhatsApp normalmente.

Para envio automático, configure:
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_ENTRY_TEMPLATE`

O template deve existir/aprovar na conta WhatsApp Business usada pelo estacionamento. O adaptador está em `lib/integrations.ts`.

## Pagamento online

O MVP registra PIX no balcão como forma de pagamento. O **PIX online no Portal do Cliente** permanece desacoplado de provedor para evitar lock-in e falsas confirmações financeiras. A tela já reserva o ponto de extensão para um gateway real.

## Validação antes de produção

Antes de colocar clientes reais:
- rode `npm install`;
- rode `npm run typecheck`;
- rode `npm run build`;
- teste as migrations em um projeto Supabase de homologação;
- teste RLS usando duas organizações diferentes;
- teste câmera/QR em Android e iPhone;
- teste abertura/fechamento de caixa;
- simule tarifas de tolerância, fração, teto e permanência >24h;
- configure domínio, política de privacidade e termos/LGPD.

## Versão

`1.0.0` — MVP comercial funcional, com integrações externas opcionais condicionadas às credenciais/provedores do cliente.

## Consulta automática de placa

O cadastro continua funcionando manualmente sem fornecedor externo. Para ativar preenchimento de marca/modelo/cor, configure `PLATE_API_URL` e opcionalmente `PLATE_API_TOKEN`. O adaptador aceita respostas com `make/model/color/year` ou `marca/modelo/cor/ano`.
