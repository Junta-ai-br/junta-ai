# Funcionalidades do MVP — Junta.ai

**Revisão documental:** 05/11/2026.

## 1. Objetivo e benefício

Ajudar o usuário a conhecer os recursos de organização financeira do MVP e seus limites atuais.

## 2. Descrição funcional

Este índice reúne a documentação funcional baseada no inventário da main no commit `b2a9ea5e2ea18a46f80a263ae199e49522db2442`. Os estados descrevem capacidades presentes no código, não disponibilidade comprovada em produção.

## 3. Principais capacidades existentes

| Documento | Conteúdo | Estado observado |
|---|---|---|
| [Assistente](assistant.md) | Mensagens, conversas, histórico e respostas. | Implementado |
| [Visão financeira](financial-overview.md) | Movimentações, categorias e dashboard. | Implementado |
| [Planejador e metas](goals-planner.md) | Simulações, histórico e acompanhamento de metas. | Implementado |
| [Relatórios](reports.md) | Análise por período e exportações. | Implementado |
| [Conta](account.md) | Perfil, preferências e fluxo de exclusão. | Parcialmente implementado |

## 4. Regras e comportamentos relevantes

Uma conversa não equivale a registro financeiro; uma simulação não equivale a meta ou aporte. Cada documento explica os comportamentos necessários para compreender essas diferenças.

## 5. Limitações e estados ainda não validados

Este levantamento não executou testes nem validação em produção. A presença de uma capacidade no código não comprova resultado de testes ou funcionamento no ambiente implantado. As limitações conhecidas estão indicadas nos documentos correspondentes.

## 6. Estado atual

**Estado do conjunto inventariado:** as funcionalidades financeiras e conversacionais apresentam capacidades implementadas no código, com dependências de integração e limitações identificadas no gerenciamento de conta. O funcionamento completo em produção não foi validado neste levantamento.

Para contexto geral, consulte a [visão do produto](../overview.md) e o [índice público](../../README-Docs.md).

## Documentação técnica

Detalhes de implementação, regras de negócio, decisões técnicas, testes e escala das telas de finanças. Comece pelo [índice técnico](tecnico-visao-geral.md).

| Documento | Conteúdo |
|---|---|
| [Visão geral técnica](tecnico-visao-geral.md) | Arquitetura, tecnologias, decisões técnicas, manutenibilidade e escala |
| [Assistente](tecnico-assistente.md) | Tela `/assistente`, fluxo do chat e fontes de dados |
| [Saúde Financeira](tecnico-saude-financeira.md) | Regra de negócio e fórmula do score, passo a passo e com fontes |
| [Visão do mês e Dashboard](tecnico-visao-do-mes-e-dashboard.md) | Lançamentos, categorias, período e gráficos |
| [Metas e Guardado](tecnico-metas-e-guardado.md) | Metas, aportes, retiradas, saldo disponível e total acompanhado |
| [Relatórios](tecnico-relatorios.md) | Períodos, comparação, gráfico semanal e exportações |
