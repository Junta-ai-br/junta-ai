# Vercel Web Analytics

Implementação local na branch `feat/frontend-vercel-analytics`, baseada na main
`33cfc2ec87f83f3e1bb816cb16640065ffda30be`. Somente frontend-v2.

## Integração e privacidade

Dependência npm `@vercel/analytics` 2.0.1, compatível com React 19. O componente
Analytics é montado uma vez em `src/App.jsx`, fora de AppRoutes e dentro do
BrowserRouter já existente, somente quando `isAnalyticsEnabled()` permite a coleta. O SDK acompanha History API/popstate automaticamente;
não há chamadas manuais de pageview, eventos personalizados, identify ou group.

`src/utils/analytics.js` permite apenas pageviews dos 18 caminhos estáticos atuais,
na mesma origem, sem credenciais na URL. Remove query strings e fragmentos e retorna
apenas type/url. Não lê conversas, formulários, estado financeiro, sessão ou perfil.
Caminhos desconhecidos/dinâmicos são descartados; novas rotas precisam de revisão
explícita da lista. Uma única barra final é aceita nas mesmas rotas, por exemplo
/sobre/ é reportado como /sobre. A raiz continua /; barras repetidas, subcaminhos
e IDs não passam a ser permitidos. A mesma equivalência vale para referrers internos
sem parâmetros. Nenhum redirecionamento ou alteração de rota foi introduzido. A URL do navegador e o React Router não são modificados. O filtro limita o conteúdo
dos eventos; não reescreve cabeçalhos Referer ou o restante do tráfego HTTP. Segredos
não devem ser colocados em URLs, mesmo com o filtro ativo.

O SDK pode incluir a URL de referência inicial separadamente. Por isso, eventos
são descartados se document.referrer contém parâmetros, fragmentos, credenciais,
caminho externo completo ou caminho interno não permitido. Essa decisão conservadora
pode subcontar visitas; document.referrer persiste durante uma sessão SPA, então
as navegações subsequentes dessa sessão também podem ser descartadas. Logs de debug
do SDK foram desativados para não imprimir eventos/URLs brutos no desenvolvimento.

As rotas atuais não têm IDs dinâmicos nem inserem dados financeiros/tokens em
parâmetros de navegação. Essa integração não autoriza passar dados sensíveis por
URL no futuro. O filtro não substitui a revisão de privacidade do serviço externo;
Vercel processa metadados técnicos próprios de Web Analytics.

## Compatibilidade e limites

React 19, React Router 7 e Vite 8 existentes. Nenhuma alteração em vercel.json,
headers, CSP Report-Only, autenticação, workflows ou infraestrutura. O script e a
coleta de produção usam endpoints da mesma origem sob /_vercel/insights, compatíveis
com as diretivas self existentes.

`isAnalyticsEnabled()` exige simultaneamente `import.meta.env.PROD` e origem exata
`https://junta-ai.com`. Esse controle atua antes da montagem do Analytics e também
no início do beforeSend: previews em outros domínios, localhost, IPs locais e outros
hostnames não injetam o script nem inicializam a fila pela integração. Builds de
desenvolvimento também ficam excluídos, mesmo simulando o domínio de produção.
HTTP, portas não padrão e www.junta-ai.com não estão habilitados. Se www redirecionar
para junta-ai.com, a coleta só começa na origem final permitida.

PROD identifica build de produção, não o tipo de deployment da Vercel; a restrição
de origem é o que exclui as URLs de preview. Não há consulta remota de deployment.
Nenhuma chave ou variável VITE adicional é necessária para hospedagem Vercel.

Não foi ativado Analytics no painel, executado deploy ou comprovada coleta real.
Bloqueadores, filtros de privacidade, rede ou Analytics desativado podem impedir
coleta sem impedir o funcionamento da aplicação. Previews e outros hostnames estão
excluídos pela origem, mesmo quando gerados com vite build. Não há eventos de negócio.

## Validação após publicação autorizada

1. No projeto Vercel já associado a junta-ai.com, abrir Analytics e verificar se
   Web Analytics está habilitado. Se não estiver, a responsável deve habilitá-lo.
2. Após revisão e publicação pelo fluxo existente, confirmar que o deployment usa
   frontend-v2, npm run build e saída dist. Não foi feita alteração dessas opções.
3. Abrir https://junta-ai.com em sessão de teste sem bloqueador. Em Network, verificar
   que o script /_vercel/insights/script.js retorna JavaScript, não index.html, e que
   as requisições de coleta são aceitas. Caso contrário, conferir habilitação e
   deployment do projeto antes de alterar rewrites ou políticas de segurança.
4. Confirmar em um preview Vercel e em localhost que a integração não injeta script
   Analytics nem envia eventos, mantendo a navegação normal. A comparação positiva
   deve ocorrer em https://junta-ai.com, após publicação autorizada.
5. Navegar por links internos entre /, /sobre e /planos; usar voltar/avançar e
   recarregar uma rota diretamente. Confirmar navegação normal, um script e um
   pageview por mudança de pathname, sem duplicação causada por integração manual.
6. Usar SOMENTE valores sintéticos, por exemplo /sobre?token=synthetic#synthetic.
   Inspecionar os payloads: a URL reportada deve terminar em /sobre sem parâmetros
   ou fragmento. Conferir também referrer e demais metadados; não inserir dados reais
   de teste, financeiros ou credenciais na URL. Caminhos desconhecidos são descartados. /sobre/ deve ser agregado como /sobre,
   sem adicionar parâmetros ou fragmentos à URL reportada.
7. Conferir no painel os primeiros visitantes/pageviews e os caminhos estáticos,
   filtrando exclusivamente junta-ai.com. www não coleta antes de eventual redirecionamento. Aguardar o processamento;
   se não aparecerem, comparar Network, bloqueador, domínio e filtros de privacidade.

Referências oficiais:
- https://vercel.com/docs/analytics/quickstart
- https://vercel.com/docs/analytics/package
- https://vercel.com/docs/analytics/redacting-sensitive-data

## Verificações locais

`npm run lint`, `npm run test:run`, `npm run build`.

Testes específicos cobrem URLs sensíveis, referrers, descarte de propriedades,
eventos personalizados e montagem única do SDK real durante navegação simulada.
Os testes de rotas existentes exercitam páginas e proteção; não houve execução
remota do script de produção ou medição de visitantes reais.

Resultados da integração antes da restrição final de domínio (histórico):
- Antes: lint aprovado, 1.174 testes aprovados e build aprovado.
- Depois: lint aprovado, 1.212 testes aprovados, zero falhas/ignorados, build aprovado.
- 38 casos novos de privacidade; o teste vazio de App foi substituído por uma
  verificação da montagem real do SDK e permanência durante navegação simulada.
- Testes iniciais direcionados de filtro/App/rotas: 67 aprovados; os nove casos de
  referrer acrescentados depois estão incluídos na suíte completa final.
- Versões instaladas: React/ReactDOM 19.2.8, Router 7.18.2, Vite 8.3.7,
  Analytics 2.0.1. Somente uma nova dependência foi instalada no lockfile.
- Verificação real da coleta e dos payloads no domínio depende de publicação e
  habilitação no projeto Vercel; não foi realizada nem declarada como aprovada.

## Ajuste final de domínio de produção

O controle é aplicado antes da injeção do SDK, além da defesa no beforeSend. Não
basta forçar mode=production no SDK: isso também enviaria eventos em previews.
Nenhuma regra anterior de dados, credenciais, parâmetros, fragmentos ou referrers
foi removida. Só foi acrescentada a origem exata e a normalização da barra final
para os caminhos conhecidos. Dependência e configurações existentes permanecem.

Testes adicionais verificam builds dev, origem preview, localhost, IP local,
www, domínio com sufixo malicioso, HTTP, porta alternativa, ausência de script/fila,
navegação funcional sem Analytics e variantes com barra final sem ampliar a lista.
Resultados finais deste ajuste:
- Lint aprovado e build de produção aprovado.
- 109 testes direcionados aprovados (filtro, App e rotas).
- Suíte completa: 1.245 testes aprovados, zero falhas/ignorados, contra 1.212 antes
  deste ajuste. Os 33 casos adicionais cobrem origem, ambiente e barra final.
- Dependência e lockfile não foram alterados neste ajuste; configurações Vercel,
  Router e autenticação permanecem intactas.
- Coleta real em junta-ai.com e ausência de coleta nos deployments publicados ainda
  dependem de validação após publicação autorizada. Não foi realizado deploy.
