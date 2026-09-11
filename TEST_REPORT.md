# eStaciona 1.0.4 — Relatório de revisão

Revisões executadas nesta versão:

- sintaxe de todos os arquivos `.ts` e `.tsx` validada com o parser do TypeScript;
- imports internos `@/` e relativos verificados: nenhum caminho ausente;
- referências `fetch('/api/...')` comparadas às rotas existentes: nenhuma rota ausente;
- callbacks `setAll(cookiesToSet)` do Supabase tipados explicitamente;
- busca por `useEffect(load, ...)`/callback Promise direto: nenhuma ocorrência restante;
- resolução de perfil corrigida para organizações com múltiplos funcionários;
- motor tarifário compilado isoladamente e testado para tolerância, primeira faixa, frações, teto de 24h e múltiplos dias;
- auditoria RLS corrigida na migration `004_hardening.sql`;
- finalização da permanência + pagamento tornados atômicos via `finish_stay_atomic`;
- consulta pública endurecida para exigir WhatsApp cadastrado completo;
- varredura de segredos: nenhuma credencial real encontrada no pacote;
- endpoint `/api/health` adicionado para checar configuração e banco em deploy.

## Teste de motor tarifário

Casos aprovados:

- 5 min dentro da tolerância: R$ 0;
- 10 min no limite: R$ 0;
- 11 min: primeira faixa;
- 60 min: primeira faixa;
- 61 min: primeira fração adicional;
- 90 min: uma fração adicional;
- 91 min: duas frações adicionais;
- 24h: teto diário;
- 24h + 1 min: novo ciclo de cobrança;
- formatação de duração acima de 24h.

## Validação final no ambiente de deploy

Após instalar as dependências, rode:

```bash
npm run verify
```

Depois do deploy, acesse:

```text
/api/health
```

O retorno esperado é:

```json
{"ok":true,"service":"eStaciona","version":"1.0.4"}
```
