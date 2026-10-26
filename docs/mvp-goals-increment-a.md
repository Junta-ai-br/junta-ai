# Metas do MVP — Incremento A

Data: 26/10/2026. Escopo: card autenticado, criação manual, exclusão confirmada,
aportes existentes por conversa e integridade. Retiradas e importação não foram
implementadas. O chat não cria, exclui nem edita a definição de metas.

> Fechamento do MVP em 26/10: **PRONTO PARA COMMIT**. A chave opaca agora é
> preservada em sessionStorage, vinculada à sessão, sem payloads ou tokens.
> Após reload, metas e histórico são consultados novamente; novos envios ficam
> bloqueados até conferência e encerramento explícito do aviso. Nada é reenviado
> automaticamente. Validação desta rodada: 52 testes direcionados, lint e build.
> Sem mudanças em autenticação, contratos de IA, banco ou infraestrutura.

## Bases e isolamento

Os três repositórios usam worktrees novos `.worktrees/mvp-goals-integration`,
branch local `feat/mvp-goals-integration`, sobre `origin/main` atualizado:

| Repositório | Base |
|---|---|
| junta-ai | 1a04de2 |
| junta-ai-backend | 7d5992b |
| junta-ai-ai | 564e4b0 |

As branches e alterações anteriores foram preservadas. Nenhum commit, push,
merge, PR ou deploy foi realizado.

## Comportamento e contratos

- O Assistente consulta `GET /goals`; não usa metas de localStorage nem seeds.
- O formulário envia nome, alvo e vencimento opcional para `POST /goals`.
- A lixeira exige confirmação antes de `DELETE /goals/{id}`.
- O card mostra valores exatos, progresso limitado visualmente a 100%, status,
  prazo, carregamento, vazio e erro. O valor acumulado real não é truncado.
- Criação/exclusão recarregam a listagem após confirmação. O chat recarrega metas
  e finanças após a resposta, incluindo replay de uma mensagem já processada.
- Durante envio/recuperação do chat, o progresso fica oculto até reconciliação.
- Geração de sessão protege despacho e resposta; trocar conta descarta leituras,
  comandos pendentes e campos do formulário da conta anterior.
- Nome, valor e referência ausentes geram esclarecimento. A resposta com somente
  o nome resolve uma pergunta pendente apenas com correspondência exata e única
  no snapshot do backend. Não há busca aproximada.

### Compatibilidade necessária entre frontend e backend

`POST /goals`, `PATCH /goals/{id}/progress` e `DELETE /goals/{id}` agora exigem
`Idempotency-Key` com UUID. Ausência ou formato inválido retorna 400.
O adapter de metas fornece a chave. `PUT /goals/{id}` continua sendo atualização
idempotente da definição, sem nova capacidade conversacional.

A identidade representa uma tentativa lógica: retries reutilizam a mesma chave
e os mesmos dados. A mesma chave com dados/operação diferentes retorna 409.
Chaves diferentes representam operações diferentes; não existe deduplicação
heurística por nome, valor ou texto do usuário.

O snapshot `goal_progress` passa a usar UUID como chave e inclui `id` e `name`
no valor, além de alvo, acumulado e status. Isso preserva metas homônimas sem
sobrescrita. A execução continua resolvendo e autorizando a meta no backend.

## Persistência, concorrência e resultados incertos

`V11__goal_command_receipts.sql` adiciona recibos HTTP por usuário/chave.
Recibo e efeito são gravados na mesma transação. Uma tentativa concorrente com
a mesma chave espera o resultado já persistido; exclusão mantém seu recibo mesmo
depois de remover a meta. Um replay de criação pode devolver o recibo original
de uma meta posteriormente excluída: a interface sempre relê a lista atual.

Atualização, exclusão e aporte HTTP usam bloqueio pessimista da meta por usuário.
A seleção conversacional bloqueia as correspondências por nome e exige uma
única meta. Metas homônimas, inexistentes, excluídas ou inelegíveis não recebem
aporte. O executor preserva seus recibos e deduplicação de `action_id` existentes.

Validação no domínio rejeita aporte nulo, zero, negativo, excesso de casas,
limite excedido e estouro do acumulado. `BigDecimal`/NUMERIC persistem valores;
o frontend captura decimais do JSON antes de perder precisão e calcula progresso
com centavos BigInt. Aporte não cria receita, despesa ou transferência bancária.

Em falha de rede/resposta inválida, a interface não anuncia sucesso nem repete
automaticamente uma gravação. Na mesma montagem, a retomada explícita mantém a
chave e o corpo em memória. Apenas a chave e um vínculo opaco da sessão ficam em
sessionStorage. Depois de reload/remount, sem o corpo original, não há reenvio:
a interface relê as metas/histórico, mostra resultado incerto e bloqueia novos
envios até conferência e descarte explícito do aviso. Confirmar o aviso não
confirma sucesso nem desfaz o efeito anterior. Se o armazenamento falhar antes
do despacho, a operação não é enviada. Logout/nova sessão limpa os marcadores;
renovação de tokens mantém o vínculo. Nenhuma função de autenticação foi alterada.

## Arquivos da implementação

Frontend, sob `frontend-v2/src`:

- `components/finance/GoalsCard.jsx`, `.css`, `.test.jsx`;
- `hooks/useGoals.js`, `hooks/useGoals.test.jsx`;
- `services/goals.api.js`, `services/goals.api.test.js`;
- `services/resource-http.js`;
- `pages/Assistente/Assistente.jsx`.

Backend, sob `src/main`:

- `java/br/com/juntaai/controller/GoalController.java`;
- `java/br/com/juntaai/repository/GoalRepository.java`;
- `java/br/com/juntaai/service/GoalService.java`, `GoalCommandService.java`;
- `java/br/com/juntaai/service/ActionExecutionService.java`;
- `java/br/com/juntaai/service/ConversationTurnStore.java`;
- `resources/db/migration/V11__goal_command_receipts.sql`.

Testes backend: `GoalIntegrationTest`, `GoalServiceTest`,
`GoalWritePostgresTest` e `GoalConversationContractPostgresTest`.

AI Service, sob `src/junta_ai`:

- `application/routing.py`, `application/process_message.py`;
- `interpretation/intent.py`, `parser.py`, `numeric_spans.py`, `temporal.py`.

Testes AI: `tests/scenario/test_mvp_goal_contributions.py` e ajuste da expectativa
de roteamento determinístico em `tests/scenario/test_deterministic_routing.py`.
O MCP experimental permanece inalterado.

## Verificação

Os testes não usam contas de produção ou chamadas pagas ao Gemini.

- Frontend: 220 testes direcionados de contratos, comandos financeiros, card,
  isolamento de sessão e Assistente; lint dos arquivos de implementação alterados;
  build com o lockfile original.
- Navegador Chrome headless: 1440×1000 e 390×1000, criação e exclusão confirmada,
  recarga após resposta de chat e ausência de overflow horizontal. APIs foram
  interceptadas com dados sintéticos apenas nesse teste visual.
- Backend: 46 testes de metas e execução, incluindo testes unitários, HTTP autenticado e PostgreSQL real
  descartável, incluindo concorrência HTTP/HTTP, HTTP/chat, mesma chave,
  propriedade, precisão, conclusão, exclusão, recibos e snapshot com homônimos.
- Transporte real: `GoalConversationContractPostgresTest` usa Spring Boot →
  AI Service HTTP local determinístico → PostgreSQL para aporte, replay,
  esclarecimento de valor/nome e homônimos. O frontend não participa deste teste.
- AI: 776 testes de regressão direcionados de roteamento, aportes, pendências, confirmação,
  precisão e guardrails. O ambiente usa Python 3.12 e a venv existente.

Os testes PostgreSQL exigem banco descartável com nome contendo
`junta_i3_disposable_`, `I3_DISPOSABLE_DB=true`, `DB_URL`, `DB_USER` e
`DB_PASSWORD`. O teste de transporte real também exige `GOALS_REAL_AI=true` e
AI Service em `127.0.0.1:58123`, com orquestração e MCP desabilitados.
Não usar esses comandos contra banco de desenvolvimento compartilhado/produção.
O PostgreSQL disponível foi 18.6; Flyway emitiu aviso de versão superior à matriz
testada da biblioteca. Nenhuma dependência ou infraestrutura foi alterada.

## Dependências e próximas revisões

O fluxo de aporte depende do endpoint de IA acessível ao backend, do contrato
`goal_contribution`, do snapshot autorizado e dos recibos existentes. Não depende
do Gemini para os padrões determinísticos cobertos. O perfil MCP experimental
continua bloqueando ações financeiras conforme sua política atual.

Incremento B: operação distinta de retirada com valor solicitado positivo,
subtração atômica limitada ao disponível, idempotência, esclarecimento e retorno
de COMPLETED para IN_PROGRESS quando apropriado. Sem receita/despesa automática.

Incremento C: importação explícita com revisão e confirmação, vencimento vazio
por padrão, progresso zero e preservação da simulação. Exige vínculo persistente,
unicidade e política de nova importação após exclusão com confirmação explícita.
Não confundir o recibo HTTP com o vínculo de origem da simulação.

O módulo completo depende desses dois incrementos e não é considerado concluído.

Parecer do Incremento A para o MVP: **PRONTO PARA COMMIT**. As seleções de testes descritas
passaram; não foi executada a suíte completa de cada repositório. Os servidores
locais de verificação foram encerrados e os dados PostgreSQL descartáveis removidos.

No fechamento, foram alterados somente o frontend (serviço de marcador opaco,
inicialização, hooks de metas/chat, avisos e testes correspondentes) e documentação.
O smoke integrado anterior foi reaproveitado; seus serviços já estavam encerrados.
Limitação aceita para a apresentação: sem consulta de recibos após reload, o
usuário confere o estado real e decide explicitamente encerrar o aviso. Um envio
manual posterior é outra operação e pode repetir um efeito anterior. Não há
recuperação automática, histórico de tentativas ou tratamento de múltiplas abas.
