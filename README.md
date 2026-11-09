
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

</p>

> **Um assistente financeiro conversacional desenvolvido para ajudar pessoas a construir uma relação mais consciente e tranquila com o próprio dinheiro através da Inteligência Artificial.**

🌐 **Site oficial:** https://junta-ai.com

---

## 📖 O que é o Junta.ai?

O **Junta.ai** é um assistente financeiro conversacional que transforma conversas em organização, contexto e decisões mais conscientes sobre dinheiro.

Em vez de depender exclusivamente de planilhas, formulários ou interfaces complexas, a proposta é permitir que o usuário converse naturalmente sobre sua vida financeira enquanto a aplicação organiza informações, acompanha objetivos e apresenta dados de forma simples e contextualizada.

O projeto combina **Inteligência Artificial, desenvolvimento Full Stack, desenvolvimento seguro e uma experiência centrada no usuário** para tornar a organização financeira mais acessível e menos intimidante.

O Junta.ai é desenvolvido como **Projeto Final da formação em Desenvolvimento Full Stack da +praTi / Codifica**, com perspectiva de continuidade e evolução além da formação.

---

## 💡 Por que Junta.ai?

O projeto nasceu inicialmente com o nome **Grana AI**, refletindo sua primeira proposta como ferramenta de organização financeira.

À medida que o produto evoluiu, ficou claro que sua missão era maior do que simplesmente controlar gastos ou organizar planilhas.

O objetivo passou a ser criar um assistente capaz de acompanhar o usuário em sua jornada financeira, oferecendo contexto e orientação para decisões mais conscientes.

Foi dessa evolução que surgiu o nome **Junta.ai**.

"Junta" faz parte do vocabulário brasileiro e carrega dois significados que representam a essência do produto:

- 💰 **Juntar dinheiro:** incentivar hábitos financeiros mais saudáveis e o planejamento de objetivos.
- 🤝 **Estar junto:** transmitir a ideia de um assistente que acompanha o usuário, em vez de apenas registrar informações.

---

## 💜 Nossa Filosofia

> **O Junta.ai não existe para controlar as finanças do usuário.**
>
> Ele existe para ajudá-lo a desenvolver uma relação mais consciente e tranquila com o próprio dinheiro.

O produto foi pensado para apoiar o usuário sem assumir uma postura de cobrança ou julgamento.

Nossa filosofia se traduz em uma premissa:

**Sem fórmulas mágicas, sem sermão e sem fingir que todo mundo vive a mesma realidade.**

A experiência busca combinar:

- Autonomia e respeito às escolhas individuais.
- Clareza e transparência.
- Organização e planejamento financeiro.
- Linguagem acessível e baixa fricção.
- Segurança e privacidade.
- Orientações contextualizadas, sem julgamentos.

A tecnologia deve ampliar a capacidade de compreensão e decisão das pessoas, não substituir sua autonomia.

---

## 🎯 Principais Funcionalidades

O MVP reúne funcionalidades de organização financeira, visualização de dados e uma experiência conversacional conectada aos serviços da aplicação.

As funcionalidades possuem diferentes níveis de implementação e validação, apresentados na seção **Estado do MVP**.

### 💬 Assistente conversacional

A interface conversacional permite que o usuário interaja com o Junta.ai utilizando linguagem natural.

Entre os recursos implementados estão:

- Criação e consulta de conversas.
- Histórico de mensagens.
- Envio de mensagens ao backend.
- Exibição de respostas retornadas pela API.
- Tratamento de falhas e estados de processamento.
- Proteção contra reenvios involuntários de operações.

O processamento por IA depende das configurações e integrações disponíveis no ambiente de execução.

### 💰 Receitas, despesas e categorias

A aplicação disponibiliza recursos para organização de movimentações financeiras:

- Cadastro de receitas e despesas.
- Consulta, edição e exclusão de transações.
- Organização por categorias.
- Consulta por períodos.
- Validação de dados financeiros.

As operações são realizadas por serviços autenticados do backend.

### 🎯 Metas financeiras

O planejamento financeiro contempla:

- Criação e acompanhamento de metas.
- Consulta de objetivos e progresso.
- Operações relacionadas às metas financeiras.
- Tratamento de comandos com chaves de idempotência.
- Proteções para tentativas cujo resultado não foi confirmado.

A recuperação de operações incertas possui limitações documentadas e não representa uma recuperação automática integral.

### 📊 Dashboard e visão financeira

O dashboard apresenta informações financeiras por meio de indicadores e visualizações.

A interface contempla:

- Receitas e despesas.
- Indicadores de saldo.
- Distribuição por categorias.
- Gráficos financeiros.
- Acompanhamento temporal.
- Filtros por período.
- Visualização de movimentações.

As informações são obtidas dos serviços financeiros da aplicação, com validações de contrato e tratamento de estados de carregamento e erro.

### 📈 Relatórios financeiros

A aplicação também disponibiliza relatórios para facilitar a análise dos dados:

- Relatórios mensais.
- Relatórios trimestrais.
- Relatórios semestrais.
- Relatórios anuais.
- Indicadores e visualizações financeiras.
- Exportação para CSV, Excel e PDF.

### 👤 Conta e perfil

A área autenticada contempla:

- Cadastro e login.
- Proteção de rotas.
- Gerenciamento de perfil.
- Fluxo de exclusão de conta.

### 🌐 Páginas institucionais

O frontend também disponibiliza páginas de apresentação do produto, planos, equipe, atualizações, contato, feedback, privacidade e termos de uso.

**Nota:** as demonstrações animadas e os mockups apresentados na landing page são recursos visuais de apresentação do produto. Não representam, isoladamente, evidência de execução financeira real.

---

## 🏗️ Arquitetura da Aplicação

O Junta.ai utiliza uma arquitetura com responsabilidades separadas entre interface, serviços de aplicação, persistência e processamento conversacional.

### 💻 Frontend

Aplicação desenvolvida em **React**, responsável por:

- Interface e navegação.
- Interação com o usuário.
- Apresentação de informações financeiras.
- Visualizações e componentes reutilizáveis.
- Comunicação com as APIs.

### ⚙️ Backend

Serviço desenvolvido em **Java com Spring Boot**, responsável por:

- Autenticação e autorização.
- Regras de domínio financeiro.
- Validação de operações.
- Persistência de dados.
- Comunicação com os serviços da aplicação.
- Execução das operações financeiras.

### 🗄️ Banco de dados

O **PostgreSQL** é utilizado para persistência dos dados da aplicação.

### 🤖 AI Service

Serviço desenvolvido em **Python**, responsável pelo processamento estruturado das solicitações conversacionais encaminhadas pelo backend.

A arquitetura estabelece uma separação importante:

**A IA interpreta e auxilia o processamento das solicitações; o backend permanece responsável pela execução autoritativa e persistência das operações financeiras.**

### 🧠 CrewAI e modelos de linguagem

O AI Service possui implementação de orquestração com **CrewAI** e integração configurável com modelos **Gemini**.

A execução com modelos externos depende da configuração e disponibilidade do provedor.

Os testes realizados com adaptadores simulados verificam comportamentos específicos, mas não comprovam, isoladamente, a execução com modelos reais em produção.

### 🔗 MCP | Model Context Protocol

O Junta.ai está evoluindo sua arquitetura baseada em MCP para estabelecer contratos formais de comunicação e disponibilização de recursos entre os componentes da aplicação.

O projeto já possui uma implementação experimental e propostas de contratos, que estão em processo de revisão e validação para adoção como parte da arquitetura oficial.

A próxima etapa contempla:

- Formalização dos contratos.
- Validação de compatibilidade.
- Definição das responsabilidades e limites de acesso.
- Integração progressiva com o AI Service.

A formalização de um contrato não significa, automaticamente, que sua integração produtiva esteja concluída.

**O MVP não depende de integração com Open Finance.**

---

## 🛠️ Tecnologias

<p align="center">

<img src="https://skillicons.dev/icons?i=react,javascript,vite,java,spring,postgres,docker,git,github,vscode,azure" alt="Tecnologias utilizadas no Junta.ai" />

</p>

| Camada | Tecnologias |
|---|---|
| Frontend | React 19, JavaScript, Vite 8, React Router 7 |
| Interface | CSS, Radix UI, Lucide, Motion |
| Visualizações | Recharts |
| Comunicação HTTP | Axios |
| Backend | Java, Spring Boot, API REST |
| Banco de dados | PostgreSQL |
| AI Service | Python, CrewAI, Gemini |
| Contratos e integração de IA | MCP |
| Testes frontend | Vitest, React Testing Library |
| Qualidade | ESLint, testes automatizados e GitHub Actions |
| Infraestrutura | Docker, Azure e Vercel |

As tecnologias possuem diferentes estados de implantação e integração. Sua presença nesta tabela não significa que todos os componentes estejam operacionais simultaneamente em produção.

---

## 🔐 Desenvolvimento Seguro e Privacidade

Segurança é uma preocupação transversal do Junta.ai.

Por lidar com informações financeiras, o projeto considera práticas de desenvolvimento seguro desde a arquitetura até a implementação das funcionalidades.

Entre os mecanismos implementados e documentados estão:

- Autenticação e proteção de rotas.
- Controle de acesso a operações autenticadas.
- Validação de entradas e respostas das APIs.
- Tratamento de sessões expiradas.
- Chaves de idempotência para determinadas operações financeiras.
- Proteções contra reenvios involuntários.
- Limites de tamanho e requisições em formulários públicos.
- Tratamento de erros sem exposição intencional de informações sensíveis.
- Separação entre interpretação por IA e execução financeira autoritativa.

A estratégia é orientada por boas práticas de engenharia de software e referências como a **OWASP**, além dos aprendizados obtidos durante a **GloboSec Week**.

Os controles possuem escopos e limitações específicos. A documentação técnica distingue implementação, testes locais e validação em ambiente implantado.

Documentações internas relacionadas à segurança, contratos e decisões operacionais são mantidas separadamente, com acesso restrito à equipe.

---

## ♿ Experiência e Acessibilidade

A interface do Junta.ai foi desenvolvida considerando princípios de usabilidade, clareza e acessibilidade.

Entre os aspectos contemplados estão:

- Light Mode e Dark Mode.
- Responsividade.
- Legibilidade e contraste.
- Espaçamento e hierarquia visual.
- Componentes reutilizáveis.
- Estados de carregamento e erro.
- Navegação e identificação de controles.

Essas medidas não constituem, isoladamente, uma certificação de conformidade integral com as WCAG.

A experiência permanece em evolução, com oportunidades de melhoria identificadas ao longo do desenvolvimento e das validações.

---

## 🧪 Testes e Qualidade

O Junta.ai utiliza testes automatizados para verificar comportamentos da aplicação e apoiar a evolução do MVP.

No frontend, são utilizados **Vitest** e **React Testing Library**.

Entre os cenários contemplados estão:

- Componentes e interações.
- Rotas e autenticação.
- Contratos de serviços.
- Validações de entrada.
- Fluxos financeiros.
- Tratamento de erros.
- Comportamentos relacionados à integração com APIs.

O projeto também utiliza ferramentas de análise estática e processos de integração contínua.

### Execução local do frontend

**Pré-requisitos:** Node.js e npm compatíveis com as dependências do projeto.

```bash
git clone https://github.com/Junta-ai-br/junta-ai.git
cd junta-ai/frontend-v2
npm ci
npm run dev
```

### Comandos disponíveis

```bash
npm run lint
npm run test:run
npm run test:coverage
npm run build
npm run preview
```

Para integração com o backend, é necessário configurar a variável de ambiente `VITE_API_URL` conforme o ambiente utilizado.

Os testes automatizados verificam comportamentos específicos, mas não substituem a validação ponta a ponta, os testes de infraestrutura ou a avaliação com usuários reais.

---

## 🚧 Estado do MVP

🟡 **MVP em desenvolvimento e integração**

O Junta.ai possui implementações de frontend, serviços financeiros, autenticação, visualizações, planejamento e relatórios.

A evolução do projeto está concentrada na consolidação das integrações, validação operacional e amadurecimento das funcionalidades.

| Área | Situação documental |
|---|---|
| Identidade e visão do produto | Definidas |
| Frontend React | Implementado |
| Autenticação e rotas protegidas | Implementadas |
| Serviços de transações | Implementados |
| Metas financeiras | Implementadas, com limitações documentadas |
| Dashboard e relatórios | Implementados |
| Assistente conversacional | Interface e integração com API implementadas |
| Orquestração CrewAI | Implementação condicional |
| MCP | Contratos em formalização; integração produtiva pendente |
| Testes automatizados | Implementados |
| Validação completa em produção | A confirmar |
| Testes formais com usuários | Evidências a consolidar |

Os estados representam evidências de implementação disponíveis na documentação e no código, não uma certificação de disponibilidade de cada funcionalidade no ambiente público.

### Próximas etapas

As prioridades de evolução incluem:

- Formalização e validação dos contratos MCP.
- Consolidação da integração com o AI Service.
- Validação dos fluxos financeiros ponta a ponta.
- Ampliação das evidências de testes e validação operacional.
- Avaliação da experiência com usuários.
- Refinamento contínuo de usabilidade, acessibilidade e segurança.

---

## 📂 Estrutura do Projeto

A estrutura pública do repositório reúne a aplicação frontend, documentação e materiais relacionados à evolução do produto.

```text
junta-ai/
├── docs/
│   ├── ai/
│   ├── design-system/
│   ├── product/
│   ├── research/
│   ├── security/
│   ├── team/
│   └── ...
│
├── frontend-v2/
│   ├── src/
│   │   ├── app/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   └── ...
│   └── ...
│
├── README.md
└── ...
```

A pasta `docs/` contém documentação pública sobre o produto, experiência, decisões e evolução técnica.

---

## 📚 Documentação e Repositórios

O desenvolvimento do Junta.ai está distribuído entre repositórios com responsabilidades específicas.

| Repositório | Responsabilidade |
|---|---|
| [junta-ai](https://github.com/Junta-ai-br/junta-ai) | Frontend, produto e documentação pública |
| [junta-ai-backend](https://github.com/Junta-ai-br/junta-ai-backend) | Backend, APIs e domínio financeiro |
| `junta-ai-ai` | AI Service, orquestração e desenvolvimento de IA |
| `junta-ai-motion` | Recursos de motion design e animação |

Os repositórios de IA e motion design possuem acesso privado.

A documentação pública está organizada na pasta [`docs/`](https://github.com/Junta-ai-br/junta-ai/tree/main/docs).

Materiais internos de segurança, contratos e decisões operacionais são mantidos separadamente.

---

## 🌐 Protótipo Original

O Junta.ai teve início como um protótipo desenvolvido durante um bootcamp, utilizando ferramentas de Inteligência Artificial para acelerar a ideação e a exploração da interface.

A primeira versão utilizava o nome **Grana AI**.

**Repositório original:**

https://github.com/danieli-dutra/grana-ai-finance-assistant

O projeto evoluiu posteriormente para uma aplicação Full Stack com foco em experiência conversacional, organização financeira e desenvolvimento seguro.

---

## 👥 Equipe

O Junta.ai é desenvolvido colaborativamente como Projeto Final da formação em Desenvolvimento Full Stack da **+praTi / Codifica**.

O projeto reúne diferentes experiências e conhecimentos em desenvolvimento de software, inteligência artificial, produto, UX/UI, infraestrutura e segurança.

### 👑 Liderança

**Danieli Dutra Braga** — Líder da equipe e responsável pela coordenação do desenvolvimento do Junta.ai.

### 🤝 Integrantes

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

O desenvolvimento do Junta.ai é resultado da colaboração entre seus integrantes, desde a concepção do produto até a implementação e evolução de suas funcionalidades.

---

<p align="center">

💜 **Junta.ai**

*Converse. Entenda. Planeje.*

**Seu dinheiro. Do seu jeito.**

</p>

---

## © Direitos sobre o Projeto

O código, a documentação, a identidade visual, os materiais e os demais conteúdos deste repositório são disponibilizados para fins de apresentação e acompanhamento do desenvolvimento do projeto.

**Este repositório não possui uma licença open source declarada.**

A ausência de uma licença open source não concede permissão geral para cópia, redistribuição, comercialização ou reutilização do projeto.

Para solicitações relacionadas ao uso do projeto, entre em contato com a equipe do Junta.ai.
