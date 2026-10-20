# Dinheiro assinado — etapa 3.2.1

Helpers puros, ainda sem conexão com FinanceContext, telas, HTTP ou localStorage.
Os agregadores e o formatMoney legados permanecem intactos. Não há novas
dependências, categorias, regras de persistência, transferências ou estornos.

## Dinheiro: signed-money.js

- `isSignedMoney(text)` valida uma string decimal; `decimalToCents(text)` produz
  BigInt em centavos; `centsToDecimal(cents)` faz a conversão inversa.
- São aceitos inteiros ou uma/duas casas decimais, sinal negativo opcional e
  zeros à esquerda. Não há trim. A forma canônica sempre tem duas casas,
  sem zeros inteiros extras, sem `+`: `00012.3` → `12.30`; `-0.00` → `0.00`.
- Rejeitam-se Number, NaN/Infinity, expoentes, vírgula, espaços, strings vazias,
  sinal `+` e qualquer terceira casa, inclusive zero. Não há arredondamento.
  Essa entrada é deliberadamente mais restrita que normalizeMoney do transporte,
  que também lida com notação científica emitida por BigDecimal. O adapter recebe
  o DTO já normalizado pelo serviço HTTP da etapa 2.
- `addMoney`, `subtractMoney`, `sumMoney` e `compareMoney` operam exatamente.
  Compare retorna apenas -1/0/1, não um valor monetário numérico.
- Valores assinados e agregados não têm o teto de uma transação: BigInt permite
  ultrapassar NUMERIC(19,2), sujeito aos recursos de memória do ambiente.
- Erros de entrada usam SignedMoneyError, code `ERR_SIGNED_MONEY`; nunca viram zero.
- `formatMoneyBRL(textOuCentavos, { magnitude: false })` preserva o sinal por
  padrão; `magnitude: true` só muda a exibição. Ex.: `-20.00` → `-R$ 20,00`.
  Um argumento BigInt significa centavos. A formatação agrupa dígitos como texto,
  com espaço comum, sem Number, Math.abs ou toFixed.

## Adapter: transaction-adapter.js

`transactionDtoToView(dto)` exige TransactionResponse válido da etapa 2 e retorna
novo objeto com os campos originais do contrato, sem normalizar nomes ou datas:

```js
{
  id, categoryId, categoryName, type, description, amount, transactionDate, createdAt,
  signedAmount, // string canônica: INCOME "120.05", EXPENSE "-120.05"
  signedCents,  // BigInt: 12005n ou -12005n
}
```

`amount` continua sendo a magnitude positiva da API. O sinal é derivado do tipo,
uma única vez; reaplicar o adapter aos campos de resposta não inverte despesas.
UUID é a identidade da categoria; o nome Unicode é preservado literalmente.

`prepareTransactionRequest(input)` exige `type` explícito e `amount` como string
de magnitude positiva entre `0.01` e `99999999999999999.99`. Retorna somente
`categoryId`, `type`, `description`, `amount`, `transactionDate`; description
omitida torna-se null, permitido pelo contrato existente. Reusa validação de
UUID, tipo, data e descrição. Não determina operação a partir de sinal visual.
Data futura e propriedade/elegibilidade da categoria continuam a cargo do backend.

`transactionViewToRequest(view)` verifica também a consistência entre type,
amount, signedAmount e signedCents. Uma edição deve reconstruir o modelo coerente
ou usar a preparação de formulário com magnitude explícita. Inconsistência é erro
`ERR_TRANSACTION_ADAPTER`, nunca correção por abs ou troca automática de tipo.

Os requests não contêm BigInt e são compatíveis com create/updateTransaction já
existentes, cujo serializer produz o número JSON exato esperado pelo backend.
Modelos de apresentação e resumos com centavos BigInt são exclusivamente de
memória: JSON.stringify lança TypeError. Não há toJSON global nem replacer que
converta centavos em Number. Para uma futura fronteira JSON, selecionar campos
decimais explicitamente; para reconstrução, refazer o adapter a partir do DTO.

## Agregação: exact-aggregates.js

As funções recebem arrays de modelos de apresentação validados e não os modificam.
Não misturar DTO bruto, mocks legados com Number ou registros inconsistentes.

- `summarizeExact`: income e expenses são magnitudes positivas ou zero; balance
  é assinado. Também retorna incomeCents/expensesCents/balanceCents BigInt e
  transactionCount. Array vazio produz zero; entrada inválida lança erro.
- `groupByCategoryId`: array por UUID, em ordem de primeira ocorrência. Não
  agrupa nomes iguais nem resolve nomes conflitantes: o rótulo vem do catálogo
  backend por UUID. Cada transação conserva seu nome recebido.
- `groupByMonth`: array cronológico por YYYY-MM, sem criar meses artificiais.
- `summarizePeriod`: intervalo inclusivo `{ from, to }` de datas válidas
  YYYY-MM-DD. Não modifica fuso nem transforma limites de data em dinheiro.
- `comparePeriods`: current, previous e difference; diferenças são sempre
  current menos previous, inclusive despesas e saldos negativos. Períodos são
  independentes e podem se sobrepor; isso não cria lançamentos novos.

Cada grupo contém os mesmos totais exatos do resumo. Valores monetários em texto
sempre têm duas casas; os totais podem ultrapassar o máximo de uma transação.
As funções agregam os registros recebidos; não buscam páginas, não deduplicam
IDs nem certificam completude de um histórico. Isso será responsabilidade da
carga autenticada futura. Nenhum nome como Renda decide o tipo financeiro.

## Uso futuro no FinanceContext e limites

Na 3.2.2, carregar todas as páginas necessárias, adaptar DTOs e só então usar
os novos agregadores. Migrar os consumidores e formatadores explicitamente:
formatMoney legado aplica abs e não deve formatar saldos assinados. Não conectar
os modelos BigInt diretamente aos cálculos legados baseados em Number.

Gráficos podem necessitar de coordenadas numéricas, mas essa projeção não é a
fonte dos totais. Definir escala/limites e guardar valores exatos separados para
tooltips, exportações, saldos e requests. Este módulo não faz conversões numéricas
para gráficos, percentuais, médias, divisão ou arredondamento de planejamento.

Isolamento por geração de sessão, loading/erro/vazio, cache por usuário e descarte
de respostas atrasadas permanecem pendentes para a próxima etapa. Os problemas
legados descritos no diagnóstico 3.1 ainda não foram corrigidos nos consumidores.
Metas, inclusive futuros aportes e retiradas, ficam fora deste escopo; não
reutilizar transações compensatórias nem inferir suporte do backend a retiradas.
