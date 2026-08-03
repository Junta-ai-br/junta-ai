# 📚 Documentação do Junta.ai

Bem-vindo à documentação do **Junta.ai**.

Este diretório reúne toda a documentação utilizada durante o desenvolvimento do projeto, desde a visão de produto até a implementação técnica.

Nosso objetivo é garantir que qualquer integrante da equipe consiga compreender o projeto antes mesmo de abrir o código.

A documentação é organizada por áreas de conhecimento para facilitar a colaboração entre Produto, Design, Desenvolvimento e Inteligência Artificial.

---

## 👋 Para que serve cada doc?

| Ordem | Área | Objetivo |
|-------|----------|-----------------------------|
| 1️⃣ | **Produto** | Entender o problema que estamos resolvendo. |
| 2️⃣ | **Design System** | Conhecer a identidade visual e os padrões da interface. |
| 3️⃣ | **Guia de Desenvolvimento** | Aprender como trabalhamos em equipe. |
| 4️⃣ | **Arquitetura Técnica** | Entender como o projeto está organizado. |
| 5️⃣ | **Inteligência Artificial** | Conhecer a arquitetura do assistente financeiro. |
| 6️⃣ | **Segurança** | Entender as boas práticas adotadas pelo projeto. |


---

# 👋 Primeiro dia no projeto?

Se esta é sua primeira contribuição para o **Junta.ai**, recomendamos seguir a sequência abaixo antes de começar a desenvolver.

```text
📚 Documentação Junta.ai

        👋
        │
        ▼
1️⃣ Produto
        │
        ▼
2️⃣ Design System
        │
        ▼
3️⃣ Guia de Desenvolvimento
        │
        ▼
4️⃣ Arquitetura Técnica
        │
        ▼
5️⃣ Inteligência Artificial
        │
        ▼
6️⃣ Segurança
```

Essa sequência foi pensada para que você compreenda primeiro **o problema**, depois **a solução**, em seguida **como desenvolvemos** e, por fim, **os detalhes técnicos** do projeto.

⏱️ **Tempo estimado para leitura inicial:** aproximadamente **40 a 60 minutos**.

---

# 📖 Ordem recomendada de leitura

## 1️⃣ Produto

Antes de desenvolver qualquer funcionalidade, entendemos o problema que estamos resolvendo.

A documentação de Produto apresenta a visão do Junta.ai, seus princípios, público-alvo, jornada do usuário e a organização das informações financeiras utilizadas pela aplicação.

### Documentos

- Overview
- Vision
- Philosophy
- Product Principles
- Target Users
- User Journey
- Financial Taxonomy

---

## 2️⃣ Design System

Depois de compreender o produto, conheça o Design System.

Ele define a identidade visual, os fundamentos da interface e os padrões utilizados durante todo o desenvolvimento.

### Documentos

- DS-01 · Overview
- DS-02 · Foundations
- DS-03 · Colors
- DS-04 · Typography
- DS-05 · Spacing
- DS-06 · Radius
- DS-07 · Shadows
- DS-08 · Icons

---

## 3️⃣ Guia de Desenvolvimento

Antes de começar a implementar novas funcionalidades, leia nosso guia de desenvolvimento.

Ele descreve o fluxo de trabalho da equipe, organização das branches, convenções de commits, Pull Requests e boas práticas adotadas pelo projeto.

### Documentos

- Guia de Desenvolvimento

---

## 4️⃣ Arquitetura Técnica

Destinado principalmente aos desenvolvedores.

Esta documentação reúne informações sobre a estrutura técnica do projeto e decisões relacionadas à implementação.

Conforme o desenvolvimento evoluir, novos documentos serão adicionados.

### Documentos

- Documentation Guide
- README Docs

---

## 5️⃣ Inteligência Artificial

Esta seção documenta toda a arquitetura cognitiva do assistente financeiro do Junta.ai.

Aqui estão descritos os componentes responsáveis pela interpretação das mensagens, tomada de decisão, memória, categorização, objetivos e ferramentas disponíveis para a IA.

### Documentos

- System
- Intents
- Parser
- Decision Pipeline
- Categorization
- Memory
- Goals
- Guardrails
- Health Score
- Tools
- Recurring

---

## 6️⃣ Segurança

Apresenta a visão geral das práticas de segurança adotadas pelo projeto.

Conforme novas funcionalidades forem implementadas, esta documentação será expandida.

### Documentos

- SEC-01 · Overview

---

# 👥 Guia de leitura por função

Nem todos os integrantes precisam ler toda a documentação.

## Produto

**Leitura recomendada:**

- Produto

---

## UX / UI

**Leitura recomendada:**

- Produto
- Design System

---

## Frontend

**Leitura recomendada:**

- Produto
- Design System
- Guia de Desenvolvimento
- Arquitetura Técnica

---

## Backend

**Leitura recomendada:**

- Produto
- Guia de Desenvolvimento
- Arquitetura Técnica
- Segurança

---

## Inteligência Artificial

**Leitura recomendada:**

- Produto
- Arquitetura Técnica
- IA

---

## Product Owner

**Leitura recomendada:**

- Produto
- Design System
- IA
- Segurança

---

# 📁 Estrutura da documentação

```text
docs/
├── ai/
├── design-system/
├── product/
├── security/
├── team/
└── technical/
```

Cada diretório possui uma responsabilidade específica, evitando duplicação de informações e facilitando a evolução da documentação conforme o projeto cresce.

---

# 📝 Convenções

Para manter a documentação organizada, seguimos algumas convenções:

- Cada documento deve abordar **apenas um assunto**.
- Atualize a documentação sempre que uma decisão importante for tomada.
- Evite duplicar informações entre documentos.
- Sempre que possível, referencie outros documentos em vez de repetir conteúdo.
- A documentação faz parte do produto e deve evoluir junto com ele.

---

# 💜 Filosofia

Antes de desenvolver funcionalidades, entendemos o problema.

Antes de escolher tecnologias, entendemos o produto.

Antes de escrever código, compartilhamos contexto.

A documentação existe para manter toda a equipe alinhada, facilitar a colaboração e reduzir retrabalho.

Ela não é um complemento do projeto.

**Ela faz parte do próprio produto.**