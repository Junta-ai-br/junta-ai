# 🤖 Inteligência Artificial

O Junta.ai utiliza Inteligência Artificial como parte central de sua experiência conversacional.

A proposta é permitir que o usuário interaja naturalmente com sua vida financeira enquanto o sistema interpreta informações, organiza dados e oferece respostas contextualizadas.

A arquitetura de IA utiliza **agentes especializados**, com **CrewAI** como framework de orquestração e **MCP (Model Context Protocol)** como parte da camada responsável pelo contexto, recursos e limites disponíveis para os agentes.

A utilização de agentes permite separar responsabilidades dentro da experiência de IA, enquanto a arquitetura estabelece limites para que suas ações permaneçam relacionadas ao contexto da aplicação.

## Objetivos

A camada de Inteligência Artificial do Junta.ai busca:

- interpretar mensagens em linguagem natural;
- identificar informações financeiras relevantes;
- auxiliar na organização das movimentações;
- apoiar o acompanhamento de objetivos financeiros;
- fornecer respostas contextualizadas;
- contribuir para uma experiência financeira mais simples e acessível.

## Arquitetura

De forma conceitual, a experiência segue o fluxo:

```text
Usuário
   ↓
Experiência Conversacional
   ↓
Backend / API
   ↓
MCP
   ↓
Agentes de IA
   ↓
Resposta / Dados processados
```

O MCP participa da definição do contexto e dos recursos disponíveis para a camada de agentes, enquanto o CrewAI é utilizado para sua orquestração.

## Segurança e limites

A Inteligência Artificial é desenvolvida considerando princípios de segurança, controle de contexto e limites operacionais.

Os detalhes relacionados ao comportamento dos agentes, regras de decisão, memória, ferramentas, prompts e demais mecanismos internos são mantidos na documentação privada do projeto.

## Status

A arquitetura de IA está em desenvolvimento e sendo integrada progressivamente às demais camadas da aplicação.

> Este documento apresenta apenas uma visão geral pública da arquitetura de Inteligência Artificial do Junta.ai. Especificações técnicas e operacionais são mantidas na documentação interna do projeto.
