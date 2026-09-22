# Arquitetura — eStaciona 1.0.12 (candidato não publicado)

## 1. Fluxos

### Operação

`Placa → cliente/veículo → tarifa → permanência → QR/WhatsApp → pátio → serviços → cobrança → pagamento → saída`

Fallbacks operacionais:

- sem QR: localizar pela placa;
- sem WhatsApp API: compartilhar por `wa.me`;
- dinheiro: exige caixa aberto;
- cancelamento: mantém histórico e exige justificativa/permissão.

### Cliente

`Link por token OU placa + WhatsApp completo → permanência → tempo/valor → tarifa/serviços → QR → saída`

### Gestão

`Dashboard → movimentações → relatórios → clientes/veículos → tarifas → serviços → equipe → auditoria`

### Caixa

`Abrir → receber → suprimento/sangria → valor esperado → contar → fechar → diferença auditada`

## 2. Domínio

Entidades principais:

- `organizations`
- `profiles`
- `customers`
- `vehicles`
- `tariff_plans`
- `stays`
- `services`
- `stay_services`
- `payments`
- `cash_sessions`
- `cash_movements`
- `audit_logs`
- `integration_events`

## 3. Cobrança

O preço de estacionamento é calculado em `domain/pricing.ts`. Serviços são somados por `lib/stayTotals.ts`. APIs de pátio, cobrança e portal reutilizam o mesmo cálculo.

## 4. Permissões

- `owner`: controle completo, inclusive convites e papéis;
- `manager`: gestão operacional, tarifas, serviços, relatórios, auditoria, cancelamento e sangria;
- `operator`: entrada, pátio, cobrança e caixa próprio.

RLS restringe tabelas por organização. APIs que exigem autoridade adicional validam o `role` no servidor.

## 5. Público e privacidade

O token público da permanência é UUID aleatório. A consulta por placa não retorna o registro sem confirmação do WhatsApp completo cadastrado e passa por rate limiting persistente. O portal não expõe telefone, CPF ou dados administrativos.

As permanências novas guardam um snapshot imutável da tarifa. Entrada, finalização/pagamento e fechamento de caixa usam RPCs transacionais com locks; registros legados sem snapshot mantêm fallback compatível.

## 6. Integrações

### WhatsApp

Adaptador opcional da Cloud API da Meta. Sem credenciais/template, o sistema continua operacional usando compartilhamento `wa.me`.

### PIX online

Ponto de extensão deliberadamente sem provedor fixo. O núcleo suporta PIX como forma de pagamento no caixa; confirmação online só deve ser marcada como paga após webhook assinado de um gateway escolhido.

## 7. Deploy

`GitHub → Vercel (Next.js) → Supabase (Auth + PostgreSQL + RLS)`

Não expor `SUPABASE_SERVICE_ROLE_KEY` ao browser.
