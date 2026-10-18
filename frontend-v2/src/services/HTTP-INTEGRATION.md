# Integração HTTP — etapas 1 e 2

Contratos conferidos no repositório irmão `junta-ai-backend`: controllers,
DTOs de transaction/category, enums, SecurityConfig e GlobalExceptionHandler.

- Configurar `VITE_API_URL` com a base do backend. Não existe fallback HTTP para mocks.
- `api` envia o token atual do sessionStorage quando `requiresAuth: true`.
  Os novos serviços usam essa opção; OTP e formulários públicos não usam.
- Sessão ausente/expirada rejeita antes do envio (`SESSION_EXPIRED`). HTTP 401
  invalida somente a geração local da sessão que originou a requisição e atualiza UserContext.
  HTTP 403 preserva a sessão. Falhas HTTP/rede são propagadas sem retry.
- Não foi introduzido refresh automático: o frontend existente encerra sessões
  expiradas, embora o backend exponha `/auth/refresh` e `/auth/logout`.
  O logout local existente foi preservado. Nenhuma renovação é iniciada aqui.

## Transações

`transactions.api.js`: `listTransactions`, `createTransaction`,
`updateTransaction`, `deleteTransaction`.

POST/PUT enviam somente `categoryId`, `type`, `description`, `amount`,
`transactionDate`. Tipos: `INCOME`, `EXPENSE`. Datas são strings de calendário
`YYYY-MM-DD`, sem conversão de fuso. O backend valida categoria, valor mínimo
0.01, descrição até 500 caracteres e data não futura.

`listTransactions({ from, to, page = 0, size = 20, sort })` exige os dois limites
explicitamente; não depende do mês padrão do controller. Retorna Spring Page
integral (`content`, `number`, `size`, `totalElements`, `totalPages`, `last` e
demais metadados). Para um histórico completo, o consumidor deve fornecer o
período completo desejado e percorrer todas as páginas, até `last`. Uma página
não representa o histórico inteiro. `sort` aceita a sintaxe Spring, por exemplo
`transactionDate,desc`. Não há GET por ID no controller.

## Categorias

`categories.api.js`: `listCategories`, `createCategory`, `updateCategory`,
`deleteCategory`. POST/PUT enviam somente `name`, `type`. Tipos: `INCOME`,
`EXPENSE`, `BOTH`. O backend valida nome obrigatório com 2–120 caracteres.
GET retorna lista, não Page. Não há GET por ID.

Nos dois recursos, POST/PUT exigem resposta 200 com objeto identificado;
DELETE exige 204. Listagens validam o formato antes de retornar dados.
Erros de formato rejeitam com `ERR_API_RESPONSE`, sem confirmar a operação.
As regras financeiras e de propriedade permanecem no backend.

## Erros e próxima etapa

Erros Axios preservam `response.status` e o corpo real: `timestamp`, `status`,
`erro`, `mensagem`, além de `campos` em erros de validação. Erros do filtro de
segurança podem vir sem esse corpo; falhas de rede podem não ter `response`.
Uma falha de rede durante escrita não garante que o backend deixou de gravar:
o consumidor deve reconciliar dados antes de reenviar.

FinanceContext, páginas e chat ainda usam os fluxos existentes. A etapa seguinte
deve integrar esses consumidores e apresentar estados de erro/carregamento.
Ainda é necessária validação integrada com backend em execução, configuração
de URL/CORS e uma conta real. Nenhuma dependência foi adicionada.

## DTOs financeiros e validação (etapa 2)

Conferência local: TransactionRequest/Response, CategoryRequest/Response,
controllers, serviços, entidades e migrations. Spring Boot 3.3.4, Jackson 2.17.2;
nenhum serializer/coercion customizado de BigDecimal foi encontrado no código
ou configuração. Um teste com ObjectMapper dos jars locais confirmou que
BigDecimal é serializado como número JSON e aceita número JSON na entrada.
O mesmo mapper aceita string decimal na entrada, mas o cliente continua enviando
número: essa tolerância não foi transformada em novo contrato do backend.
Não houve chamada HTTP contra backend em execução nesta etapa.

TransactionResponse exige todos os campos:

| Campo | Contrato |
| --- | --- |
| id, categoryId | UUID textual canônico com 8-4-4-4-12 dígitos hexadecimais |
| categoryName | string |
| type | INCOME ou EXPENSE |
| description | string ou null; a propriedade deve existir |
| amount | número JSON positivo no transporte; string decimal canônica no serviço |
| transactionDate | data de calendário válida YYYY-MM-DD |
| createdAt | Instant UTC, sufixo Z, fração opcional de até 9 dígitos |

CategoryResponse exige id UUID, name string não vazia, type INCOME/EXPENSE/BOTH
e createdAt no mesmo formato Instant. Esses campos derivam dos DTOs, do mapeamento
dos serviços e das colunas não nulas. Description é nullable na entidade.
Na validação de name, entrada e saída usam a semântica efetiva de @NotBlank e
@Size do Hibernate Validator 8.0.1.Final: comprimento original de 2 a 120 unidades
UTF-16 e pelo menos uma unidade maior que U+0020 (Java String.trim()). NBSP e
EM SPACE não são tratados como espaço comum por esse validador; nomes contendo
apenas esses caracteres são aceitos se respeitarem o comprimento. Os nomes são
enviados e retornados literalmente, sem trim ou normalização Unicode. Mudanças
na versão/semântica do validador Java exigirão nova conferência desse predicado.
POST e PUT validam o DTO individual; GET categories valida cada elemento;
GET transactions valida cada item de content. Campos adicionais são preservados.

Spring Page preserva os metadados originais e exige content, number, size,
totalElements, totalPages, numberOfElements, first, last e empty, com tipos,
contagens e indicadores consistentes. Página vazia é válida, inclusive página
solicitada além do fim: totalPages pode ser zero. Não inventamos pageable/sort
obrigatórios adicionais, nem convertemos a resposta para um array.
DELETE aceita apenas 204 com corpo ausente, null ou string vazia.

Na entrada, apenas campos do DTO são enviados. UUIDs, enums, formatos de data,
nome da categoria e tipo/tamanho de description são verificados antes do HTTP.
Description omitida é enviada como null, permitido pelo DTO real. Validação de
data futura, propriedade de categoria e demais regras de negócio ficam no backend.
Não há cálculo de saldo, soma ou regra financeira nova nesses serviços.

## Precisão monetária

- Banco: NUMERIC(19,2), até 17 dígitos inteiros e 2 decimais. Transações devem
  ser positivas, no mínimo 0.01; EXPENSE também usa amount positivo no backend.
- DTO Java: BigDecimal. TransactionRequest não possui @Digits: enviar mais
  casas pode alcançar arredondamento do banco. O cliente rejeita centavos
  fracionários, sem arredondar; zeros decimais excedentes podem ser removidos.
- Representação dos serviços: string decimal positiva, sempre duas casas,
  ponto decimal, sem sinal, separador de milhares ou expoente. Exemplo: "12.30".
  "00012.3000" normaliza para "12.30". Zero, negativos, NaN, Infinity,
  vírgula, espaço e excesso de precisão são rejeitados.
- Strings suportam toda a faixa, de "0.01" até "99999999999999999.99".
  Expoentes decimais limitados são expandidos por manipulação de texto, para
  compatibilidade com notação científica que BigDecimal pode emitir.
- Entrada Number é aceita apenas até 9999999999.99, uma faixa conservadora
  muito abaixo da perda de distinção entre centavos em binary64. Mesmo nessa
  faixa, mais de duas casas significativas são rejeitadas (ex.: 0.1 + 0.2).
  Valores maiores exigem string. Isso não recupera precisão que o chamador já
  perdeu antes de chamar o serviço; formulários futuros devem fornecer texto.
- No POST/PUT, um transformRequest restrito a transações emite o decimal
  validado diretamente como literal numérico JSON. Não há conversão do valor
  arbitrário para Number, parseFloat ou toFixed. O tipo JSON do backend permanece
  número; a string interna não é enviada entre aspas.
- No sucesso de transações, um transformResponse restrito lê os tokens amount
  do JSON original e os normaliza antes de expor o objeto ao consumidor. Strings
  JSON completas são reconhecidas para não confundir description com campos.
  JSON.parse verifica a sintaxe e monta o objeto; seu primeiro resultado numérico
  é descartado. Os valores monetários vêm exclusivamente do texto original.
  O parser padrão global do Axios e autenticação não foram alterados.
- O backend atualmente envia número JSON. Só JSON.parse/Axios padrão não
  preserva a faixa completa: 99999999999999999.99 vira 100000000000000000.
  A transformação local contorna esse limite para transações. Proposta mínima
  para um contrato futuro: acordar amount como string decimal canônica na resposta
  do backend, com testes compartilhados; não foi implementada unilateralmente.
- Um adapter customizado que entregue objeto já parseado para transações é
  rejeitado: não é possível comprovar os centavos depois do parsing numérico.

## Erros identificáveis e consumidores futuros

FinancialContractError expõe code ERR_API_RESPONSE para DTO/JSON incompatível,
ERR_API_REQUEST para entrada incompatível e ERR_MONEY_PRECISION para decimais
inválidos ou fora da faixa. Erro é rejeição, nunca lista vazia, zero ou mock.
Status/corpo de falhas HTTP passam pelo fluxo Axios existente; a transformação
monetária só opera em status 200. Falhas após escrita não provam que não houve
persistência; reconciliar antes de reenviar.

FinanceContext, finance/store e formatters atuais continuam intocados. Eles usam
Number, valores negativos para despesas, date/category/desc e agregações locais:
não podem receber estes DTOs diretamente. A próxima etapa precisa de adaptação
explícita de campos, sinais e representação monetária, sem converter valores
arbitrários para Number nem duplicar regras de negócio. Alterar o parser para
preservar centavos não torna somas futuras em Number precisas.

Limite de sessão já conhecido: se removeItem falha, clearSession tenta apagar
credenciais sobrescrevendo a chave com null. Isso impede restauração após recarga
quando a escrita funciona. Se remoção e escrita falham, a invalidação só existe
em memória; recuperar o storage após recarga pode restaurar os tokens antigos.
Leitura indisponível retorna estado não autenticado. Nenhum ajuste de autenticação
foi realizado na etapa 2; garantia durável nesse cenário exige solução acordada
fora desse storage ou alteração da política de persistência/revogação.
