# Relatórios — documentação técnica

**Revisão:** 08/11/2026 · **Rota:** `/relatorios` · **Arquivos:** `pages/Relatorios/Relatorios.jsx`, `report-data.js`, `report-utils.js`, `utils/report-exporters.js`

## 1. Regras de negócio

- **Períodos:** Mensal, Trimestral, Semestral ou Anual, a partir do mês escolhido. O anual sempre começa em janeiro.
- **Comparação:** cada valor é comparado ao período anterior de mesmo tamanho. Variação = (atual − anterior) ÷ anterior × 100, com 1 casa. Sem valor anterior, mostra +100% (ou 0% se o atual também for zero).
- **Gráfico semanal:** o mês é dividido em semanas de 7 dias pelo dia do mês (1–7, 8–14, 15–21, 22–28 e 29 em diante). Só aparecem semanas com movimento.
- **Destaques:** maior receita, maior despesa e total de lançamentos (entradas e saídas).
- **Exportação:** CSV, Excel e PDF com o resumo e as variações.
- **Limite:** se a soma dos valores absolutos passar de R$ 9.999.999.999,99, o relatório não é gerado, para não perder centavos na conversão para gráfico.

## 2. Como os dados são carregados

1. `getPeriodRange` calcula o período escolhido e `getPreviousRange`, o anterior de mesmo tamanho.
2. `loadTransactionPages` baixa, de uma vez, todos os lançamentos do início do período anterior ao fim do atual, em páginas de 100 (até 100.000 registros).
3. `buildReport` soma em centavos exatos (`BigInt`) e só depois converte para `Number`, usado nos gráficos e nas exportações.
4. Se a sessão muda durante a carga, o resultado é descartado.

## 3. Exportação

| Formato | Como é gerado |
|---|---|
| CSV | Texto montado no navegador e baixado como arquivo |
| Excel | Tabela HTML salva como `.xls` |
| PDF | Janela de impressão do navegador com o relatório formatado |

Não há biblioteca externa de exportação: menos dependências e um bundle menor.

## 4. Mensagens de erro

| Situação | Mensagem |
|---|---|
| Sessão expirada ou trocada | "Sessão expirada ou alterada. Entre novamente." |
| HTTP 403 | "Você não tem permissão para consultar estas movimentações." |
| Valores acima do limite | "Os valores do período excedem o limite seguro para gerar o relatório." |
| Outras falhas | "Não foi possível carregar todas as movimentações. Tente novamente." |

## 5. Testes e escala

São 26 casos em 3 arquivos (`Relatorios.test.jsx`, `Relatorios.integration.test.jsx`, `report-utils.test.js`). Um relatório anual de um usuário muito ativo faz muitas requisições; um endpoint de agregação no backend resolveria.

[Voltar ao índice técnico](tecnico-visao-geral.md).
