# 🤖 Inteligência Artificial

**Revisão documental:** 05/11/2026.

O Junta.ai utiliza Inteligência Artificial como parte central de sua experiência conversacional.

A proposta é permitir que o usuário interaja naturalmente com sua vida financeira enquanto o sistema interpreta informações, organiza dados e oferece respostas contextualizadas.

O AI Service é desenvolvido em **Python**, possui orquestração com **CrewAI** e integração configurável com **Gemini**. A execução com modelos externos depende da configuração e disponibilidade do provedor; sua presença no código não comprova validação em produção.

O **MCP (Model Context Protocol)** possui implementação experimental e contratos em formalização. Não é apresentado como etapa obrigatória de um fluxo produtivo validado.

A utilização de agentes permite separar responsabilidades dentro da experiência de IA, enquanto a arquitetura estabelece limites para que suas ações permaneçam relacionadas ao contexto da aplicação.

## Objetivos

A camada de Inteligência Artificial do Junta.ai busca:

- interpretar mensagens em linguagem natural;
- identificar informações financeiras relevantes;
- auxiliar na organização das movimentações;
- apoiar o acompanhamento de objetivos financeiros;
- fornecer respostas contextualizadas;
- contribuir para uma experiência financeira mais simples e acessível.

## Responsabilidades gerais

A solução combina uma interface em **React**, serviços de aplicação em **Spring Boot** e um AI Service em **Python**:

- **Frontend:** interface e experiência do usuário.
- **Backend:** regras de negócio, validação e execução autoritativa das operações financeiras.
- **AI Service:** processamento conversacional e interpretação das solicitações.

A interpretação de uma mensagem pela IA não comprova que uma operação financeira foi concluída. O usuário permanece responsável por suas escolhas.

## Segurança e limites

A Inteligência Artificial é desenvolvida considerando princípios de segurança, controle de contexto e limites operacionais.

Esta visão pública apresenta apenas os princípios e as responsabilidades gerais. Especificações operacionais são tratadas na governança interna do projeto.

## Status

A interface conversacional e a comunicação com os serviços da aplicação estão implementadas. A execução da orquestração CrewAI e da integração com Gemini depende da configuração disponível; a validação ponta a ponta no ambiente implantado permanece a confirmar. Testes com componentes simulados não comprovam execução com modelos reais em produção. Esta revisão documental não executou testes de IA ou verificações produtivas.

As demonstrações animadas da landing page são mockups de apresentação, não evidência de execução real do assistente. O MVP não depende de Open Finance.

> Este documento apresenta apenas uma visão geral pública da arquitetura de Inteligência Artificial do Junta.ai. Especificações técnicas e operacionais são mantidas na documentação interna do projeto.
