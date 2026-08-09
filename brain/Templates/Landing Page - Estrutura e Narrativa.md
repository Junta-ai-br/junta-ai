---
title: Landing Page — Estrutura e Narrativa
owner: Dani Dutra
status: Accepted
created: 2026-08-09
updated:
domains: []
tags:
  - Landing-page
  - navigation
  - product
  - UX
---
## Contexto

A Landing Page precisa comunicar o valor do Junta.ai antes de apresentar suas funcionalidades, evitando posicioná-lo como uma ferramenta tradicional de controle financeiro ou como um produto de educação financeira.

A narrativa deve mostrar que o problema não está necessariamente em "ser ruim com dinheiro", mas em não conseguir compreender com clareza o que acontece com ele e o que isso significa para a própria vida.

## Decisão

A Landing Page seguirá uma narrativa progressiva:

**Problem → Solution → Features → FAQ → CTA → Footer**

O eixo conceitual da comunicação será:

**clareza → conversa → tranquilidade**

A Landing deve apresentar o Junta.ai como um assistente financeiro conversacional que transforma aquilo que o usuário conta sobre sua vida financeira em contexto, compreensão e orientação.

## Decisões principais

### Problem

A seção Problem parte da ideia:

> A gente aprende a ganhar dinheiro.  
> Mas nem sempre entende e sabe o que faz com ele.

A mensagem central da seção será:

> **Você precisa de mais clareza.**

A comunicação deve enfatizar que números, gráficos e aplicativos mostram informações, mas nem sempre ajudam o usuário a compreender o que elas significam em sua vida.

### Solution

A seção Solution será apresentada através do conceito:

> **Clareza por conversa.**

O ciclo do Junta.ai será representado por quatro momentos:

1. **Conte do seu jeito**  
    Fale sobre seus gastos, planos ou dúvidas como falaria com alguém. O Junta.ai entende a conversa e organiza o que importa.
2. **Entenda o que está por trás**  
    Seus números ganham contexto. O Junta.ai ajuda você a perceber padrões, relações e comportamentos que podem passar despercebidos.
3. **Decida com mais clareza**  
    Com uma visão mais clara da sua situação, você consegue tomar decisões mais conscientes — de acordo com o que realmente importa para você.
4. **Evolua com orientação**  
    A partir do que aprende sobre seus movimentos e objetivos, o Junta.ai pode sugerir caminhos e pequenas mudanças que façam sentido para o seu momento.

### Features

A seção Features utilizará uma composição em **Bento Grid**, com cards que funcionam visualmente como widgets.

Cada funcionalidade será apresentada por meio de:

- ícone Lucide;
- nome da funcionalidade;
- frase curta que define seu valor;
- mini-widget visual que antecipa a experiência do produto.

As funcionalidades representadas serão:

- **Conversa** — Fale sobre seu dinheiro do seu jeito.
- **Metas** — Defina onde você quer chegar.
- **Categorização** — Entenda para onde seu dinheiro vai.
- **Dashboard** — Veja o que seus números estão dizendo.
- **Relatórios** — Receba um resumo do que importa.
- **Saúde financeira** — Acompanhe sua evolução.
- **Privacidade** — Seus dados continuam sendo seus. Você escolhe o que compartilhar.

A seção deve utilizar o **roxo da marca nos ícones e palavras-chave**, mantendo o restante da composição visual equilibrado.

### Mini-widgets

Os mini-widgets não devem ser apenas elementos decorativos. Eles devem funcionar como uma prévia visual de conceitos que poderão existir no produto.

Diretrizes definidas:

- **Conversa:** mini interface de conversa.
- **Metas:** progresso de uma meta financeira.
- **Categorização:** gráfico de rosca/pizza acompanhado de porcentagens.
- **Dashboard:** gráfico resumido de evolução dos gastos.
- **Relatórios:** resumo periódico com insight.
- **Saúde financeira:** indicador baseado em uma barra horizontal.
- **Privacidade:** área que poderá crescer conforme a definição da arquitetura de segurança evoluir.

O indicador de **Saúde Financeira não utilizará donut**, pois no produto o score deverá ser representado por uma barra horizontal que pode aumentar ou diminuir conforme os lançamentos e mudar de estado visual de acordo com a situação financeira.

### Privacidade

A privacidade será tratada como uma funcionalidade própria da Landing, mesmo que a especificação completa de segurança ainda esteja em evolução.

A comunicação deve transmitir confiança sem antecipar promessas técnicas que ainda não foram formalmente definidas.

A referência atual é o documento:

`docs/security/sec-01-overview.md`

A área de privacidade poderá ser expandida conforme a arquitetura de segurança do Junta.ai for definida.

## Direção visual

A estrutura visual deve priorizar:

- composição limpa;
- hierarquia tipográfica forte;
- uso pontual do roxo como destaque;
- ícones como elementos de identificação, não como protagonistas;
- cards suficientemente altos para comportar mini-widgets;
- diferenciação visual entre Features e FAQ;
- Bento Grid para Features;
- FAQ com estrutura própria de perguntas e respostas;
- microinterações e animações adicionadas somente após o fechamento da estrutura estática.

## Consequências

### Positivas

- Mantém coerência entre a narrativa da Landing e a proposta do produto.
- Evita posicionar o Junta.ai como uma ferramenta tradicional de controle financeiro.
- Evita prometer que o produto será um "educador financeiro".
- Reforça o diferencial de conversa e contexto.
- Permite que os elementos visuais da Landing antecipem componentes reais do produto.
- Facilita a evolução progressiva da interface conforme as funcionalidades forem implementadas.

### Trade-offs

- A Landing exige maior cuidado de direção visual do que uma página puramente informativa.
- Os mini-widgets precisam ser projetados com responsabilidade para não criar expectativas sobre funcionalidades ainda não implementadas.
- A seção de privacidade deverá evoluir junto com a definição da arquitetura de segurança.

## Relação com outras áreas

Esta decisão registra **o porquê e a direção da Landing Page**.

Detalhes específicos de implementação, componentes e tokens devem permanecer no **Design System**.

Especificações de funcionalidades devem permanecer em **Knowledge/Features**.

Decisões técnicas ou arquiteturais relevantes devem ser registradas em **Knowledge/Architecture** ou nos documentos técnicos correspondentes.

Pesquisas e referências utilizadas para fundamentar decisões devem permanecer em **Knowledge/Research**.

## Relações

### Fundamentação
- [[Vision]]
- [[Strategy]]
- [[Design System]]

### Funcionalidades relacionadas
- [[Features]]

### Segurança
- [[sec-01-overview]]