# Integração HTTP — etapa 1

Contratos conferidos no repositório irmão `junta-ai-backend`: controllers,
DTOs de transaction/category, enums, SecurityConfig e GlobalExceptionHandler.

- Configurar `VITE_API_URL` com a base do backend. Não existe fallback HTTP para mocks.
- `api` envia o token atual do sessionStorage quando `requiresAuth: true`.
  Os novos serviços usam essa opção; OTP e formulários públicos não usam.
- Sessão ausente/expirada rejeita antes do envio (`SESSION_EXPIRED`). HTTP 401
  invalida somente a sessão cujo token foi enviado e atualiza UserContext.
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
