# Guardado — entrega local para revisão

Status: **PRONTO PARA REVISÃO**, após correção dos quatro achados da revisão.
As três branches estão aptas para commits e PRs de revisão; isso não autoriza
publicação nem significa que as suítes amplas históricas estão verdes.
Implementação e correções em 31/10/2026. Nenhum staging, commit, push, PR, merge ou deploy.

## Branches, bases e worktrees

| Repositório | Branch | Base origin/main | Worktree, relativa à raiz do repositório |
| --- | --- | --- | --- |
| junta-ai | feat/guardado-dashboard | b12e78d | .worktrees/guardado-dashboard |
| junta-ai-backend | feat/guardado-financial-model | 356462d | .worktrees/guardado-financial-model |
| junta-ai-ai | feat/guardado-conversation | 44636f4 | .worktrees/guardado-conversation |

As referências foram atualizadas por fetch antes da criação das worktrees.
As branches e alterações locais anteriores foram preservadas. A sincronização
foi feita criando as novas branches diretamente de origin/main, sem integrar
mudanças nas branches de trabalho anteriores.

## Comportamento entregue

- Guardado soma currentAmount de todas as metas persistidas do usuário autenticado,
  inclusive concluídas com saldo. O cálculo SQL usa BigDecimal e não recebe período.
- Saldo continua sendo receitas menos despesas do período. Health Score preservado.
- Exclusão com saldo positivo é rejeitada sob o mesmo lock pessimista dos aportes
  e retiradas. Não há tabela de transferências ou alteração de schema.
- Aporte pergunta se os recursos já foram registrados. As opções estruturadas são
  source_registered e source_unregistered. Texto livre continua aceito.
- Origem não registrada pergunta salário, presente, recursos anteriores ou outra
  origem. Não cria receita. A receita pode ser solicitada separadamente pelo fluxo
  existente; a confirmação da reserva não autoriza receita. Recursos anteriores
  explicam a ausência de saldo inicial. Nenhum saldo conciliado é afirmado.
- Retirada esclarece liberação da reserva versus dinheiro gasto. Depois exige
  confirmação explícita. Não cria receita ou despesa automaticamente.
- A seleção de origem só gera proposta. O backend valida a confirmação financeira
  e só então executa. O frontend atualiza metas e Guardado consultando dados
  persistidos depois da resposta real, sem aplicar aportes otimistas.
- Botões usam elementos button, foco por teclado, área mínima de toque, estado de
  envio e bloqueio de duplicidade. Pendências canceladas/substituídas invalidam IDs.
  O replay com a mesma chave idempotente recupera a resposta; não reprocessa seleção.
- Guardado trata carregamento, indisponibilidade, zero real, sessão e respostas
  antigas. A consulta não depende do filtro mensal. Cards de metas mostram nome,
  acumulado, alvo, restante, percentual, progresso e conclusão; exclusão com saldo
  também fica desabilitada na interface.

## Contratos aditivos

GET /dashboard acrescenta saved, número decimal JSON produzido por BigDecimal.
O frontend preserva o lexema decimal e usa centavos BigInt; não passa por Number
para armazenar ou somar dinheiro. Os campos anteriores continuam presentes.
O snapshot interno do chat também recebe current_state.saved.

POST /conversations/{id}/messages mantém message e Idempotency-Key e aceita:

```json
{
  "message": "Sim, já registrei",
  "quickReply": {
    "option_id": "source_registered",
    "pending_id": "UUID da pendência",
    "conversation_id": "UUID da conversa"
  }
}
```

O backend resolve o rótulo pelo identificador, verifica ownership, conversa,
pendência e estado sob lock e encaminha quick_reply ao AI Service. A resposta
MessageResponse acrescenta quickReplies; mensagens antigas recebem lista vazia.
O AI Service acrescenta response.quick_replies e aceita quick_reply opcional.
O campo quick_reply ausente é omitido pelo backend no envio de texto comum.

PendingOperation acrescenta pending_id, conversation_id, resource_source e
prompt_message_id. A última associação é preenchida pelo backend com a mensagem
persistida. Esses dados cabem no pending_state JSON existente. Opções atuais são
reconstruídas desse estado; mensagens históricas obsoletas não ganham opções ativas.

## Correções dos quatro achados da revisão

1. **P1 — identidade na revisão de valor:** goal_withdrawal distingue seleção
   explícita de meta de revisão monetária. Sem nova seleção, procura a entidade
   pelo ID original no snapshot e só depois valida sua referência única. Exclusão,
   recriação com o mesmo nome ou identidade não verificável cancelam a proposta.
   Uma meta diferente exige seleção explícita e nova confirmação financeira.
2. **P2 — quick reply expirada:** sob o lock da conversa pertencente ao usuário,
   MessageEntryStore finaliza como FAILED somente entradas PROCESSING expiradas,
   sem ação selecionada, JSON de ação ou recibo. A nova admissão continua
   serializada. ACTION_SELECTED e RECEIPT_PENDING permanecem bloqueantes mesmo
   após o prazo; callbacks antigos não conseguem selecionar nem publicar resposta.
3. **P2 — precisão desde a entrada:** a rota HTTP e model_validate_json de
   AIServiceRequest decodificam os números JSON diretamente como Decimal. As
   comparações não usam float. Valores textuais continuam aceitos; float já
   fornecido por um chamador em memória é recusado, sem tentar reparar centavos.
   Não foram acrescentados campos nem dependências. No snapshot interno, Decimal
   é serializado como texto decimal exato, já suportado pelos contratos; os
   números monetários da API REST do dashboard permanecem inalterados.
4. **P2 — reconciliação:** useAssistantConversation centraliza a reconciliação
   financeira e invalida Guardado também ao encerrar a recuperação de uma
   operação incerta e nos caminhos de erro que já reconciliavam dados. A
   invalidação ocorre uma vez por reconciliação e somente se a sessão ainda for
   a mesma, inclusive quando outro painel falha ao atualizar. Não há soma
   otimista nem reenvio automático de operação financeira.

Testes adicionados nesta correção:

- AI: tests/scenario/test_guardado_review_fixes.py — 17 casos, cobrindo exclusão
  e recriação de meta homônima, ID preservado após renomeação, proposta sem ID
  invalidada, seleção explícita,
  JSON numérico real 100000000000000.07 e equivalente textual até ActionRequest,
  rejeição de float já arredondado e compatibilidade de erro HTTP 422.
- Backend: GuardadoQuickReplyExpiryPostgresTest — cinco casos em PostgreSQL 16
  real: expiração, nova tentativa, replay, duas admissões concorrentes, callback
  tardio e preservação de ação selecionada e recibo. Acrescentado um caso em
  GoalConversationContractPostgresTest para retirar 100000000000000.07 pelo
  backend e AI HTTP reais, verificando saldo final zero e nenhuma transação.
- Frontend: guardadoReconciliation.test.jsx — três casos integrando hooks reais,
  adaptadores HTTP e SavedCard: Guardado inicial zero, backend conclui R$ 200 e
  encerramento do aviso atualiza meta e Guardado com apenas uma consulta extra;
  sessão trocada durante a recuperação; falha de outro painel sem manter
  Guardado antigo.
- Ajustado o teste de centavos de test_service_boundary.py: com a leitura exata,
  verifica a apresentação correta do decimal bruto, em vez da antiga recusa
  motivada pelo arredondamento.

### Resultados desta correção

| Área | Execução direcionada | Resultado |
| --- | --- | --- |
| AI Service | Regressões dos quatro achados, Guardado/retiradas e contratos HTTP de entrada, erros, snapshot e entrega de ações | **206 aprovados**, zero falhas |
| Backend | GuardadoQuickReplyExpiryPostgresTest, GuardadoContractsTest, GoalConversationContractPostgresTest e GoalContributionConfirmationTest | **52 aprovados**, zero falhas/erros/skips |
| Frontend | guardadoReconciliation, useAssistantConversation, goalReloadReview, SavedCard e Assistente | **37 aprovados**, zero falhas |

O backend usou exclusivamente o cluster descartável PostgreSQL 16.15 em
127.0.0.1:15488 e o AI Service real em 127.0.0.1:58123, sem provedor pago.
As suítes amplas não foram repetidas: os resultados abaixo são históricos,
anteriores às correções. Permanecem os riscos já registrados de ativação conjunta
backend/AI e verificação visual manual. Não foi identificada pendência nos quatro
achados corrigidos. Não é necessária migração.

## Validação anterior às correções — histórico

| Área | Evidência |
| --- | --- |
| Backend amplo, PostgreSQL 16 e AI real | 372 casos: 352 executados aprovados, 20 skips, zero falhas/erros. Excluído somente MessageEntryMigrationPostgresTest. |
| Concorrência e precisão | PostgreSQL real: soma exata, isolamento, metas concluídas, zero, exclusão com/sem saldo e ambas as ordens de corrida aporte/exclusão. Também aprovados no PostgreSQL 18 descartável inicial. |
| Contrato backend → AI HTTP real | 8 testes aprovados: contribuição, retirada, esclarecimentos, opções, replay, cancelamento e recursos anteriores. Nenhum provedor pago usado. |
| AI direcionado | 257 testes aprovados: origens negadas/ambíguas, preservação do valor/meta ao responder à origem e gate MCP das retiradas. |
| AI amplo | 2549 aprovados e 295 falhas. Uma cópia intacta de origin/main teve 2529 aprovados e as mesmas 295 falhas; comparação por identificador não encontrou falhas novas nessa execução. |
| Frontend direcionado | 65 testes aprovados em nove arquivos: dashboard real, precisão, Guardado, sessão antiga, metas, chat, teclado, duplicidade, reconciliação e Health Score. |
| Frontend amplo | 1065 aprovados e uma falha no Planejador: slider esperado 4000, recebido 1000. Falha reproduzida isoladamente na cópia intacta de origin/main. |
| Build frontend | npm run build aprovado. |

O teste antigo MessageEntryMigrationPostgresTest presume uma única migração
depois de V5, mas origin/main já contém sete migrações posteriores. Sua execução
falhou com esperado 1 / recebido 7; a asserção não foi alterada nesta entrega.
Os 20 skips do backend continuam condicionados às configurações das respectivas
suítes. Não são testes aprovados.

## Limites e dependências de integração

Não é necessário criar migração. Backend e AI Service devem ser revisados e
integrados como um par: o novo fluxo depende de preservar os metadados da
pendência nos dois serviços. O frontend depende desse par e de saved no backend.
Atualizar somente o AI Service com um backend antigo pode perder os novos
metadados e impedir a continuidade do aporte; coordenar a ativação dos serviços.

A classificação é para revisão do diff local, não para publicação automática.
As suítes amplas ainda têm as falhas preexistentes descritas acima. A origem por
texto usa vocabulário determinístico limitado; respostas incertas pedem
esclarecimento. Não há conciliação, saldo inicial, extrato de transferências,
Open Finance ou alterações no Health Score. Verificação visual em navegador real
para tamanhos de tela e temas permanece manual; os estilos usam os tokens
existentes e os testes verificam os comportamentos acessíveis.

Os serviços locais e clusters usados nos testes são temporários e os logs ficam
nas pastas ignoradas de cache/target. O inventário completo de arquivos desta
entrega aparece abaixo.

## Arquivos alterados

### Frontend

- docs/guardado-delivery.md
- frontend-v2/src/components/chat/AssistantConversation.jsx
- frontend-v2/src/components/chat/AssistantConversation.test.jsx
- frontend-v2/src/components/chat/QuickReplies.css
- frontend-v2/src/components/finance/GoalsCard.jsx
- frontend-v2/src/components/finance/GoalsCard.test.jsx
- frontend-v2/src/components/finance/SavedCard.css
- frontend-v2/src/components/finance/SavedCard.jsx
- frontend-v2/src/components/finance/SavedCard.test.jsx
- frontend-v2/src/hooks/__tests__/guardadoReconciliation.test.jsx
- frontend-v2/src/hooks/__tests__/useAssistantConversation.test.js
- frontend-v2/src/hooks/useAssistantConversation.js
- frontend-v2/src/hooks/useGoals.js
- frontend-v2/src/hooks/useSaved.js
- frontend-v2/src/pages/Assistente/Assistente.jsx
- frontend-v2/src/pages/Dashboard/Dashboard.test.jsx
- frontend-v2/src/pages/VisaoMes/VisaoMes.css
- frontend-v2/src/pages/VisaoMes/VisaoMes.jsx
- frontend-v2/src/services/conversations.api.js
- frontend-v2/src/services/finance/financeHealth.js
- frontend-v2/src/services/saved.api.js

### Backend

- docs/guardado.md
- src/main/java/br/com/juntaai/dto/conversation/ChatMessageRequest.java
- src/main/java/br/com/juntaai/dto/conversation/MessageResponse.java
- src/main/java/br/com/juntaai/dto/dashboard/DashboardResponse.java
- src/main/java/br/com/juntaai/integration/ai/model/AIServiceRequest.java
- src/main/java/br/com/juntaai/integration/ai/model/ConversationalResponse.java
- src/main/java/br/com/juntaai/integration/ai/model/PendingOperation.java
- src/main/java/br/com/juntaai/integration/ai/model/QuickReplySelection.java
- src/main/java/br/com/juntaai/repository/GoalRepository.java
- src/main/java/br/com/juntaai/service/ActionExecutionService.java
- src/main/java/br/com/juntaai/service/ConversationOptions.java
- src/main/java/br/com/juntaai/service/ConversationService.java
- src/main/java/br/com/juntaai/service/ConversationTurnStore.java
- src/main/java/br/com/juntaai/service/DashboardService.java
- src/main/java/br/com/juntaai/service/GoalService.java
- src/main/java/br/com/juntaai/service/MessageEntryStore.java
- src/test/java/br/com/juntaai/service/ConversationCategoryCatalogTest.java
- src/test/java/br/com/juntaai/service/DashboardServiceTest.java
- src/test/java/br/com/juntaai/service/GoalConversationContractPostgresTest.java
- src/test/java/br/com/juntaai/service/GoalServiceTest.java
- src/test/java/br/com/juntaai/service/GoalWithdrawalPostgresTest.java
- src/test/java/br/com/juntaai/service/GoalWritePostgresTest.java
- src/test/java/br/com/juntaai/service/GuardadoContractsTest.java
- src/test/java/br/com/juntaai/service/GuardadoPostgresTest.java
- src/test/java/br/com/juntaai/service/GuardadoQuickReplyExpiryPostgresTest.java

### AI Service

- docs/guardado.md
- src/junta_ai/api/delivery.py
- src/junta_ai/application/goal_contribution.py
- src/junta_ai/application/goal_withdrawal.py
- src/junta_ai/application/process_message.py
- src/junta_ai/application/resource_source.py
- src/junta_ai/domain/models.py
- src/junta_ai/interpretation/goal_withdrawal.py
- tests/contract/test_goal_contribution_delivery.py
- tests/contract/test_service_boundary.py
- tests/integration/test_response_agent.py
- tests/scenario/test_deterministic_routing.py
- tests/scenario/test_gift_income_continuity.py
- tests/scenario/test_goal_contribution_conversation.py
- tests/scenario/test_goal_withdrawal.py
- tests/scenario/test_guardado.py
- tests/scenario/test_guardado_review_fixes.py
- tests/scenario/test_mvp_goal_contributions.py
- tests/scenario/test_pending_instruction_replacement.py
- tests/scenario/test_quickstart.py
