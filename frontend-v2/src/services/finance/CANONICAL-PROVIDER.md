# Provider candidato — Etapa 3.2.4-B

`contexts/CanonicalFinanceProvider.jsx` e `useCanonicalFinance()` estão preparados
para uso isolado sob UserProvider. AppProviders continua montando FinanceProvider
legado: nenhuma tela foi migrada. A ordem global agora é GoogleOAuth opcional →
ThemeProvider → UserProvider → FinanceProvider legado. O hook useFinanceData e seu
contrato antigo permanecem preservados até a ativação coordenada de C/D/E.

## Ownership e React

Cada setup de efeito cria uma instância de financial-commands, que possui exatamente
um loader. A ponte finance-provider-store só aloca variáveis e funções na construção;
não cria comandos, inscrições ou timers durante render. Cleanup desvincula o lease
ativo antes de abort/dispose e remove suas inscrições. Um novo setup (incluindo o
replay de StrictMode) cria recursos novos; não reutiliza instância descartada.
Leituras de montagem descartadas são abortadas antes do adapter Axios. Nenhuma
mutação é disparada por montagem. Testes cobrem uma única sequência HTTP efetiva
em StrictMode, render suspenso descartado, unmount pendente e remount.

FinanceOwnerContext rejeita aninhamento de providers financeiros. Uma lease por
UserProvider rejeita também siblings concorrentes, inclusive dois candidatos. A
chave é o callback endSession estável daquele UserProvider, apenas para ownership
React, nunca para identificar usuário ou sessão. O WeakMap não guarda finanças nem
tokens; cada cleanup libera somente sua própria lease. Raízes independentes com
UserProviders distintos são escopos distintos. Não montar ambos como fontes da
mesma aplicação. Não alterar AppProviders para ativar o candidato nesta etapa.

useSyncExternalStore observa a ponte com funções subscribe/getSnapshot estáveis.
Snapshots são memoizados por referências da camada de comandos, período e estado
autenticado; não usa getSessionSnapshot diretamente como getter instável do hook.
Não há cópia mutável das coleções, nem segunda fonte de autenticação.

## Contrato público

O hook retorna um objeto congelado com:

- sessionStatus: authenticated ou unauthenticated (sem tokens/geração pública).
- status: idle/loading/success/empty/error/stale/cancelled, vindo da leitura.
- period: `{ from, to }` imutável e explícito.
- coverage: cobertura comprovada do período ou null.
- transactions: modelos assinados imutáveis; amount é magnitude decimal positiva,
  signedAmount é texto assinado e signedCents é BigInt somente em memória.
- categories: DTOs imutáveis identificados por UUID, com nome literal e tipo real.
- summary: resumo exato do loader, somente com cobertura completa do período
  selecionado; null enquanto não houver essa comprovação.
- error, pending, lastResult e refreshRequired, sem reconverter erro em vazio.
- getSnapshot(), load(period), reload() e os seis comandos CRUD assíncronos da
  camada existente, com assinaturas create(body), update(id, body), delete(id).

Arrays vazios são referências congeladas de ausência de dados; o status diferencia
idle/erro de empty confirmado. Não há resumo zero fictício durante loading/erro.
As ações e o getter permanecem estáveis entre renders. As Promises são guardadas
também na ponte após await, pois a sessão pode mudar entre continuações. Uma leitura
antiga retorna stale sem dados, ou cancelled se seu owner foi desmontado. CRUD
obsoleto não devolve confirmed para outra geração. Não há retry adicional.

## Sessão e períodos

Login e cada nova geração (mesmo token idêntico) iniciam leitura do período
selecionado. Logout/expiração descartam dados na camada existente; getSnapshot
consulta essa camada ao ser lido, antes de efeitos de limpeza do React. A ponte não
depende somente de isAuthenticated ou do perfil local. Alteração direta de storage
sem evento também não permite ler dados antigos; reload pode ser solicitado para
reconciliar esse caso. Não há polling nem chamada HTTP durante render.

O padrão é o mês civil UTC atual, do primeiro ao último dia. initialPeriod é lido
uma vez por montagem lógica; alterações posteriores passam por load({from,to}).
Transporte usa datas YYYY-MM-DD sem conversão de fuso. Períodos inválidos rejeitam
antes do HTTP e preservam a seleção anterior. null não significa histórico completo.
Uma validação rejeitada também preserva a intenção válida pendente. Se um callback
durante a validação iniciar outra carga, essa chamada mais recente prevalece; a
tentativa rejeitada não restaura uma intenção anterior sobre ela.
Um único intervalo pode abranger período atual e anterior para relatórios futuros;
coverage.complete continua se referindo ao intervalo, sem snapshot atômico do banco.
Seleção nova nunca apresenta a coleção do período anterior como atual.

Uma escrita confirmed pode ter refresh falho; a confirmação continua válida e
refreshRequired indica reconciliação pendente. Resultado indeterminate não é
repetido automaticamente. Um último snapshot confirmado pode permanecer disponível
com refreshRequired=true; consumidores devem sinalizar que pode estar desatualizado.
Não serializar o contexto com BigInt. Não persistir dados financeiros em storage.
Snapshots já entregues não podem ser revogados: consumidores futuros não devem
guardar cópias em estados paralelos nem deixar rascunhos de outra conta ativos.

## Logout e cutover

AuthHeader agora chama endSession antes da navegação para `/`, nos caminhos desktop
e mobile. O candidato limpa imediatamente suas coleções e bloqueia respostas
antigas. A correção não apaga nem importa os registros locais legados: as telas
atuais continuam usando esse modelo até sua migração, e não se declara a área
financeira global já integrada ou isolada por backend.

Ativação global exige C/D/E consumindo este contrato: DTOs por UUID, decimal exato,
submissões com await/estado pendente, cobertura explícita, tratamento de indeterminate
e refreshRequired, chat sem persistência simulada e nenhuma leitura financeira do
store legado. Só então trocar o provider em AppProviders, retirar a fonte legada
da árvore e migrar o hook/consumidores de forma coordenada. Nunca montar providers
lado a lado para mesclar resultados. Metas, cores e simulações não foram adicionadas
a este contexto; metas continuam como dependência da etapa própria, sem retirar
as funcionalidades previstas do produto. A ausência desses membros é deliberada,
não deve ser preenchida com seeds para satisfazer consumidores antigos.

Continuam válidos os limites de paginação, ausência de idempotência para CRUD e
limitações de storage descritos nos documentos das etapas anteriores. Testes do
legado não foram convertidos em mocks permissivos para ativar este provider.
