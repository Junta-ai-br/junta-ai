# Guia da documentação — Junta.ai

**Revisão documental:** 05/11/2026.

Este guia orienta a leitura e a manutenção da documentação pública. A lista completa está no [índice geral](README-Docs.md).

## Ordem recomendada de leitura

1. Comece pela [visão geral do produto](product/overview.md), que distingue o MVP atual das capacidades futuras.
2. Consulte a [jornada do usuário](product/user-journey.md) para separar a experiência desejada dos fluxos implementados.
3. Leia a [visão geral de IA](ai/ai-overview.md) e a [visão geral de segurança](security/sec-01-overview.md) para compreender responsabilidades e limites de validação.
4. Use a [orientação de pesquisa](research/README-research.md) para interpretar evidências, insights, hipóteses e resultados pendentes.
5. Para contribuir, consulte o [Design System](design-system/ds-01-overview.md) e o [guia de desenvolvimento](team/guia-de-desenvolvimento.md).

Produto e UX podem aprofundar visão, filosofia, princípios e pesquisa pelo índice. Desenvolvimento e IA devem combinar esse contexto com o código e os contratos aplicáveis, sem presumir que uma descrição de arquitetura comprova execução em produção.

## Como interpretar os estados

- **Visão ou planejado:** intenção de produto ou capacidade futura.
- **Implementado:** existe evidência no código; pode depender de configuração e integração.
- **Validado por testes:** exige resultados registrados, com revisão e escopo identificados. A existência de um teste não comprova aprovação.
- **Validado em ambiente implantado:** exige evidência do ambiente e do fluxo exercitado; não se deduz de testes locais ou demonstrações visuais.
- **Experimental:** implementação ou contrato em avaliação, sem aprovação produtiva presumida.

## Convenções de manutenção

- Mantenha cada documento focado em seu assunto e prefira links a conteúdo duplicado.
- Use links Markdown relativos para arquivos públicos existentes; confira os destinos na main antes de anunciá-los como disponíveis.
- Não publique links para materiais restritos, segredos ou detalhes operacionais internos.
- Diferencie fatos observados, interpretações e hipóteses. Registre evidências e limitações.
- Atualize versão e data somente dos documentos alterados. Preserve o histórico anterior e use a data real da revisão.
- Registre alterações relevantes no histórico do próprio documento, quando houver; não dependa de arquivos de decisões ou changelogs inexistentes.
- Trate documentos em branches não integradas como pendências, não como parte da documentação publicada.

O README principal apresenta o projeto. O índice organiza a navegação pública; este guia explica como ler e manter os documentos, sem substituir o README ou os guias de cada área.
