# Insights and Hypotheses

**Revisão documental:** 05/11/2026.

Este documento transforma resultados de pesquisa em hipóteses que podem orientar o desenvolvimento e ser posteriormente validadas com usuários.

Uma hipótese não é tratada como fato até que existam evidências suficientes para sustentá-la.

## Situação das hipóteses

As observações e hipóteses abaixo foram preservadas; as referências de origem são apresentadas no nível necessário à documentação pública. Não há resultados de testes com usuários do Junta.ai associados a estas hipóteses neste documento; sua validação permanece pendente.

| Hipótese | Pendência de evidência com usuários |
|---|---|
| H01 | Comparar esforço, erros e percepção de facilidade no registro manual e conversacional. |
| H02 | Avaliar percepção de autonomia e confiança nas alternativas de compartilhamento. |
| H03 | Avaliar utilidade e incômodo de diferentes frequências de intervenção. |
| H04 | Verificar compreensão do planejamento de metas e comparação de cenários. |
| H05 | Avaliar a sugestão opcional de poupança, sem presumir mudança de comportamento. |
| H06 | Verificar compreensão dos dados e capacidade de encontrar informações no dashboard. |

Os resultados devem ser registrados em [validação com usuários](user-validation.md). As propostas de intervenção, compartilhamento e sugestões descritas abaixo não comprovam funcionalidades implantadas nem autorizam mudanças de escopo.

## H01 — Registro conversacional

**Origem:** literatura sobre fricção em registros financeiros + análise de soluções existentes.

**Hipótese:** permitir o registro de movimentações por linguagem natural pode reduzir o esforço percebido em comparação com fluxos manuais.

**Como validar:**
- comparar registro manual e conversacional;
- medir tempo;
- medir erros;
- observar abandono;
- coletar percepção de facilidade.

---

## H02 — Autonomia sobre dados

**Origem:** observação qualitativa realizada durante um teste real com usuário do Junta.ai, com procedência confirmada pela responsável pelo produto, em conjunto com o princípio de autonomia do projeto.

**Limite da evidência:** o teste fundamentou a formulação de H02, mas a observação qualitativa não comprova sua generalização nem torna a hipótese validada. A validação da hipótese permanece pendente. O participante não é identificado nesta documentação pública. Open Finance não é dependência do MVP.

**Observação:** o uso de Open Finance pode oferecer automação, mas uma integração que analisa automaticamente toda a movimentação pode ser percebida como excessivamente invasiva por alguns usuários.

**Hipótese:** permitir que o usuário escolha progressivamente quais dados compartilhar pode aumentar a percepção de controle e confiança.

**Como validar:**
- fluxo manual;
- compartilhamento parcial;
- integração completa;
- medir confiança, conforto e intenção de uso.

---

## H03 — Intervenção sem fiscalização

**Origem:** observação de alertas e comunicações em soluções existentes.

**Hipótese:** intervenções menos frequentes e baseadas em eventos relevantes podem ser percebidas como mais úteis do que notificações constantes.

**Como validar:**
- testar diferentes frequências;
- testar diferentes tipos de mensagem;
- medir utilidade percebida;
- medir incômodo;
- medir intenção de manter notificações.

---

## H04 — Planejamento explorável de metas

**Origem:** interação observada no Planeja.ai.

**Hipótese:** permitir que o usuário explore diferentes combinações entre prazo e valor mensal pode facilitar a compreensão e o planejamento de metas financeiras.

**Possível solução:**
- slider de prazo;
- slider ou entrada de valor;
- cálculo automático;
- comparação de cenários.

**Como validar:**
- teste de usabilidade;
- verificar se o usuário consegue explicar o próprio plano;
- medir compreensão;
- medir confiança;
- medir percepção de autonomia.

---

## H05 — Nudge contextual para poupança

**Origem:** literatura de economia comportamental + princípio de autonomia do Junta.ai.

**Hipótese:** quando existe uma sobra financeira identificável, uma sugestão contextual de direcionamento para uma meta pode aumentar a intenção de poupar sem reduzir a percepção de autonomia.

**Exemplo hipotético (não representa dados de usuário ou resultado de pesquisa):**

> "Você terminou o mês com R$ 420 disponíveis. Quer direcionar R$ 200 para sua meta?"

A sugestão deve permanecer opcional.

**Como validar:**
- comparar ausência de sugestão e sugestão contextual;
- medir intenção de poupar;
- medir percepção de controle;
- observar aceitação ou rejeição da sugestão.

---

## H06 — Dashboard orientado a perguntas

**Origem:** pesquisa sobre visualização, carga cognitiva e análise de soluções existentes.

**Hipótese:** usuários podem compreender melhor sua situação financeira quando o dashboard organiza informações em torno de perguntas e decisões, em vez de apenas apresentar grande quantidade de indicadores.

**Possíveis perguntas:**

- Como estou?
- Para onde meu dinheiro está indo?
- Estou melhorando?
- Consigo alcançar minha meta?
- Quais possibilidades tenho?

**Como validar:**
- teste de compreensão;
- tempo para encontrar informações;
- capacidade de explicar o próprio cenário;
- preferência entre diferentes estruturas de dashboard.

---

## Princípio transversal

As hipóteses acima devem preservar uma característica central do Junta.ai:

> **O agente deve atuar como parceiro de planejamento, e não como fiscal das finanças do usuário.**

O sistema pode:

- explicar;
- contextualizar;
- simular;
- comparar;
- sugerir;
- perguntar.

A decisão permanece com o usuário.

---

## Status

As hipóteses devem ser classificadas conforme o andamento:

- **Proposta:** hipótese formulada, ainda sem teste.
- **Em validação:** teste em andamento.
- **Validada:** evidências suficientes dentro do escopo do projeto.
- **Refutada:** evidências indicam que a hipótese não se sustenta.
- **Revisada:** hipótese modificada após novas evidências.
