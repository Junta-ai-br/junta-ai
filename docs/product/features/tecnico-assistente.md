# Assistente — documentação técnica

**Revisão:** 08/11/2026 · **Rota:** `/assistente` · **Arquivo principal:** `frontend-v2/src/pages/Assistente/Assistente.jsx`

A tela do Assistente junta o chat com o agente de IA e um resumo do mês corrente. Cada bloco tem uma fonte de dados certa, e nenhum deles inventa valor quando a fonte falha: aparece "Indisponível" ou um botão para atualizar.

Arquitetura, tecnologias e decisões gerais: [tecnico-visao-geral.md](tecnico-visao-geral.md).

## 1. Blocos da tela e fontes de dados

| Bloco | O que mostra | Fonte |
|---|---|---|
| Resumo | Receitas, Despesas e Saldo do mês corrente | `useCanonicalFinance` → `GET /transactions`, somas em centavos (`summarizeExact`) |
| Guardado | Total das metas, saldo disponível e total acompanhado | `useSaved` → `GET /dashboard` (campos `saved`, `availableBalance` e `totalTracked`); só exibe se disponível + guardado = total |
| Chat | Conversa com o agente; lançamentos e aportes feitos por mensagem | `useAssistantConversation` → `POST /conversations/{id}/messages` |
| Minhas metas | Lista com progresso, quanto falta, status e prazo; criar com + e excluir | `useGoals` → `GET/POST/DELETE /goals` |
| Saúde financeira | Score, classificação, barra de 0 a 100 e período | `useHealthScore` → `GET /dashboard` |
| Visão do mês / Seus números | Saldo do mês, rosca por categoria, percentuais e os 4 últimos lançamentos; leva a `/visao-mes` | Mesmos lançamentos do resumo |

## 2. Fluxo do chat

1. O usuário envia uma mensagem; o front chama `POST /conversations/{id}/messages`.
2. O backend repassa a mensagem ao serviço de IA (`POST /v1/conversations/process`).
3. A IA devolve uma interpretação. Se a ação tem confiança alta e a categoria pertence ao usuário, o backend executa (grava a despesa, a receita ou o aporte).
4. O backend devolve a resposta do assistente, com `actionExecuted` indicando se algo foi gravado.
5. O front recarrega lançamentos e metas. Enquanto isso, os cards mostram "Aguardando confirmação" e nenhum número desatualizado é exibido como certo.

**Limitação conhecida (modo sem LLM):** com `JUNTA_ORCHESTRATION_ENABLED=false`, o agente só reconhece frases com verbos como gastei, paguei, comprei, recebi ou ganhei. Frases como "Saída 100" ou "Entrada 100" recebem a pergunta "Você quer consultar informações ou registrar uma movimentação?", e responder "registrar" não destrava essa pergunta. Com o modo LLM (CrewAI + Gemini) ativo, frases livres são interpretadas.

## 3. Regras exibidas na tela

- **Período:** o Assistente sempre mostra o mês civil corrente, do dia 1 ao último dia.
- **Últimos lançamentos:** os 4 mais recentes, ordenados por data, criação e id.
- **Saldo:** verde quando positivo, vermelho quando negativo.

As regras de lançamentos e do percentual por categoria estão em [tecnico-visao-do-mes-e-dashboard.md](tecnico-visao-do-mes-e-dashboard.md), as de metas em [tecnico-metas-e-guardado.md](tecnico-metas-e-guardado.md), e a do score em [tecnico-saude-financeira.md](tecnico-saude-financeira.md).

## 4. Testes

`pages/Assistente/Assistente.test.jsx` tem 16 casos.

[Voltar ao índice técnico](tecnico-visao-geral.md).
