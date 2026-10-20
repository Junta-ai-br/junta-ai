# Comandos financeiros — Etapa 3.2.3

`createFinancialCommands()` cria uma instância por futuro provider. Ela possui um
loader real da Etapa 3.2.2 e usa os serviços HTTP existentes. Nenhuma tela ou
FinanceContext foi ativado. Não há persistência financeira local, importação do
legado, categorias padrão, atualização otimista ou retry de escrita.

## API pública

- `createTransaction(body)`, `updateTransaction(id, body)`, `deleteTransaction(id)`.
- `createCategory(body)`, `updateCategory(id, body)`, `deleteCategory(id)`.
- `load({ from, to, signal? })`: carrega o período explicitamente pelo loader.
- `getSnapshot()`: `{ pending, lastResult, refreshRequired, view }` imutável e
  estável enquanto esses valores não mudarem. `pending` inclui comandos em fila,
  escrita e sincronização; `view` é o snapshot completo do loader, sem coleção
  incremental. `lastResult` é o resultado da solicitação mais recente concluída
  que ainda possui autoridade; um resultado anterior pode permanecer durante
  outra solicitação pendente. Cada chamada também devolve seu próprio resultado.
- `subscribe(listener)`: notificação sem argumentos; retorna unsubscribe.
- `dispose()`: definitivo; limpa resultados, descarta o loader e aborta transportes
  pendentes. Não desfaz uma escrita que o servidor já recebeu.

Os corpos de transações usam o adapter aprovado: `type` explícito, `amount` como
texto decimal positivo exato, magnitude até NUMERIC(19,2), categoryId UUID e data
`YYYY-MM-DD`. Não aceitar Number/BigInt como amount neste contrato de comandos.
Campos exclusivos da resposta/modelo assinado não são enviados. Atualização usa
o UUID passado na URL e exige identidade equivalente no retorno. Categorias usam
nome literal com a validação compartilhada de Unicode e enums reais. Não existe
identidade por nome ou regra de compatibilidade de tipo criada no frontend.

## Resultados

Cada comando resolve `{ operation, status, ... }`:

- `confirmed`: somente após serviço HTTP confirmar resposta válida (200 ou DELETE
  204 vazio). Inclui `id` e `refresh`. Não devolve DTO financeiro em estado paralelo.
- `error`: validação local antes do envio, indisponibilidade comprovada antes de
  envio, ou resposta HTTP 4xx efetiva. Inclui `error`.
- `indeterminate`: timeout, erro de rede, cancelamento de transporte sem troca de
  sessão, resposta de sucesso inválida ou 5xx. Não prova rollback, não significa
  sucesso e não é repetido automaticamente. Marcar visualização para reconciliação.
- `stale`: geração de sessão mudou; nenhum sucesso/erro antigo é publicado.
- `cancelled`: instância descartada; nenhuma nova escrita é iniciada.

`error.kind` distingue `validation`, `unavailable`, `http`, `transport` e
`invalid_response`. Erros HTTP preservam status e os campos reais `mensagem` e
`campos` dos DTOs; não inventam mensagem ou código de integridade. Configuração
Axios, tokens, objetos request e campos internos não são publicados nem logados.
Os códigos locais de validação/transporte não são códigos do backend.
401 da sessão corrente invalida autenticação pelo interceptor existente; o comando
termina obsoleto. 403 preserva sessão. Respostas 400/404/409/422 são erros HTTP;
5xx é conservadoramente indeterminado, mesmo quando um erro específico puder ter
causado rollback. Não inferir confirmação a partir de ausência de exceção na UI.

## Sincronização e concorrência

Escritas e seus refreshes são FIFO por instância/geração. Uma segunda mutação
explicitamente solicitada aguarda a escrita e a sincronização da primeira; não é
retry. Uma sessão nova ganha fila independente, sem aguardar o transporte antigo.
Cada comando captura uma cópia de seu corpo validado e a geração opaca, conferida
antes/depois de awaits. Não usa JWT para comparação. Mudança de sessão descarta
resultados/fila da geração anterior e aborta seus transportes. Escritas abortadas
podem já ter sido persistidas na conta anterior; seus resultados não são aplicados
na conta nova.

Os serviços aceitam opções finais opcionais `{ signal, sessionGeneration }`, sem
alterar assinaturas anteriores. resource-http verifica a geração imediatamente
antes da serialização/adapter do Axios, fechando a janela entre chamada e envio
do Bearer. Essas opções não entram em JSON nem query. Interceptors e serializers
existentes permanecem responsáveis por autenticação e precisão monetária.

Após confirmação, o período atualmente selecionado é recarregado por inteiro,
incluindo categorias, mesmo se a transação alterada estiver fora dele. Sem período
conhecido, `refresh.status` é `required`, razão `NO_PERIOD`; não se inventa início
do histórico. `refresh.status: synced` exige snapshot completo ainda corrente.
Falha de leitura mantém o comando `confirmed`, com `refresh.status: error` e
`refreshRequired: true`. Uma leitura substituída/cancelada retorna refresh required.
Uma leitura explícita posterior bem-sucedida pode reconciliar a visualização.

O retorno de `load()` confere a geração de sessão e a identidade da solicitação
antes de reconciliar e novamente após a notificação final. Uma carga mais recente
prevalece mesmo com datas iguais. Se um subscriber trocar sessão ou iniciar outra
carga, o retorno anterior é `stale` com `data: null`; após dispose é `cancelled`.
Não basta comparar datas ou uma referência anterior ao callback. A guarda final
não restaura snapshots nem altera o refreshRequired da operação nova. Cancelar
o refresh mantém a escrita `confirmed` e a reconciliação pendente.

Resultado indeterminado mantém o último snapshot confirmado ou cancela leitura
pendente, com `refreshRequired: true`. Consumidores devem exibir essa necessidade
e não apresentar o snapshot como atualizado. Carregamento iniciado antes de uma
confirmação/incerteza não elimina essa marca; uma revisão de dados protege esse
limite. O loader continua responsável por paginação, deduplicação, conflitos e
descarte de respostas de períodos anteriores. Não há promessa de snapshot atômico
entre páginas, nem proteção contra escritas externas à instância.

## Contratos reais e decisões pendentes do backend

Inspecionados CategoryRequest/Response, TransactionRequest/Response, controllers,
CategoryService, TransactionService, GlobalExceptionHandler e V1__init.sql.

- A FK transactions.category_id usa ON DELETE RESTRICT. CategoryService.delete
  não remove/recategoriza transações e o frontend também não faz cascata.
- Não há handler específico de DataIntegrityViolationException: a exclusão de
  categoria vinculada pode chegar como 500 genérico, não como 409 específico.
  Portanto ela não pode ser anunciada como sucesso ou classificada como conflito
  de integridade identificado sem decisão do backend.
- Criação de categoria verifica nome sem distinção de caixa e pode responder 409;
  update depende da unicidade do banco. Nome não é identidade no frontend.
- TransactionService verifica propriedade da categoria, mas não compatibilidade
  INCOME/EXPENSE versus tipo de categoria. Nenhuma regra paralela foi acrescentada.
- @PastOrPresent é decidido no backend com seu relógio/fuso. O comando valida a
  data civil e propaga a validação HTTP, sem inventar um relógio de servidor local.
- O backend não fornece idempotência nestes endpoints nem mecanismo de consulta
  do resultado de uma escrita incerta. GET reconcilia a visão, mas não prova qual
  tentativa de POST foi persistida. Não repetir automaticamente operação incerta.

## Dependências da Etapa 3.2.4

Integrar um único owner no ciclo de vida do provider, usar subscribe/getSnapshot,
selecionar períodos explícitos, tratar pending/lastResult/refreshRequired e chamar
dispose no desmonte. Não guardar cópias de dados de sessões anteriores ou usar o
store legado como fallback. Decidir apresentação de resultado indeterminado e
refresh falho após confirmação. As opções de injeção `loader` e `services` existem
para testes; quando um loader é fornecido, a instância assume seu ciclo de vida.
Não compartilhar o loader ou criar múltiplas filas para um mesmo consumidor.
