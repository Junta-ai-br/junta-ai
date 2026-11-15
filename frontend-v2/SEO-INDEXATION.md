# Política de indexação — etapa 1

Baseline: origin/main 6874d42ef5a8b87563826f6d5ddb0198208c03a2.

## Implementação

vercel.json acrescenta X-Robots-Tag: noindex somente para /feedback,
/login, /cadastro, /assistente, /dashboard, /visao-mes, /relatorios,
/planejador, /planejador/historico, /perfil e /perfil/excluir-conta.
O padrão tem correspondência completa, admite uma barra final e não depende
de query strings. Não é um bloqueio por prefixo. Caminhos canônicos são minúsculos.

/, /sobre, /planos, /atualizacoes, /contato, /privacidade e /termos não recebem
essa restrição. Não é necessário adicionar um header index: ausência de noindex
permite indexação, mas não a garante. Não há diretiva global em index.html.
Headers são avaliados no caminho solicitado antes do rewrite para /index.html.
A regra global de segurança e o rewrite existentes permanecem intactos.

## Limites da SPA

Acesso direto e refresh recebem a política HTTP do caminho solicitado. Navegação
React Router não solicita outro documento, portanto não pode trocar o header da
resposta que já foi carregada. Por exemplo, noindex de uma entrada em /login
continua no documento se o usuário navegar para /sobre sem recarregar. Um acesso
direto ou refresh de /sobre não recebe noindex desta configuração. Crawlers que
solicitam cada URL recebem a política correspondente àquela resposta.
Não prometemos reverter um header HTTP com uma meta tag JavaScript.

Optamos por não acrescentar metadados dinâmicos: o controle HTTP é independente
de JavaScript e não cria estado global no shell compartilhado. Uma política com
headers diferentes a cada transição sem requisição exigiria navegação completa
ou mudança arquitetural; isso está fora desta etapa. Rotas não declaradas,
variantes não canônicas e a correção de soft 404 permanecem fora do escopo.

noindex não autentica usuários nem protege dados. ProtectedRoute, sessões,
providers, chamadas financeiras e backend não foram alterados. robots.txt,
sitemap, canonicals, Open Graph e pré-renderização não foram implementados.
Analytics e suas regras de privacidade não foram alterados.

## Validação

- Baseline direcionada: testes de App e proteção de rotas, 43 aprovados.
- src/test/indexation-policy.test.js verifica inventário, whitelist exata,
  caminhos com barra final/query, exclusões públicas e ausência de regra global.
  É teste da configuração, não emulador HTTP da Vercel.
- @vercel/routing-utils 6.6.1 foi instalado somente em diretório temporário para
  compilar a configuração via getTransformedRoutes, sem dependência no projeto.
- Os testes existentes de rotas exercitam autenticação, redirecionamento anônimo,
  acesso público e acesso autenticado. App.test.jsx exercita navegação SPA.
- Vite dev/preview não aplica headers de vercel.json; seu resultado não demonstra
  o comportamento da Vercel. A validação HTTP real deve usar o preview automático
  da PR e, depois do merge autorizado, o domínio produtivo.

Executar npm run lint, npm run test:run e npm run build.
Para testar GET, HEAD e requisições repetidas nos caminhos aprovados:

    node scripts/check-indexation.mjs https://DOMINIO-DO-DEPLOYMENT

O verificador usa somente requisições anônimas, sem seguir redirects, sem ler
conteúdo de usuários e sem imprimir corpos de resposta. Retorna erro se uma
rota não responder 200 ou não cumprir a política. Reexecutar após publicação
para validar a ausência de contaminação entre respostas cacheadas.

Previews podem receber noindex global da plataforma ou proteção de deployment.
Se isso ocorrer, não remover a proteção e não declarar as páginas públicas
validadas: registrar a limitação e validar a ausência de noindex no domínio de
produção após merge autorizado. Nenhum deploy manual faz parte desta tarefa.

Após publicação, confirmar no Search Console as URLs excluídas por noindex e a
indexabilidade das institucionais; ausência de noindex não assegura inclusão.
Rollback: reverter somente a regra de indexação e seus testes/documentação.

Referências:
- https://vercel.com/docs/project-configuration/vercel-json#headers
- https://github.com/vercel/vercel/blob/main/packages/routing-utils/src/superstatic.ts
- https://developers.google.com/search/docs/crawling-indexing/block-indexing

## Resultados locais

- Testes direcionados (politica, rotas, App e Analytics): 139 aprovados.
- Nova politica: 30 testes; compilador oficial: 63 verificacoes de caminhos.
- Lint e build aprovados; repeticao completa: 1.275 testes aprovados (73 arquivos).
- Primeira execucao ampla: 1.274 aprovados e 1 falha em VisaoMes.test.jsx,
  caso "logs in through OTP, creates, edits, deletes and isolates the next account",
  com "Unable to find role=link and name Dashboard". Reproduzida ao executar
  somente os 1.245 testes preexistentes (1.244 aprovados, mesma falha), com todo
  codigo de aplicacao e testes preexistentes identicos a origin/main; apenas
  vercel.json difere e nao e lido por esse teste. Isoladamente: 12/12 aprovados.
  Nenhum teste financeiro ou tempo limite foi alterado. Intermitencia registrada.
- npm ci reportou 7 vulnerabilidades nas dependencias existentes (6 moderadas,
  1 alta). Nenhuma dependencia ou lockfile foi alterado nesta entrega.