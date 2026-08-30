# 💜 Junta.ai | Seu assistente financeiro para o dia a dia.

<p align="center">

![Status](https://img.shields.io/badge/Status-Em%20Desenvolvimento-F4B400?style=for-the-badge)
![Frontend](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Build](https://img.shields.io/badge/Build-Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Backend](https://img.shields.io/badge/Backend-Spring%20Boot-6DB33F?style=for-the-badge&logo=springboot)
![AI](https://img.shields.io/badge/AI-CrewAI-7B3FE4?style=for-the-badge)
![MCP](https://img.shields.io/badge/AI-MCP-7140FA?style=for-the-badge)
![Database](https://img.shields.io/badge/Database-PostgreSQL-336791?style=for-the-badge&logo=postgresql)
![Infrastructure](https://img.shields.io/badge/Infrastructure-Docker-2496ED?style=for-the-badge&logo=docker)
![Cloud](https://img.shields.io/badge/Cloud-Azure-0078D4?style=for-the-badge&logo=microsoftazure)
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

Junta.ai representa uma nova visão de produto.

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

O usuário poderá definir objetivos financeiros e acompanhar seu progresso.

### 📊 Dashboard financeiro

Informações financeiras serão apresentadas por meio de indicadores e visualizações que facilitem a compreensão da situação financeira.

### 🧭 Saúde financeira

O sistema poderá utilizar indicadores financeiros e informações fornecidas pelo usuário para apresentar uma visão contextualizada de sua situação.

### 🧠 Recomendações contextualizadas

Os agentes poderão utilizar as informações disponíveis para oferecer sugestões relacionadas ao contexto financeiro do usuário.

### 📈 Acompanhamento da evolução

O sistema será capaz de organizar o histórico financeiro e utilizar essas informações para fornecer uma visão mais ampla da evolução do usuário.

---

# 🤖 Inteligência Artificial

A experiência conversacional do Junta.ai está sendo projetada com uma arquitetura baseada em **agentes de Inteligência Artificial**, utilizando **CrewAI** como framework de orquestração.

O **MCP (Model Context Protocol)** atua como uma camada de controle, responsável por definir o contexto, os recursos e os limites aos quais os agentes terão acesso.

Dessa forma, os agentes não atuam de maneira livre. Suas respostas e ações devem permanecer dentro do contexto financeiro e das configurações estabelecidas pelo MCP.

O **CrewAI** é responsável por orquestrar os diferentes agentes especializados dentro desse contexto.

A relação entre essas camadas pode ser representada da seguinte forma:

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
MCP
   │
   │  Contexto, regras, recursos e limites
   │
   ▼
CrewAI
   │
   │  Orquestração dos agentes
   │
   ├── Agente de interpretação
   ├── Agente de classificação
   ├── Agente de organização
   └── Outros agentes especializados
   │
   │  Agentes operam somente dentro
   │  do contexto definido pelo MCP
   │
   ▼
Resposta / Dados processados
   │
   ├── Chat
   ├── Metas
   ├── Saúde financeira
   ├── Dashboard
   └── Histórico
```

Atualmente, o **MCP do agente está configurado** e o agente encontra-se em fase de testes.

> A integração completa entre agentes, backend, persistência de dados e interface ainda está em desenvolvimento.

---

# 🔐 Desenvolvimento Seguro

Segurança é uma preocupação transversal do Junta.ai.

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

As decisões de segurança estão sendo orientadas por referências como a **OWASP**, pelos aprendizados obtidos na **GloboSec Week** e pelos recursos disponíveis na infraestrutura de nuvem.

A definição da estratégia para armazenamento de credenciais, tokens e chaves de acesso ainda está em avaliação.

---

# ♿ Acessibilidade visual básica

A interface considera aspectos básicos de acessibilidade visual, incluindo:

- Light Mode e Dark Mode;
- contraste visual;
- espaçamento e legibilidade;
- adaptação da interface a diferentes tamanhos de tela.

Recursos adicionais de acessibilidade serão avaliados em etapas futuras do projeto.

---

# 📊 Dados e Visualizações

O dashboard do Junta.ai apresenta informações financeiras de forma visual para facilitar a compreensão dos dados.

A interface contempla:

- acompanhamento de receitas;
- acompanhamento de despesas;
- saldo;
- categorias;
- períodos;
- filtros por datas;
- gráficos financeiros;
- acompanhamento de metas.

A equipe está trabalhando na integração entre os dados provenientes do chat, a persistência no banco de dados e os componentes responsáveis pelas visualizações.

Os gráficos estão sendo estruturados para permitir filtros por período e datas personalizadas.

---

# 🧪 Testes e Validação

A etapa de testes é uma das prioridades atuais do projeto.

Além de verificar se as funcionalidades estão operacionalmente corretas, a equipe busca estabelecer critérios objetivos para validar se aquilo que foi implementado corresponde aos requisitos definidos.

A estratégia de testes está sendo estruturada considerando práticas de engenharia de software e os aprendizados relacionados a **Specification-Driven Development (SDD)**, buscando transformar especificações em critérios verificáveis, testes e evidências de qualidade.

Entre os objetivos dessa etapa estão:

- validar requisitos funcionais;
- verificar comportamentos esperados do sistema;
- testar integrações entre as diferentes camadas;
- validar o comportamento dos agentes de IA;
- identificar falhas e comportamentos fora do escopo;
- verificar requisitos de segurança;
- registrar evidências dos testes realizados.

A estratégia e a implementação dos testes ainda estão em evolução junto com a arquitetura do sistema.

Também estão previstos **testes com usuários reais na primeira metade de outubro de 2026**, com o objetivo de coletar feedback, identificar problemas de usabilidade e orientar as correções necessárias antes da apresentação final do projeto.

---

# 🏗️ Arquitetura Conceitual

A aplicação está sendo estruturada como uma arquitetura Full Stack, separando responsabilidades entre interface, backend, inteligência artificial, persistência de dados, integrações e requisitos de segurança.

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
                  ┌─────────────────┴─────────────────┐
                  │                                   │
                  ▼                                   ▼
        ┌──────────────────┐                ┌──────────────────┐
        │       MCP        │                │ Banco de Dados   │
        │ Contexto, regras │                │    PostgreSQL    │
        │ e recursos       │                └──────────────────┘
        └────────┬─────────┘
                 │
                 ▼
        ┌──────────────────┐
        │      CrewAI      │
        │  Orquestração    │
        │    de agentes    │
        └────────┬─────────┘
                 │
          ┌──────┴──────┐
          │             │
          ▼             ▼
    ┌──────────┐   ┌──────────┐
    │ Agente 1 │   │ Agente 2 │
    └──────────┘   └──────────┘
          │             │
          └──────┬──────┘
                 │
                 ▼
        ┌──────────────────┐
        │ Resposta / Dados │
        │    processados   │
        └──────────────────┘

       ┌──────────────────────────────────────┐
       │ Segurança transversal à solução     │
       │ Arquitetura · Código · Dados · IA   │
       │ APIs · Infraestrutura · Testes       │
       └──────────────────────────────────────┘
```

A arquitetura encontra-se em evolução e está sendo refinada conforme a implementação do backend, agentes, persistência, integrações e mecanismos de segurança avança.

---

# 🛠️ Tecnologias

<p align="center">

<img src="https://skillicons.dev/icons?i=react,javascript,vite,java,spring,postgres,docker,nginx,git,github,vscode,azure" />

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
- MCP (Model Context Protocol)
- Agentes de Inteligência Artificial
- Orquestração de agentes
- LLMs

## Banco de Dados

- PostgreSQL

## Infraestrutura e Cloud

- Docker
- Containers
- NGINX
- Azure
- Monitoramento da aplicação

## Integrações

- API REST
- WhatsApp (em análise)

## Segurança

- Spring Security
- JWT
- OWASP
- Práticas de Secure Development
- Validação e proteção de entradas
- Princípio do menor privilégio

> A implementação dos mecanismos de segurança está sendo realizada de forma incremental conforme a arquitetura evolui.

## Testes

- Testes unitários
- Testes de integração
- Testes funcionais
- Testes de componentes
- Validação baseada em requisitos

> A estratégia e a implementação dos testes estão em evolução junto com o desenvolvimento da aplicação.

---

# 🚧 Status do Projeto

🟡 **MVP em desenvolvimento**

O Junta.ai encontra-se em processo de evolução arquitetural e implementação do MVP.

Atualmente, as principais frentes incluem:

- 🎨 Design System
- 💻 Desenvolvimento da interface em React
- 💬 Experiência conversacional
- 🤖 Estruturação e orquestração dos agentes de IA
- 🔗 Configuração do MCP
- ⚙️ Estruturação do backend
- 🗄️ Implementação da persistência de dados
- 📱 Integração com WhatsApp (em análise)
- 🐳 Containerização da aplicação
- ☁️ Configuração da infraestrutura em nuvem
- 🔐 Desenvolvimento seguro
- ♿ Acessibilidade visual básica
- 🧪 Estratégia de testes
- 👤 Autenticação e autorização

---

# 🚀 Objetivos do MVP

- [x] Definição da visão do produto
- [x] Prototipação inicial
- [x] Evolução da identidade para Junta.ai
- [x] Definição inicial do Design System
- [x] Estruturação da experiência conversacional
- [x] Definição do PostgreSQL
- [x] Configuração inicial do MCP
- [ ] Comunicação inicial com WhatsApp (em análise)
- [ ] Conversação funcional com agentes de IA
- [ ] Registro inteligente de receitas e despesas
- [ ] Organização das transações
- [ ] Acompanhamento de metas financeiras
- [ ] Dashboard financeiro integrado aos dados
- [ ] Saúde financeira
- [ ] Recomendações financeiras contextualizadas
- [ ] Histórico financeiro
- [ ] Persistência completa de dados
- [ ] API de integração entre frontend, IA e banco de dados
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
| 🔗 MCP do agente | ✅ |
| 💻 Estrutura Frontend | 🚧 |
| 💬 Experiência Conversacional | 🚧 |
| 🤖 Agentes de IA | 🚧 |
| ⚙️ Backend | 🚧 |
| 🔐 Desenvolvimento Seguro | 🚧 |
| 💾 Persistência de Dados | 🚧 |
| ☁️ Infraestrutura em Cloud | 🚧 |
| 👤 Autenticação e Autorização | 🚧 |
| ♿ Acessibilidade visual básica | 🚧 |
| 🧪 Testes | 🚧 |
| 📱 Integração WhatsApp | ⏳ |
| 👥 Validação com Usuários | ⏳ |
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

> A estrutura continuará evoluindo conforme backend, agentes e infraestrutura forem incorporados ao repositório.

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
- **CrewAI como framework de orquestração dos agentes de IA.**
- **MCP como camada de definição de contexto, recursos e limites para os agentes.**
- Agentes operando dentro das configurações estabelecidas pelo MCP.
- PostgreSQL como banco de dados.
- Docker para containerização.
- NGINX para servir o frontend.
- Azure para infraestrutura em nuvem e monitoramento.
- Desenvolvimento incremental.
- Documentação contínua.
- Versionamento com Git e GitHub.
- Separação entre documentação de produto, pesquisa, IA, segurança, arquitetura e testes.
- Desenvolvimento seguro incorporado ao ciclo de desenvolvimento.
- Segurança considerada desde a arquitetura.
- Acessibilidade visual considerada na construção da interface.
- Evolução progressiva da arquitetura conforme o MVP é implementado.

---

# 📋 Metodologia

O projeto é desenvolvido utilizando práticas inspiradas em metodologias ágeis e princípios de engenharia de software.

- Git e GitHub para versionamento;
- Desenvolvimento incremental;
- Evolução contínua do MVP;
- Documentação viva;
- Organização por milestones;
- Checkpoints frequentes;
- Componentização e reutilização;
- Revisão contínua de decisões arquiteturais;
- **Secure Development Lifecycle (SDL);**
- Segurança considerada durante planejamento, desenvolvimento e testes;
- Pesquisa e validação utilizadas para apoiar decisões de produto;
- Especificações e critérios verificáveis como apoio à estratégia de testes.

A equipe também utiliza o projeto como laboratório prático para aplicar conceitos de desenvolvimento Full Stack, arquitetura, Inteligência Artificial, segurança, cloud e metodologias ágeis.

---

# 📚 Documentação

Toda a documentação oficial está sendo organizada na pasta **`/docs`**.

| Área | Descrição |
|---|---|
| 📍 Roadmap | Evolução das funcionalidades e prioridades |
| 📐 Product | Visão, princípios e especificações do produto |
| 🔎 Research | Pesquisas, evidências, hipóteses e validações |
| 🤖 AI | Comportamento, arquitetura e decisões relacionadas aos agentes |
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

### 🧪 Testing

A documentação de testes acompanha a evolução dos requisitos e critérios de validação do sistema.

A estratégia busca relacionar:

```text
Requisito
   ↓
Especificação
   ↓
Critério verificável
   ↓
Teste
   ↓
Resultado
   ↓
Evidência
```

Essa abordagem permite acompanhar não apenas se uma funcionalidade foi implementada, mas também se ela atende ao comportamento esperado e aos requisitos definidos.

---

# 🌐 Protótipo Original

O Junta.ai teve início como um protótipo desenvolvido durante um bootcamp utilizando ferramentas de Inteligência Artificial para acelerar a fase de ideação e validação da interface.

A primeira versão utilizava o nome **Grana AI**.

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
Agentes de IA + experiência conversacional
   │
   ▼
MCP + controle de contexto e recursos
   │
   ▼
CrewAI + orquestração de agentes
   │
   ▼
Desenvolvimento seguro integrado ao produto
   │
   ▼
Infraestrutura em containers e cloud
   │
   ▼
Testes e validação
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
- Simone Frez
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
