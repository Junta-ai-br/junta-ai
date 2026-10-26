# Revisão técnica dirigida — Incremento A de metas

Data: 26/10/2026. Registro histórico da revisão e dos achados abaixo.

> Fechamento posterior, com escopo proporcional aprovado para o MVP:
> **PRONTO PARA COMMIT**. O frontend preserva somente identidades opacas em
> sessionStorage, bloqueia envios após reload e exige conferência/descarte
> explícito do aviso. Nenhum endpoint de recuperação foi necessário ou criado.
> Os antigos testes de reprodução foram convertidos em regressões contra reenvio:
> 52 testes direcionados passaram, além de lint/build. A proposta mais ampla e
> o parecer bloqueante abaixo documentam o estado anterior e foram substituídos
> por esse fechamento. Ver `mvp-goals-increment-a.md` para a limitação aceita.

## Achado bloqueante: identidade perdida após recarga

Em `frontend-v2/src/hooks/useGoals.js`, `active.command` existe apenas em memória
e cada chamada a `create` gera outro UUID. Após persistência com resposta perdida,
o botão de retomada protege o retry enquanto o hook permanece montado. Recarregar
a página, sair da rota ou remontar o hook destrói essa identidade.

Reprodução adicional: persistir o comando em um servidor simulado, perder sua
resposta, desmontar/remontar mantendo a autenticação, reenviar o mesmo formulário.
Resultado: duas chaves e duas criações. A listagem pode mostrar a primeira meta,
mas não impede a segunda; nomes iguais são permitidos pelo domínio.

O mesmo limite existe no aporte pelo chat: `useAssistantConversation.js` mantém
`recovery` em ref e cria uma chave por novo envio. A reprodução com histórico
persistido mostrou perda da recuperação após remount e uma nova identidade para
a mesma frase. Um novo envio pode aplicar outro aporte. O executor protege o
mesmo `action_id` e a mesma entrada de mensagem, não associa mensagens diferentes
por semelhança de conteúdo. Não seria correto impedir aportes legítimos iguais
por uma heurística de texto/valor.

Os testes de reprodução são de caracterização: suas duas asserções de duplicação
passam porque demonstram o risco existente, não porque aprovam esse comportamento.

### Menor correção proposta, ainda não implementada

1. Antes de despachar, registrar em `sessionStorage` apenas a identidade opaca da
   tentativa, operação e vínculo com uma instância estável da sessão autenticada.
   Essa instância precisa sobreviver ao reload e mudar no novo login; o Symbol de
   geração atual não é uma identidade persistível. Não copiar tokens, mensagens,
   nomes ou valores financeiros para esse registro; não usar localStorage.
2. Ao remontar, recuperar o estado da tentativa por consulta autenticada no
   backend. Reutilizar `goal_command_receipts` e as entradas/recibos existentes do
   chat; não criar outro domínio financeiro nem consultar por nome/valor.
3. Se concluída, mostrar o resultado oficial e reler as metas. Se pendente ou
   incerta, bloquear uma nova identidade e oferecer retomada explícita da mesma.
4. Um recibo não encontrado não prova que uma requisição anterior terminou sem
   efeito: ela pode estar em trânsito/execução. Manter o bloqueio; uma eventual
   reapresentação dos dados deve usar a mesma chave, com verificação no backend.
   Não limpar uma tentativa incerta só porque a reconciliação falhou.
5. Limpar o registro após resultado terminal conhecido ou troca/logout da sessão.
   Se o armazenamento estiver indisponível, não prometer recuperação após reload.

Isso requer recuperação autenticada de comandos HTTP e entradas de chat, além
do vínculo estável da sessão. Nenhum endpoint de recuperação foi criado nesta
revisão. Não basta armazenar o UUID e voltar a gerar outro ao reenviar.

## Duas falhas pontuais corrigidas nesta revisão

### Cabeçalhos repetidos

O binding anterior de `@RequestHeader UUID` aceitava duas ocorrências e escolhia
a primeira. A ordem dos cabeçalhos poderia alterar a identidade da operação.
`GoalController` agora exige exatamente um valor, UUID completo e sem lista
separada por vírgulas, para criação, aporte HTTP e exclusão. Ausência, duplicação
e formato inválido retornam 400 antes do comando. A idempotência não foi relaxada.

### Replay depois de o prazo passar

`@FutureOrPresent` no DTO rejeitava um replay idêntico após a mudança de dia,
antes da consulta ao recibo. O cliente interpretava 400 como recusa e descartava
a tentativa, embora a criação original pudesse estar persistida.

A validação temporal foi movida para `GoalService.create/update`: novas gravações
continuam rejeitando prazo passado, mas `GoalCommandService` pode recuperar o
recibo antes de executar o domínio. Validações estruturais, nome e precisão no DTO
continuam ativas. A resposta de prazo inválido passa pelo erro de negócio 400.

## Contrato de idempotência revisado

| Caso | Resultado |
|---|---|
| Mesma chave, usuário e solicitação com recibo | Recupera resposta original sem novo efeito |
| Criação/aporte repetido com mesma identidade | 200 + GoalResponse original |
| Exclusão repetida com mesma identidade | 204, mesmo após remoção da meta |
| Mesma chave após sucesso, outra operação/meta/corpo | 409 |
| Chave ausente, inválida ou repetida no HTTP | 400 |
| Usuários distintos com mesma chave | Namespaces separados pela PK composta |
| Requisições concorrentes com mesma chave | Unicidade/lock do recibo serializam o resultado |
| Aportes HTTP/chat distintos à mesma meta | Locks do domínio impedem perda de progresso |
| Falha antes do commit com rollback | Nenhum efeito ou recibo persistido; retry é reavaliado |
| Commit concluído e resposta perdida | Recibo preservado; depende de reutilizar a chave |
| Mesmos dados com nova chave | Nova operação; risco após reload ainda aberto |

O namespace é `(user_id, command_id)`, compartilhado pelas operações de metas.
A operação integra `request_json`; não há namespaces independentes que permitam
reutilizar silenciosamente a chave para outro efeito. A comparação do corpo é
literal após serialização, incluindo escala decimal: retries devem preservar a
solicitação original. A mesma quantia reformatada não é garantidamente equivalente.

Falhas com rollback não têm recibo de erro durável e não vinculam definitivamente
a chave. Isso é seguro quanto a efeitos financeiros revertidos, mas não equivale
a replay estável de todos os erros. A política foi explicitada em `docs/api.md`.
Recibos de sucesso são históricos; o card sempre relê `GET /goals` para estado atual.

## Consumidores e compatibilidade

- Único consumidor HTTP ativo encontrado nos três repositórios: `goals.api.js`,
  usado por `useGoals`/card. POST e DELETE fornecem chave. Não há adapter de aporte
  HTTP no frontend; o aporte do MVP usa o chat.
- Os consumidores HTTP dos testes existentes de metas fornecem chave. Os novos
  testes cobrem rejeição de ausência/formato/repetição e recuperação temporal.
- O protótipo usa funções e armazenamento locais, não esses endpoints. Não foi
  alterado nem tratado como fonte de metas autenticadas.
- O fluxo conversacional usa identidade de mensagem e `action_id` próprios,
  preservados; não chama GoalController nem precisa do novo header de metas.
- `goal_progress` mudou de nome para UUID como chave, incluindo `id` e `name`.
  Backend e AI Service têm dependência explícita desse formato para responder
  apenas com o nome a uma pergunta pendente. A documentação foi atualizada.
- Não foram verificados consumidores externos aos três repositórios. Clientes
  antigos que escrevam sem chave deverão ser atualizados; não há fallback inseguro.

## Segurança financeira e escopo

Nos caminhos de execução examinados, o backend permite somente expense, income
e goal_contribution. Não há operação executável de criação/edição/exclusão de meta
ou retirada pelo chat. O aporte chama somente GoalService; não cria transação
de receita/despesa e não representa movimentação bancária.

A seleção bloqueada exige uma única correspondência de nome do usuário. Homônimos,
metas ausentes/excluídas ou inelegíveis não são escolhidos arbitrariamente.
O card não soma progresso otimista e descarta respostas de outra geração de
sessão. Os testes PostgreSQL anteriores comprovam serialização HTTP/chat; eles
foram reutilizados. Essas garantias não eliminam uma segunda intenção com nova
identidade depois de reload.

Não foram identificadas mudanças de infraestrutura, Planejador, B/C ou refatorações
alheias nos diffs. O ajuste de status ao alterar alvo no endpoint existente faz
parte da integridade do domínio; não adiciona edição pelo chat.

## Arquivos e dependências de PRs

Frontend: `Assistente.jsx`, `resource-http.js`, `goals.api.js/.test.js`,
`useGoals.js/.test.jsx`, `GoalsCard.jsx/.css/.test.jsx`, relatório original e esta
revisão. Nesta rodada foi adicionado apenas o teste
`hooks/__tests__/goalReloadReview.test.jsx` e documentação; sem correção funcional
do reload. A proposta também envolve o `useAssistantConversation.js` existente.

Backend: `GoalController`, `GoalRepository`, `GoalService`, `GoalCommandService`,
`ActionExecutionService`, `ConversationTurnStore`, `V11__goal_command_receipts.sql`,
`GoalIntegrationTest`, `GoalServiceTest`, `GoalWritePostgresTest` e
`GoalConversationContractPostgresTest`. Nesta revisão: ajustes no controller,
`GoalRequest` e serviço de domínio, `docs/api.md`, novos `GoalIdempotencyReviewTest`
e `GoalCommandReplayReviewTest`, e um teste de prazo em `GoalServiceTest`.

AI Service: o Incremento A já altera código em `process_message.py`, `routing.py`,
`intent.py`, `numeric_spans.py`, `parser.py` e `temporal.py`, além de dois arquivos
de testes. **Nenhum arquivo do AI Service foi alterado nesta revisão.**

Migration: V11 segue V10 pela ordem numérica do Flyway; tabela de recibos depende
de `users` da V1. Não modificar migrations anteriores nem executar código dependente
de V11 antes da aplicação pelo mecanismo existente. Esta revisão não mudou schema
e não executou migrations, servidores ou bancos de produção.

Ordem sugerida, após resolver o bloqueio: backend (V11, contrato e recuperação),
AI Service (snapshot/continuidade), frontend (card e recuperação durável). O novo
frontend exige o backend atualizado. Os testes de transporte real exigem a versão
local correspondente do AI Service. Nada foi commitado/publicado.

## Testes adicionais executados

- Frontend: somente `goalReloadReview.test.jsx`, **2 passaram**. São reproduções
  com servidor simulado de criação e chat após persistência/resposta perdida/reload.
- Backend: `GoalIdempotencyReviewTest` (**3**), `GoalCommandReplayReviewTest` (**1**)
  e `GoalServiceTest` (**4**): **8 passaram**. Cobrem cabeçalhos, mudança de dia,
  replay sem domínio, conflito de operação/corpo e prazo inválido em gravação nova.
  São testes MVC/unitários; não repetem a validação PostgreSQL anterior.
- Reutilizados: 220 testes frontend, 46 backend, 776 AI e verificações visuais
  informados na entrega anterior. Suítes completas e chamadas Gemini não executadas.

Conclusão: o núcleo do backend protege a mesma identidade e os dois problemas
HTTP encontrados foram corrigidos. A garantia ponta a ponta ainda é incompleta
após recarga; **AJUSTES NECESSÁRIOS**, sem liberação para commit nesta revisão.
