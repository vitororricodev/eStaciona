# Changelog

## 1.0.4
- Corrige tipagem de cookies do Supabase em `lib/supabase/server.ts` e `middleware.ts`.
- Corrige resolução de perfil em organizações com múltiplos funcionários.
- Adiciona política RLS para escrita de auditoria.
- Torna finalização + pagamento atômicos via `finish_stay_atomic`.
- Fortalece consulta pública exigindo o WhatsApp cadastrado completo.
- Adiciona `/api/health` para validar ambiente e acesso ao banco.
- Mantém as correções de `useEffect` necessárias para o build da Vercel.

## 1.0.1 — Identidade visual
- Aplicada a logo oficial do eStaciona.
- Ícone oficial utilizado como favicon e ícone PWA.
- Mantida a assinatura “O controle do seu pátio na palma da mão.”.

## 1.0.0
- Portal do cliente.
- Relatórios e movimentações administrativas.
- Clientes e veículos recorrentes.
- Serviços adicionais por permanência.
- Equipe e permissões.
- Caixa com abertura, suprimento, sangria e fechamento.
- Auditoria.
- Adaptadores opcionais WhatsApp e consulta veicular.
- PWA.

## 0.4.0
- Motor tarifário avançado e pátio.

## 0.3.0
- Núcleo operacional: entrada, QR, cobrança e saída.
