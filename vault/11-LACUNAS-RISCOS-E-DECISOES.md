# Lacunas, riscos e decisões

## Riscos tratados em código na 1.0.12

- Cálculo financeiro confiado ao cliente.
- Ausência de snapshot da tarifa.
- Operações críticas não atômicas.
- Bypass de autorização com service role.
- Políticas RLS permissivas em áreas sensíveis.
- Rotas públicas sem rate limit persistente.
- Troca obrigatória de senha concluída apenas no cliente.
- Build sem lockfile, testes, lint e CI.
- Divergência interna de versão.
- Vault fora do pacote e sem protocolo de manutenção.

## Riscos ainda abertos

| Risco                                  | Ação necessária                                    |
| -------------------------------------- | -------------------------------------------------- |
| Drift entre migrations e banco real    | Comparar e aplicar 001–008 em homologação          |
| RLS multiempresa não testada ao vivo   | Testar dois tenants e todos os papéis              |
| Concorrência real não exercitada       | Testar RPCs no PostgreSQL sob disputa              |
| Mobile/QR não validado em dispositivos | Testar Android e iPhone reais                      |
| Observabilidade e alertas              | Definir métricas, logs, retenção e alertas         |
| LGPD/retenção                          | Formalizar prazos, base legal e descarte           |
| Rate limit operacional                 | Definir limpeza, rotação de segredo e capacidade   |
| Deploy                                 | Validar Vercel, variáveis, health check e rollback |

## Decisões vigentes

- A série continua em `1.0.12`; não há quebra que justifique `1.1.0`.
- Vault é documentação viva versionada dentro do projeto.
- “Aprovado localmente” não significa “implantado” ou “validado em produção”.
