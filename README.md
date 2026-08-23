# 💜 Junta.ai | Seu assistente financeiro para o dia a dia.

<p align="center">

![Status](https://img.shields.io/badge/Status-Em%20Desenvolvimento-F4B400?style=for-the-badge)
![Frontend](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Build](https://img.shields.io/badge/Build-Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Backend](https://img.shields.io/badge/Backend-Spring%20Boot-6DB33F?style=for-the-badge&logo=springboot)
![AI](https://img.shields.io/badge/AI-CrewAI-7B3FE4?style=for-the-badge)
![Database](https://img.shields.io/badge/Database-PostgreSQL-336791?style=for-the-badge&logo=postgresql)
![Security](https://img.shields.io/badge/Security-Secure%20Development-7140FA?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-success?style=for-the-badge)

</p>

> **Um assistente financeiro conversacional desenvolvido para ajudar pessoas a construir uma relação mais consciente e tranquila com o próprio dinheiro através da Inteligência Artificial.**

---

# 📖 O que é o Junta.ai?

O **Junta.ai** é um assistente financeiro conversacional que transforma conversas em organização, contexto e decisões mais conscientes sobre dinheiro.

Em vez de depender exclusivamente de planilhas, formulários ou interfaces complexas, a proposta é permitir que o usuário converse naturalmente sobre sua vida financeira enquanto a aplicação organiza informações, acompanha objetivos e apresenta insights de forma simples e contextualizada.

A proposta combina **Inteligência Artificial, desenvolvimento Full Stack, desenvolvimento seguro e uma experiência centrada no usuário** para tornar a organização financeira mais acessível e menos intimidante.

O projeto é desenvolvido como **Projeto Final da formação em Desenvolvimento Full Stack da +praTi / Codifica**.

---

# 💡 Por que Junta.ai?

O projeto nasceu inicialmente com o nome **Grana AI**, refletindo sua primeira proposta como uma ferramenta de organização financeira.

À medida que o produto evoluiu, ficou claro que sua missão era maior do que simplesmente controlar gastos ou organizar planilhas.

O objetivo passou a ser criar um assistente capaz de acompanhar o usuário em sua jornada financeira, oferecendo contexto, orientação e conversas que incentivem decisões mais conscientes.

Foi dessa evolução que surgiu o nome **Junta.ai**.

"Junta" faz parte do vocabulário brasileiro e carrega dois significados que representam a essência do produto:

- 💰 **Juntar dinheiro**, incentivando hábitos financeiros mais saudáveis;
- 🤝 **Estar junto**, transmitindo a ideia de um assistente que acompanha o usuário, em vez de apenas registrar informações.

Mais do que um novo nome, Junta.ai representa uma nova visão de produto.

---

# 💜 Nossa Filosofia

> **O Junta.ai não existe para controlar as finanças do usuário.**
>
> Ele existe para ajudá-lo a desenvolver uma relação mais consciente e tranquila com o próprio dinheiro.

O produto foi pensado para apoiar o usuário sem assumir uma postura de cobrança ou julgamento.

A experiência busca combinar:

- autonomia;
- clareza;
- contexto;
- planejamento;
- baixa fricção;
- transparência;
- segurança;
- respeito às escolhas do usuário.

O objetivo é que a tecnologia ajude o usuário a compreender melhor sua situação financeira e tomar suas próprias decisões.

---

# 🎯 Principais Funcionalidades

As funcionalidades abaixo fazem parte do escopo planejado do MVP e estão sendo implementadas progressivamente.

### 💬 Conversação em linguagem natural

O usuário poderá registrar informações financeiras por meio de uma conversa, utilizando linguagem natural.

### 💰 Registro de receitas e despesas

O sistema deverá interpretar as informações fornecidas pelo usuário e transformá-las em registros financeiros estruturados.

### 🧠 Organização inteligente

As movimentações poderão ser classificadas e organizadas automaticamente a partir do contexto fornecido pelo usuário.

### 🎯 Metas financeiras

O usuário poderá definir objetivos financeiros, acompanhar seu progresso e utilizar diferentes cenários para planejar o alcance de suas metas.

### 📊 Dashboard financeiro

Informações financeiras serão apresentadas por meio de indicadores e visualizações que facilitem a compreensão da situação financeira.

### 🧭 Saúde financeira

O sistema poderá utilizar indicadores financeiros e informações fornecidas pelo usuário para apresentar uma visão contextualizada de sua situação.

### 🧠 Recomendações contextualizadas

O agente poderá utilizar as informações disponíveis para oferecer sugestões relacionadas ao contexto financeiro do usuário.

### 📈 Acompanhamento da evolução

O sistema será capaz de organizar o histórico financeiro e utilizar essas informações para fornecer uma visão mais ampla da evolução do usuário.

---

# 🤖 Inteligência Artificial

A experiência conversacional do Junta.ai está sendo projetada para utilizar um **agente de Inteligência Artificial estruturado e orquestrado com CrewAI**.

A proposta é que o agente não funcione apenas como uma interface de conversa, mas como uma camada de inteligência capaz de interpretar as mensagens do usuário e acionar os recursos necessários para processar as informações financeiras.

Fluxo conceitual:

```text
Usuário
   │
   ▼
Chat do Junta.ai
   │
   ▼
Backend / API
   │
   ▼
Orquestração de IA
   │
   │  CrewAI
   │
   ├── Interpretação da mensagem
   ├── Identificação da intenção
   ├── Organização dos dados
   ├── Classificação da movimentação
   └── Ações relacionadas ao contexto financeiro
   │
   ▼
Dados estruturados
   │
   ├── Chat
   ├── Metas
   ├── Saúde financeira
   ├── Dashboard
   └── Histórico
```

> A integração completa entre o agente, backend, persistência de dados e interface ainda está em desenvolvimento.

---

# 🔐 Desenvolvimento Seguro

Segurança não é tratada como uma etapa posterior no Junta.ai.

Por lidar com **informações financeiras e dados potencialmente sensíveis**, o projeto está incorporando práticas de **desenvolvimento seguro desde a fase de arquitetura e implementação**.

A frente de segurança considera, entre outros aspectos:

- 🔐 Autenticação e controle de acesso;
- 🛡️ Proteção de dados e informações financeiras;
- 🔑 Gestão segura de credenciais e segredos;
- 🌐 Segurança na comunicação entre frontend, backend e serviços;
- 🤖 Segurança na integração com agentes e serviços de Inteligência Artificial;
- 🧱 Validação e tratamento seguro de entradas;
- 📋 Princípios de menor privilégio;
- 🧪 Segurança integrada ao processo de desenvolvimento e testes;
- 📚 Documentação contínua das decisões e requisitos de segurança.

A segurança está sendo tratada como uma **preocupação transversal do produto**, e não apenas como uma funcionalidade isolada.

A documentação de segurança está organizada em:

```text
docs/
└── security/
```

> As medidas específicas ainda estão sendo definidas e implementadas de acordo com a evolução da arquitetura. O projeto não considera como implementada uma prática que ainda esteja apenas planejada ou documentada.

---

# 🏗️ Arquitetura Conceitual

A aplicação está sendo estruturada como uma arquitetura Full Stack, separando responsabilidades entre interface, backend, inteligência artificial, persistência de dados e requisitos de segurança.

```text
                    ┌──────────────────────┐
                    │      Junta.ai        │
                    │     React + Vite     │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │      Backend API     │
                    │      Spring Boot     │
                    └──────────┬───────────┘
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
                 ▼                           ▼
       ┌──────────────────┐        ┌──────────────────┐
       │   Orquestração   │        │ Banco de Dados   │
       │     CrewAI       │        │    PostgreSQL    │
       └──────────────────┘        └──────────────────┘

             ┌──────────────────────────────────┐
             │ Segurança transversal à solução │
             │ Arquitetura · Código · Dados    │
             │ IA · APIs · Testes               │
             └──────────────────────────────────┘
```

A arquitetura encontra-se em evolução e será refinada conforme a implementação do backend, agente, persistência e mecanismos de segurança avance.

---

# 🛠️ Tecnologias

<p align="center">

<img src="https://skillicons.dev/icons?i=react,javascript,vite,java,spring,postgres,git,github,vscode" />

</p>

## Frontend

- React
- JavaScript
- Vite
- HTML
- CSS

## Backend

- Java
- Spring Boot
- API REST

## Inteligência Artificial

- CrewAI
- Orquestração de agentes
- LLMs

## Banco de Dados

- PostgreSQL

## Segurança

- Spring Security
- JWT
- Práticas de Secure Development
- Validação e proteção de entradas
- Princípio do menor privilégio
- Segurança integrada ao ciclo de desenvolvimento

> A implementação dos mecanismos de segurança está sendo realizada de forma incremental conforme a arquitetura evolui.

## Testes

- Vitest / Jest
- JUnit

> A estratégia e a implementação dos testes estão em evolução junto com o desenvolvimento da aplicação.

---

# 🚧 Status do Projeto

🟡 **MVP em desenvolvimento**

O Junta.ai encontra-se em processo de evolução arquitetural e implementação do MVP.

Atualmente, as principais frentes incluem:

- 🎨 Design System
- 💻 Desenvolvimento da interface em React
- 💬 Experiência conversacional
- 🤖 Estruturação e orquestração do agente de IA
- ⚙️ Desenvolvimento do backend
- 🗄️ Implementação da persistência de dados
- 🔐 Desenvolvimento seguro
- 🧪 Estratégia de testes
- 👤 Autenticação e autorização

---

# 🚀 Objetivos do MVP

- [x] Definição da visão do produto
- [x] Prototipação inicial
- [x] Evolução da identidade para Junta.ai
- [x] Definição inicial do Design System
- [x] Estruturação da experiência conversacional
- [ ] Conversação funcional com agente de IA
- [ ] Registro inteligente de receitas e despesas
- [ ] Organização automática das transações
- [ ] Acompanhamento de metas financeiras
- [ ] Dashboard financeiro
- [ ] Saúde financeira
- [ ] Recomendações financeiras contextualizadas
- [ ] Histórico financeiro
- [ ] Persistência de dados
- [ ] Autenticação e autorização
- [ ] Controles de segurança
- [ ] Testes automatizados
- [ ] MVP funcional

---

# 📈 Evolução do Projeto

| Etapa | Status |
|---|---|
| 💡 Ideação | ✅ |
| 🎨 Protótipo com IA | ✅ |
| 📚 Definição da visão do produto | ✅ |
| 🔄 Evolução Grana AI → Junta.ai | ✅ |
| 📐 Arquitetura inicial | ✅ |
| 🎨 Design System | ✅ |
| 💻 Estrutura Frontend | 🚧 |
| 💬 Experiência Conversacional | 🚧 |
| 🤖 Agente de IA | 🚧 |
| ⚙️ Backend | 🚧 |
| 🔐 Desenvolvimento Seguro | 🚧 |
| 💾 Persistência de Dados | 🚧 |
| 👤 Autenticação e Autorização | 🚧 |
| 🧪 Testes | ⏳ |
| 🚀 MVP | ⏳ |

**Legenda:**

- ✅ Concluído
- 🚧 Em desenvolvimento
- ⏳ Planejado

---

# 📂 Estrutura do Projeto

A estrutura do repositório está organizada para separar aplicação, documentação e responsabilidades técnicas.

```text
junta-ai/

├── docs/
│   ├── ai/
│   ├── product/
│   ├── research/
│   ├── security/
│   ├── technical/
│   └── testing/
│
├── frontend-v2/
│   ├── src/
│   │   ├── app/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── layouts/
│   │   ├── pages/
│   │   └── ...
│   │
│   └── ...
│
├── README.md
├── LICENSE
└── .gitignore
```

> A estrutura continuará evoluindo conforme backend, agente e infraestrutura forem incorporados ao repositório.

---

# 🧠 Decisões Arquiteturais

As principais decisões adotadas até o momento incluem:

- Arquitetura Full Stack.
- Separação entre frontend e backend.
- API REST para comunicação entre aplicações.
- Componentização da interface.
- Design System próprio.
- Suporte a Light Mode e Dark Mode.
- Experiência centrada em IA conversacional.
- CrewAI como framework de orquestração do agente.
- PostgreSQL como banco de dados.
- Desenvolvimento incremental.
- Documentação contínua.
- Versionamento com Git e GitHub.
- Separação entre documentação de produto, pesquisa, IA, segurança, arquitetura e testes.
- Desenvolvimento seguro incorporado ao ciclo de desenvolvimento.
- Segurança considerada desde a arquitetura, e não apenas após a implementação.
- Evolução progressiva da arquitetura conforme o MVP é implementado.

---

# 📋 Metodologia

O projeto é desenvolvido utilizando práticas inspiradas em metodologias ágeis e princípios de engenharia de software.

- Git Flow
- Versionamento com Git e GitHub
- Desenvolvimento incremental
- Evolução contínua do MVP
- Documentação viva
- Organização por milestones
- Checkpoints frequentes
- Componentização e reutilização
- Revisão contínua de decisões arquiteturais
- **Secure Development Lifecycle (SDL)**
- Segurança considerada durante planejamento, desenvolvimento e testes
- Pesquisa e validação utilizadas para apoiar decisões de produto

A documentação de Research registra evidências, insights, hipóteses e resultados de validações, mantendo uma separação entre o que foi observado, o que foi inferido e o que ainda precisa ser testado.

---

# 📚 Documentação

Toda a documentação oficial está sendo organizada na pasta **`/docs`**.

| Área | Descrição |
|---|---|
| 📍 Roadmap | Evolução das funcionalidades e prioridades |
| 📐 Product | Visão, princípios e especificações do produto |
| 🔎 Research | Pesquisas, evidências, hipóteses e validações |
| 🤖 AI | Comportamento, arquitetura e decisões relacionadas ao agente |
| 🔐 Security | Princípios, requisitos e decisões relacionadas à segurança |
| 🏗️ Technical | Arquitetura, APIs e infraestrutura |
| 🧪 Testing | Estratégia e documentação de testes |
| 📝 Changelog | Histórico de evolução do projeto |

### 🔎 Research

A documentação de Research registra as pesquisas utilizadas para apoiar decisões de desenvolvimento, incluindo:

- fundamentação em literatura e pesquisas acadêmicas;
- análise geral do mercado;
- insights e hipóteses;
- testes e validações com usuários.

A pesquisa orienta o desenvolvimento, mas não é tratada como verdade absoluta. Hipóteses devem ser confrontadas com novas evidências e testes.

### 🔐 Segurança

A documentação de segurança acompanha a evolução da arquitetura e contempla temas como:

- Overview e princípios de segurança;
- Autenticação;
- Autorização;
- Proteção de dados;
- Privacidade;
- Desenvolvimento seguro.

Os documentos são evolutivos e distinguem claramente requisitos, decisões planejadas e controles efetivamente implementados.

---

# 🌐 Protótipo Original

O Junta.ai teve início como um protótipo desenvolvido durante um bootcamp utilizando ferramentas de Inteligência Artificial para acelerar a fase de ideação e validação da interface.

A primeira versão utilizava o nome **Grana AI**.

O protótipo original permanece disponível como registro da evolução do produto e da transformação da ideia inicial em uma aplicação Full Stack colaborativa.

### 🚀 Protótipo

https://grana-ai-project.vercel.app/

### 🔗 Repositório original

https://github.com/danieli-dutra/grana-ai-finance-assistant

---

# 📌 Origem e Evolução

O projeto passou por diferentes fases até chegar ao conceito atual.

```text
Grana AI
   │
   ▼
Protótipo com IA
   │
   ▼
Validação da proposta
   │
   ▼
Evolução da visão do produto
   │
   ▼
Junta.ai
   │
   ▼
Aplicação Full Stack
   │
   ▼
Agente de IA + experiência conversacional
   │
   ▼
Desenvolvimento seguro integrado ao produto
```

A evolução do projeto representa não apenas uma mudança de nome, mas uma mudança de visão: de uma ferramenta de organização financeira para uma experiência conversacional orientada a contexto, autonomia, clareza e segurança.

---

# 👥 Equipe

### 👑 Liderança

**Danieli Dutra Braga** — Líder da equipe e responsável pela liderança do desenvolvimento do projeto.

### 🤝 Equipe

A equipe é multidisciplinar e a divisão de responsabilidades é definida e refinada ao longo do desenvolvimento do projeto, de acordo com as necessidades de cada etapa.

- Artur Alejandro
- Caio Firmino
- Daniel Ferreira
- Jordan Fischer
- Larissa Gama
- Maria Eduarda Pereira
- Renan Estrela
- Robert Melo
- Thais Rodrigues

O projeto é desenvolvido como parte da formação em **Desenvolvimento Full Stack da +praTi / Codifica**.

---

# 📄 Licença

Este projeto está licenciado sob a licença **MIT**.

---

<p align="center">

💜 **Junta.ai**

*Converse. Entenda. Planeje.*

**Seu dinheiro. Do seu jeito.**

</p>
