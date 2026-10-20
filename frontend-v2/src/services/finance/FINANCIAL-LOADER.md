# Carregamento financeiro — Etapa 3.2.2

`createFinancialLoader()` cria uma instância por consumidor/provider. Não ativa a
integração nas telas, não persiste resultados e não importa dados locais antigos.

## Contrato público

- `load({ from, to, signal? })`: recebe datas inclusivas `YYYY-MM-DD`, aguarda
  categorias e todas as páginas e retorna um snapshot. Exige período explícito.
- `getSnapshot()`: retorna `{ status, period, data, error }`, imutável e estável
  enquanto o estado não muda. Confere a sessão antes de devolver dados.
- `subscribe(listener)`: notifica mudanças; retorna função de desinscrição.
- `cancel()`: cancela a operação pendente e descarta seus resultados.
- `dispose()`: aborta, remove inscrição e timer e apaga os dados da instância.

Estados: `idle`, `loading`, `success`, `empty`, `error`, `stale` e `cancelled`.
Somente `success` e `empty` contêm `data`. `empty` exige ambas as coleções vazias;
`categoriesStatus` e `transactionsStatus` distinguem coleções individualmente vazias.
Dados contêm `categories`, `transactions`, `summary` e `coverage`.
Transações usam o modelo assinado da Etapa 3.2.1; BigInt existe apenas em memória.
Para escrita, usar `transactionViewToRequest`, nunca serializar o snapshot.

Erros públicos contêm somente `code` e, para HTTP, `status`: `HTTP_ERROR`,
`NETWORK_ERROR`, `INVALID_RESPONSE`, `PAGINATION_INVALID`, `COVERAGE_UNKNOWN`,
`DUPLICATE_CONFLICT`, `INVALID_PERIOD`, `SESSION_INVALID`, `API_UNAVAILABLE` ou
`LOAD_FAILED`. Não expõem resposta, configuração Axios, tokens ou payloads.
Cancelamento não é erro financeiro. Uma chamada descartada retorna `stale` com
`STALE_SESSION`/`LOAD_SUPERSEDED`, ou `cancelled`, sem alterar a operação atual.

## Sessão e concorrência

O snapshot de autenticação fornece apenas geração opaca e expiração. Cada login
muda a geração, mesmo com tokens iguais. O loader observa notificações, programa
a expiração e confere geração/operação após cada await e antes de publicar dados,
erros ou conclusão. Novo período ou sessão limpa os dados anteriores imediatamente.
O cancelamento usa AbortController e também guardas lógicas, pois um transporte
pode concluir apesar do abort. Não há refresh ou retry adicional.

Cada `load` registra uma intenção antes de callbacks externos: a chamada mais
recente prevalece, inclusive quando iniciada dentro de um subscriber, fetcher ou
listener de abort. A operação antiga é desvinculada antes do abort e perde a
autoridade para publicar estado. Se o abort de `cancel()` iniciar outra carga, a
nova carga continua e a anterior retorna `stale`; o cancelamento antigo não a
sobrescreve. Se houver troca de sessão sem nova carga, prevalece o estado da nova
sessão. O finally antigo somente limpa recursos da própria chamada.

Notificações percorrem os subscribers presentes no início da publicação, respeitam
unsubscribe imediato e interrompem a publicação se um callback mudar estado ou
intenção. Uma publicação reentrante notifica o estado atual; a anterior não retoma
a entrega de um estado obsoleto. `dispose()` é definitivo: marca o loader como
descartado e limpa o estado antes de abortar. `getSnapshot()` já retorna
`cancelled` com `data: null` dentro dos callbacks síncronos de abort, inclusive
após troca de sessão. Chamadas a `load()` nesses callbacks ou após o descarte
retornam `cancelled` sem iniciar HTTP; a instância não pode ser reativada.
Novas inscrições após dispose não são retidas. Não há atrasos
artificiais para ordenar chamadas; callbacks de aplicação devem evitar ciclos
incondicionais de chamadas reentrantes.

## Paginação e cobertura

GET usa `from`, `to`, página zero e ordenação `transactionDate,id,asc`. Confere o
contrato Spring Page, índice, tamanho efetivo, totais, quantidade de elementos,
datas e última página. Falha intermediária nunca publica sucesso parcial.
Padrões: 100 itens/página, até 1.000 páginas e 100.000 registros. Opções podem
reduzir esses limites; tamanho pode subir até 2.000. Limites inválidos lançam
`INVALID_LIMITS`; cobertura que exceda limites retorna `COVERAGE_UNKNOWN`.

UUID é chave interna sem distinção de caixa; o valor original permanece literal.
Duplicatas equivalentes contam uma vez. Comparam-se categoryId, categoryName,
type, description, amount, transactionDate e createdAt. Divergência gera conflito,
sem escolher uma versão. Mesmo duplicatas equivalentes impedem declarar cobertura
quando o total de UUIDs únicos difere de totalElements. Categoria ausente no
catálogo também impede publicação. Não há categorização por nome ou defaults.

`coverage.complete` refere-se somente ao período explícito (`scope: "period"`).
Não existe inferência de início do histórico. Metadados estáveis e contagens não
garantem snapshot transacional: alterações concorrentes no backend que preservem
totais podem escapar à detecção. Garantia atômica exige suporte do backend.
As limitações de persistência/revogação do módulo de sessão permanecem as existentes;
o loader não cria uma segunda fonte de autenticação.

## Integração futura — Etapa 3.2.3

Criar uma instância no ciclo de vida do provider, inscrever o consumidor (por
exemplo, useSyncExternalStore), carregar período explícito e chamar dispose no
desmonte. Não manter dados de snapshots antigos em estados paralelos. Tratar todos
os estados e códigos; nenhuma falha pode ser traduzida para coleção vazia.
Invalidação após CRUD, seleção de período, apresentação dos estados e migração
dos consumidores do FinanceContext pertencem à próxima etapa. Hooks e telas ainda
não usam este módulo. `fetchCategories`/`fetchTransactions` são pontos de injeção
para testes; os padrões usam exclusivamente os serviços HTTP autenticados.
