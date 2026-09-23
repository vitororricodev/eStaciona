# UX, UI e identidade

## Diretrizes

- Interface mobile-first, responsiva e acessível.
- Manter a identidade visual e os componentes existentes.
- Estados de carregamento, vazio, erro e sucesso devem ser explícitos.
- Ações destrutivas ou financeiras exigem confirmação adequada.
- Navegação deve respeitar papel e contexto, sem ser a única barreira de autorização.

## Melhorias presentes na 1.0.12

- `AdminNav` adaptado para telas menores.
- `BackButton` reutilizável em fluxos secundários.
- Cards e links do dashboard com alvos operacionais claros.
- Feedback de sucesso nos fluxos alterados.
- Ajustes de safe area e responsividade.

## Validação pendente

O build e a análise estática foram executados, mas ainda é necessário validar câmera/QR, teclado, safe area e navegação em Android e iPhone reais, além de revisão de acessibilidade assistiva.

## Painel Master 1.1.0

- Navegação própria e separada da gestão do estacionamento.
- Listas pesquisáveis, filtros de situação e ações com feedback.
- Bloqueio em overlay sem recarregar a página.
- Ações sensíveis exigem motivo e registram auditoria.
