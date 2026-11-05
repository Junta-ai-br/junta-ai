# Relatórios financeiros

## 1. Objetivo e benefício

Ajudar o usuário a analisar resultados financeiros por período e compartilhar uma visão das suas movimentações.

## 2. Descrição funcional

O usuário seleciona um período e gera uma apresentação de receitas, despesas, saldo, comparações e destaques, com opções de exportação.

## 3. Principais capacidades existentes

- Consultar períodos mensais, trimestrais, semestrais e anuais.
- Visualizar receitas, despesas e saldo do período.
- Comparar resultados com o período anterior.
- Explorar gráficos e destaques das movimentações.
- Exportar CSV, formato compatível com Excel e impressão para PDF.

## 4. Regras e comportamentos relevantes

O relatório corresponde ao período selecionado e aos dados disponíveis. A opção PDF utiliza a impressão do navegador, na qual o usuário pode salvar em PDF. A exportação compatível com Excel utiliza extensão `.xls`, não `.xlsx`.

## 5. Limitações e estados ainda não validados

A geração depende dos dados financeiros disponíveis. A saída PDF depende das opções de impressão do navegador. A existência dos recursos de exportação no código não comprova compatibilidade com todos os programas ou validação em produção. Não foram executados testes nesta revisão documental.

## 6. Estado atual

**Implementado** para seleção de períodos, análises e opções de exportação observadas.

[Voltar ao índice de funcionalidades](README.md).
