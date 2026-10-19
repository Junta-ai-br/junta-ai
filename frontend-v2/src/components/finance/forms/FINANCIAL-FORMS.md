# Formulários canônicos isolados — 3.2.4-C1

Nenhuma rota ou tela importa estes componentes. O provider canônico continua fora
de AppProviders. Montar somente sob UserProvider → CanonicalFinanceProvider, sem o
FinanceProvider legado no mesmo owner. A instância de comandos pertence ao provider;
os formulários não criam comandos, clientes HTTP ou persistência financeira.

## Inventário anterior

VisaoMes contém os seis fluxos: criar/editar transação em modal; excluir transação
diretamente; criar/editar categoria em modal com cor; excluir categoria diretamente.
Dashboard reutiliza VisaoMes e acrescenta o chat legado. As gravações anteriores
são síncronas, em localStorage, sem estados HTTP ou feedback de falha. Usam nomes
como identidade de categoria, Number/Math.abs, IDs transaction-Date.now e substituem
coleções inteiras. Renomear categoria também altera transações localmente.

Esses fluxos e seus testes permanecem intactos. Não se extraiu o formulário legado
porque a extração compartilharia suas dependências financeiras incompatíveis.

## Componentes e contratos

Importar de `FinancialForms.jsx`:

| Componente | Propriedades | Comandos do provider |
| --- | --- | --- |
| TransactionForm | transactionId opcional, onCancel opcional | createTransaction(body), updateTransaction(id, body) |
| CategoryForm | categoryId opcional, onCancel opcional | createCategory(body), updateCategory(id, body) |
| DeleteFinancialRecordForm | kind: transaction ou category, id, onCancel opcional | deleteTransaction(id), deleteCategory(id) |

IDs são UUIDs, nunca nomes. Para editar/excluir, abrir somente após a leitura
confirmada que inclui o registro. Um registro indisponível não cria uma alternativa
local: fechar, atualizar a consulta e reabrir. Alterar o UUID remonta o editor.
O formulário nunca recebe nem modifica uma coleção de transações para gravar.

Transação envia apenas categoryId, type INCOME/EXPENSE, description, amount e
transactionDate. O campo de magnitude é texto: aceita ponto ou vírgula decimal,
sem milhares, expoente, sinal ou frações de centavo. A conversão apenas troca a
vírgula por ponto e usa prepareTransactionRequest/BigInt; não há Number/parseFloat,
Math.abs ou arredondamento. O limite é NUMERIC(19,2), positivo, até
99999999999999999.99. Datas são YYYY-MM-DD, sem conversão de fuso. A regra
@PastOrPresent é decidida pelo backend, cujo relógio/fuso é a autoridade.
Descrição é opcional, até 500 unidades UTF-16. null permanece null quando não
editado. Texto fora do intervalo alterado, inclusive espaços e escapes, permanece
literal; a semântica das quebras durante edição está detalhada abaixo.

Categoria envia somente name e type INCOME/EXPENSE/BOTH. Reutiliza isCategoryName,
compatível com @NotBlank/@Size do Hibernate Validator 8: 2–120 unidades UTF-16,
sem trim ou normalização Unicode. NBSP/EM SPACE são preservados. Não envia cores
ou ícones. As opções exibem UUID para distinguir nomes iguais; nenhuma heurística
de nome/sinal escolhe o tipo ou recategoriza registros.

Os componentes são formulários inline com título acessível, labels, Input/Button
existentes e textarea local que reutiliza os estilos de Input, sem alterar o
componente compartilhado. Há regiões status/alert e controles nativos de teclado. Não declaram um
modal incompleto. Ao integrá-los em dialog, C2 deve fornecer foco inicial, contenção,
Escape e retorno de foco ao acionador; não fechar um envio pendente silenciosamente.
Registro indisponível mantém a mensagem de estado e o botão Fechar quando onCancel
foi fornecido. Erros locais do nome são anunciados por role=alert e ligados ao
textarea por aria-describedby/aria-invalid. Erros gerais de transação continuam
em role=alert. Enter dentro do textarea insere uma quebra; Tab permite alcançar
Salvar, onde Enter submete, com a mesma trava contra repetição.

## Semântica textual e limites de preservação

Descrição e nome são textarea, porque os DTOs permitem conteúdo multilinha. Um
input de linha única descartava CR/LF antes de o React receber a edição. Trocar
somente a tag não bastaria: textarea também expõe CRLF e CR como LF em value.

O único rascunho editável conserva a string original em estado React, incluindo
LF, CRLF e CR isolado. Não há campo oculto, cache financeiro ou persistência
paralela. projectText deriva uma projeção visual LF e um mapa de fronteiras
UTF-16 para os offsets da string original; não altera a string que será enviada.
Não há trim, replace ou normalização Unicode no tratamento textual.

A cada onChange, applyTextEdit compara a projeção anterior com o novo value:

1. Encontra o maior prefixo igual.
2. Encontra o maior sufixo igual sem sobrepor o prefixo.
3. Conserva prefixo/sufixo diretamente do rascunho original usando o mapa.
4. Substitui somente o intervalo central pelo texto entregue pelo textarea.

Há uma regra de fronteira: se a edição unir CR isolado a LF adjacente, preservar
ambos literalmente criaria um CRLF e fundiria duas quebras visíveis em uma. Nesse
caso, o CR na fronteira passa a LF para manter duas quebras. Exemplo: inserir uma
linha após a quebra de `A\rB` envia `A\n\nB`. O mesmo vale para apagar `X` em
`A\rX\nB`. Essa fronteira pertence à edição, e não à região preservada.

Assim, editar o final de `A\r\nB\nC\rD` para acrescentar `!` envia
`A\r\nB\nC\rD!`; editar apenas valor/tipo também mantém todo o texto original.
Os testes usam caracteres de controle reais e inspecionam o JSON efetivo do Axios.
O limite de tamanho é validado na string original, não apenas na projeção menor:
CRLF conta como duas unidades UTF-16, conforme o backend.

Quebras inseridas ou substituídas no intervalo central usam LF, como fornecido
pelo textarea. Remover uma quebra remove aquela parte do intervalo. Colar CRLF
num campo novo produz LF: a forma original do clipboard já não está disponível
em value, e não se promete preservação desse dado de entrada anterior ao DOM.
O helper visível informa a distinção entre quebras retidas e novas/substituídas.

A política é determinística, mas não infere intenção por seleção/caret: textos
repetidos podem admitir mais de um alinhamento. Substituições amplas, composição,
autocorreção e undo/redo são tratados pelo mesmo intervalo prefixo/sufixo. Quebras
dentro dele são novas/substituídas e podem passar de CRLF/CR a LF. Uma projeção
inteiramente igual conserva o rascunho, sem interpretar o evento como pedido de
normalização. Não se promete preservação byte a byte de regiões substituídas,
histórico de undo, encoding no transporte ou distinção visual de LF versus CRLF.
Unicode fora da edição não é normalizado, e separadores fora do intervalo e das
fronteiras editadas são mantidos literalmente. Essas garantias valem também após
edições sequenciais.

## Sessão, submissão e feedback

Cada abertura fica vinculada à geração real da sessão. Uma mudança desmonta o
editor e apaga seus campos/feedback. Mesmo com tokens idênticos, deve-se reabrir
explicitamente na nova sessão. O resultado assíncrono verifica geração e montagem
antes de publicar qualquer feedback. Consumidores não devem guardar seleção,
rascunhos ou cópias financeiras de outra sessão fora destes componentes.

Uma trava ref síncrona impede clique/Enter duplicado antes do disabled visual;
fieldset e botões ficam desabilitados durante envio. A fila de writes e o refresh
completo continuam sendo os de financial-commands. Não há atualização otimista.

- confirmed: conclui o formulário, mantém feedback acessível e bloqueia outra
  gravação; Fechar chama onCancel, quando fornecido. Não dispara fechamento
  automático que possa apagar o aviso de refreshRequired.
- confirmed com refreshRequired ou refresh não sincronizado: explicita que a
  gravação está confirmada e a visualização precisa ser atualizada. Não repete o write.
- error: preserva campos editáveis; apresenta status HTTP, mensagem e campos reais
  recebidos da camada de comandos. O usuário pode corrigir e submeter explicitamente.
- indeterminate: não afirma sucesso/falha definitiva; bloqueia reenvio neste
  formulário e orienta consultar os dados antes de outra gravação. Não faz retry.
- stale/cancelled: não confirma nem garante rollback. Se a geração mudou ou o
  componente desmontou, nenhum feedback antigo é publicado. Cancelamento local
  não prova que a operação deixou de ser processada pelo servidor.

## Limites reais do backend e ativação

CategoryService.create rejeita nome já existente sem distinguir caixa. update não
faz a mesma pré-verificação; erros dependem também das constraints do banco. Os
formulários não deduplicam por nome e não substituem a regra do backend.
CategoryService.delete não implementa cascata. Violação de integridade pode cair
no handler genérico HTTP 500: preservamos 500 como indeterminate, sem inventar
409 ou excluir/recategorizar transações. A mensagem do backend é exibida literalmente
como texto React. A correção de status/semântica no backend é uma pendência separada.

Sem idempotência no backend, não é seguro repetir automaticamente escrita incerta.
Consulta posterior é necessária para reconciliação. O refresh e a paginação mantêm
os limites já documentados; uma categoria recém-criada não vira um seed local.

C2/D devem migrar as leituras para modelos exatos, categoria UUID, períodos e
cobertura; integrar abertura/fechamento acessível e avisos de reconciliação; remover
as gravações legadas no mesmo cutover. Não ligar estes formulários em Dashboard,
VisaoMes ou chat enquanto eles lerem a fonte legada. Não montar providers paralelos
para mesclar resultados. Metas, relatórios e IA não são implementados nesta etapa.

Os testes usam provider, comandos, loader e serviços HTTP reais, com respostas
Axios controladas, sem mock de persistência ou substituição do contexto por stubs.
