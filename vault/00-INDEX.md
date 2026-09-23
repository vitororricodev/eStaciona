# Vault eStaciona — índice mestre

## Estado de referência

Este Vault faz parte do próprio projeto e descreve a versão final **1.1.0**. Ele deve ser consultado antes de qualquer alteração e atualizado no mesmo pacote depois de toda mudança relevante.

Fontes de verdade, em ordem: código e migrations versionados; testes executados; documentação deste Vault; documentos históricos. O estado real de Supabase/Vercel só é confirmado após verificação nesses ambientes.

## Leitura obrigatória

- [[05-CONTEXTO-PARA-IA-PROMPT-BASE]] — regras invariantes para manutenção.
- [[14-PROTOCOLO-DE-ATUALIZACAO-DO-VAULT]] — processo obrigatório antes e depois de mudar o projeto.
- [[02-ARQUITETURA-E-DESIGN]] — limites arquiteturais.
- [[03-ESTRUTURA-DE-DADOS-E-API]] — dados, migrations e RPCs.
- [[07-SEGURANCA-AUTENTICACAO-E-ACESSO]] — autenticação, autorização, RLS e rotas públicas.

## Mapa

- [[01-VISAO-GERAL-E-NEGOCIO]]
- [[02-ARQUITETURA-E-DESIGN]]
- [[03-ESTRUTURA-DE-DADOS-E-API]]
- [[04-GUIA-DE-DESENVOLVIMENTO-E-CONTRIBUICAO]]
- [[05-CONTEXTO-PARA-IA-PROMPT-BASE]]
- [[06-MODULOS-E-FLUXOS]]
- [[07-SEGURANCA-AUTENTICACAO-E-ACESSO]]
- [[08-UX-UI-E-IDENTIDADE]]
- [[09-DEPLOY-AMBIENTE-E-OPERACAO]]
- [[10-MUDANCAS-RECENTES-E-LOGS]]
- [[11-LACUNAS-RISCOS-E-DECISOES]]
- [[12-INVENTARIO-E-RASTREABILIDADE]]
- [[13-AUDITORIA-DO-CODIGO-MAIN]]
- [[14-PROTOCOLO-DE-ATUALIZACAO-DO-VAULT]]

## Situação da validação

A versão 1.1.0 inclui o painel Master SaaS, gestão separada de estacionamentos/usuários e licenças, bloqueio em camadas e atualização por Realtime. A validação local final está registrada em [[13-AUDITORIA-DO-CODIGO-MAIN]]. As migrations 009–010, o Realtime e o RLS multi-tenant ainda precisam ser testados no Supabase de destino.
