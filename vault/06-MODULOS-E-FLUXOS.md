# Módulos e fluxos

## Operação

- Entrada: valida placa/dados, resolve tarifa, grava snapshot e abre permanência por RPC atômica.
- Pátio: lista permanências abertas da organização.
- Cobrança/saída: bloqueia registro, calcula no banco pelo snapshot, encerra e registra efeitos relacionados.
- Caixa: abertura, movimentos e fechamento; fechamento crítico é atômico.
- Serviços: vinculados à permanência e incluídos no total conforme regras do servidor.

## Administração

- Dashboard e relatórios escopados por organização.
- Equipe, clientes, tarifas, serviços e auditoria protegidos por papéis.
- Administração de plataforma e provisionamento de organização usam autorização explícita e operação atômica.

## Master SaaS

- `/master` apresenta indicadores de organizações ativas, bloqueadas, expiradas e pendentes.
- `/master/clientes` cadastra estacionamentos com plano inicial e controla licença.
- `/master/planos` mantém duração, preço e disponibilidade dos planos.
- `/master/auditoria` apresenta ações administrativas da plataforma.
- Bloqueio e liberação são persistidos atomicamente e propagados às sessões abertas.

## Conta

- Login via Supabase.
- Troca obrigatória de senha concluída por rota/RPC server-side.
- Logout e navegação adaptados a desktop e mobile.

## Consulta pública

- Por token UUID aleatório: devolve somente dados públicos da permanência.
- Por placa: exige placa e WhatsApp completo correspondente.
- Ambas passam por rate limiting persistente e retornos mínimos.

Consulte [[07-SEGURANCA-AUTENTICACAO-E-ACESSO]].
