# Estado do MVP — Junta.ai

**Revisão:** 05/11/2026. **Referência:** main no commit `08c588a95f32c686f85de8a6ed4a60cd4d61dd42`.

Esta fotografia resume as seis áreas do inventário funcional. Implementação observada no código, resultado de testes e validação no ambiente implantado são evidências distintas. Integração na main não comprova disponibilidade em produção.

## Estado por área

| Área | Implementação observada | Limites relevantes |
|---|---|---|
| [Assistente conversacional](features/assistant.md) | Interface e comunicação com os serviços implementadas. | A experiência com IA depende das integrações disponíveis. Interpretação de mensagem não comprova registro financeiro. |
| [Movimentações e categorias](features/financial-overview.md) | Fluxos de receitas, despesas e categorias implementados. | Consultas e alterações dependem dos serviços financeiros; dados indisponíveis não equivalem a ausência de movimentações. |
| [Dashboard](features/financial-overview.md) | Indicadores, filtros e gráficos implementados. | As visualizações dependem dos dados disponíveis no período consultado. |
| [Planejador e metas](features/goals-planner.md) | Simulações, histórico, criação de metas e acompanhamento implementados. | Estimativas não garantem resultados; simulação, meta e aporte são distintos. |
| [Relatórios](features/reports.md) | Períodos, comparações e exportações implementados. | Dependem dos dados disponíveis; PDF via impressão do navegador e Excel em formato `.xls`. |
| [Perfil e conta](features/account.md) | Parcialmente implementados: interface e alterações locais observadas. | Atualização e exclusão no servidor não comprovadas; preferências não comprovam envio de notificações. |

## Evidências e validação

- **Implementação:** o inventário de origem registra capacidades presentes no código, detalhadas nos documentos funcionais acima.
- **Testes:** há cenários automatizados no projeto, mas este levantamento não executou testes nem consolida resultados de aprovação por área. Não atribui o estado “testado e aprovado” às funcionalidades.
- **Ambiente implantado:** o funcionamento completo das seis áreas não foi validado neste levantamento. A presença de páginas ou serviços não substitui essa evidência.

## IA e integrações

O uso de CrewAI e da integração configurável com Gemini depende da configuração disponível. Sua implementação não comprova execução produtiva com modelos reais. MCP permanece experimental, com contratos em formalização. Consulte a [visão geral de IA](../ai/ai-overview.md).

O backend mantém a responsabilidade autoritativa pelas operações financeiras. O MVP não depende de Open Finance.

## Pesquisa e evolução

H02 foi formulada a partir de uma observação qualitativa em teste real com usuário, conforme confirmação da responsável pelo produto. Essa origem não comprova generalização nem torna a hipótese validada. As pendências de evidência permanecem em [hipóteses](../research/insights-and-hypotheses.md) e [validação com usuários](../research/user-validation.md).

Esta fotografia deve ser revista quando novas evidências alterarem os estados. Direções de evolução estão no [roadmap](roadmap.md); capacidades detalhadas, no [índice funcional](features/README.md).
