# Metas e Guardado — documentação técnica

**Revisão:** 08/11/2026 · **Front:** `components/finance/GoalsCard.jsx`, `components/finance/SavedCard.jsx`, `hooks/useGoals.js`, `hooks/useSaved.js` · **Back:** `GoalService`, `FinancialPositionService`

O backend é a autoridade de todas as regras. O frontend repete algumas validações só para avisar o usuário mais cedo.

## 1. Minhas metas

- Para criar uma meta são obrigatórios um nome de 2 a 150 caracteres e um valor-alvo positivo, de até 15 dígitos e 2 casas. O prazo é opcional e não pode estar no passado.
- **Progresso** = valor guardado ÷ valor-alvo, limitado a 100%. O card também mostra quanto falta (alvo − guardado, nunca negativo).
- **Status:** `IN_PROGRESS`, `COMPLETED` (vira automaticamente quando o guardado alcança o alvo) ou `CANCELLED`.
- Uma meta concluída ou cancelada não pode ser editada, e uma meta que não está em andamento não recebe aportes.
- Uma retirada não pode passar do valor guardado. Se o guardado cair abaixo do alvo, a meta volta para `IN_PROGRESS`.
- Uma meta com dinheiro guardado não pode ser excluída: "Retire o valor guardado antes de excluir a meta."
- Cada criação ou exclusão leva uma chave de idempotência. Se a resposta se perde, o card avisa e não reenvia sozinho, para não duplicar a meta.

## 2. Guardado, saldo disponível e total acompanhado

Esses três valores não dependem do período escolhido na tela. Eles consideram todos os lançamentos até hoje, no fuso de São Paulo.

| Valor | Fórmula |
|---|---|
| Total acompanhado | soma de todas as receitas − soma de todas as despesas até hoje |
| Guardado | soma do valor atual de todas as metas |
| Saldo disponível | total acompanhado − guardado |

- Um aporte numa meta é recusado se for maior que o saldo disponível. Assim não dá para guardar dinheiro que não foi registrado.
- Se o guardado passar do total acompanhado positivo, o card mostra o aviso de reserva inconsistente.
- O front só exibe saldo disponível e total acompanhado se disponível + guardado = total, centavo a centavo.

## 3. Fontes de dados

| Dado | Endpoint |
|---|---|
| Lista de metas | `GET /goals` |
| Criar / excluir meta | `POST /goals`, `DELETE /goals/{id}` (com `Idempotency-Key`) |
| Guardado e posição | `GET /dashboard` (campos `saved`, `availableBalance`, `totalTracked`, `reservationInconsistent`) |

## 4. Decisões, testes e escala

- **Guardado independente do período:** a reserva é uma posição acumulada, não um movimento do mês.
- **Testes:** `FinancialPositionServiceTest` (backend) cobre saldo disponível, total acompanhado e reserva inconsistente; `GoalServiceTest` e `GoalIntegrationTest` cobrem progresso, conclusão automática e bloqueios; o card de metas é testado em `components/finance/GoalsCard.test.jsx`.
- **Escala:** o Guardado soma todo o histórico do usuário a cada leitura. Um saldo acumulado por mês reduziria esse custo no futuro.

[Voltar ao índice técnico](tecnico-visao-geral.md).
