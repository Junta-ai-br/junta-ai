---
title: Estratégia para Componentes Complexos
owner: ""
status: Approved
created: 2026-07-25
updated:
domains:
  - frontend, ux
  - design system
tags:
  - adr
  - architecture
  - design-system
  - components
---

# # ADR-002 — Estratégia para Componentes Complexos

## Contexto

Durante o desenvolvimento do frontend do Junta.ai percebemos que o maior tempo de implementação não está na criação do layout dos componentes, mas na infraestrutura necessária para torná-los robustos.

Grande parte desse tempo é consumida por:

- gerenciamento de foco;
- navegação por teclado;
- acessibilidade (ARIA);
- clique fora (Outside Click);
- Focus Trap;
- posicionamento de overlays;
- animações de abertura e fechamento;
- tratamento de estados e edge cases.

Esses problemas são comuns a praticamente qualquer aplicação web moderna e já possuem soluções maduras mantidas por comunidades especializadas.

Ao mesmo tempo, o diferencial do Junta.ai está na experiência do usuário, identidade visual e consistência do Design System.

## Problema

Implementar todos os componentes complexos do zero aumenta significativamente o tempo de desenvolvimento, exige grande esforço de testes e manutenção e reduz a velocidade de evolução do produto.

## Decisão

O Junta.ai adotará bibliotecas headless sempre que o principal desafio do componente for sua infraestrutura e comportamento.

Essas bibliotecas poderão ser utilizadas para fornecer:

- acessibilidade;
- gerenciamento de foco;
- navegação por teclado;
- overlays;
- posicionamento;
- gerenciamento de estado;
- comportamentos complexos.

Todo componente continuará sendo exposto através do Design System do Junta.ai.

A aplicação nunca dependerá diretamente dessas bibliotecas.Decision

## Observações

Durante o desenvolvimento do Header e do Theme Switch foi identificado que a maior parte do tempo foi investida na implementação de comportamentos (transições, gerenciamento de estados e animações) e não na construção do layout dos componentes.

Essa experiência motivou a criação desta ADR.

## Referências

### Internas

- [[Design System]]
- [[Frontend Architecture]]
- [[Component Library]]

### Externas

- https://www.radix-ui.com/
- https://base-ui.com/
- https://www.w3.org/WAI/ARIA/apg/
