# Visão do mês e Dashboard — documentação técnica

**Revisão:** 08/11/2026 · **Rotas:** `/visao-mes`, `/dashboard` · **Arquivos:** `pages/VisaoMes/VisaoMes.jsx`, `pages/VisaoMes/DateRangeFilter.jsx`, `pages/Dashboard/Dashboard.jsx`

## 1. Visão do mês (`/visao-mes`)

- **Filtro de período:** Este mês, Mês passado, Últimos 3 meses ou datas livres. O início não pode ser depois do fim.
- **Indicadores:** Receitas, Despesas, Saldo do período (vermelho quando negativo) e número de categorias.
- **Abas:** Visão geral (pizza e barras por categoria), Histórico (linha mês a mês), Transações (lista com filtro por categoria, editar e excluir), Entradas e saídas (barras por mês) e Categorias (criar, editar, apagar).
- **Escala dos gráficos:** os gráficos recebem só uma escala relativa de 0 a 100% do maior valor. Tooltips e listas mostram o valor exato em reais.

## 2. Dashboard (`/dashboard`)

Reaproveita o componente da Visão do mês com `variant="all"`. A diferença é o card Guardado entre os indicadores e um bloco "Converse com o Assistente" que leva ao chat.

## 3. Regras de negócio

### Lançamentos

- Cada lançamento é uma receita (`INCOME`) ou uma despesa (`EXPENSE`), com valor sempre positivo e no máximo 2 casas decimais. O sinal vem do tipo, nunca do valor.
- Receitas, despesas e saldo do período são somas exatas: saldo = receitas − despesas.
- A categoria do lançamento precisa pertencer ao usuário. Uma categoria de outra pessoa é recusada como se não existisse.
- Lançamentos são criados, editados e excluídos pelo botão "+ Lançamento" e pela aba Transações, ou pelo chat do Assistente.

### Categorias

- O nome da categoria é único por usuário.
- Uma categoria com lançamentos não pode ser apagada: "Mova ou apague as transações antes de removê-la."
- O percentual de cada categoria é o gasto dela dividido pelo total de despesas do período, com 1 casa decimal. Só entram categorias com gasto maior que zero.

### Período e completude dos dados

- Os lançamentos chegam paginados, 100 por página, com limite de 1.000 páginas e 100.000 registros. Se a carga não termina inteira, a tela mostra "Indisponível" em vez de um total parcial.
- Se uma gravação pode já ter sido processada sem confirmação, a tela pede para atualizar a consulta antes de outra gravação.

## 4. Fontes de dados

| Dado | Endpoint |
|---|---|
| Lançamentos do período | `GET /transactions?from=&to=&page=&size=100` |
| Categorias | `GET /categories` |
| Criar / editar / excluir | `POST`, `PUT`, `DELETE` em `/transactions` e `/categories` |
| Guardado (Dashboard) | `GET /dashboard` |

## 5. Decisões e escala

- **Dashboard reaproveita a Visão do mês:** uma tela a menos para manter; muda só o `variant`.
- **Gráficos com escala relativa:** o Recharts trabalha com `Number`; os valores monetários exatos ficam em `BigInt` nos tooltips e listas.
- **Somas no navegador:** a tela baixa todos os lançamentos do período. Para períodos longos de usuários muito ativos, endpoints de agregação no backend reduziriam o tráfego. O campo `categoryBreakdown` do `DashboardResponse` já existe, mas volta vazio.
- **Estilos:** `DateRangeFilter.jsx` usa cores fixas (por exemplo `#7c3aed`) em vez dos tokens do design system.

## 6. Testes

`pages/VisaoMes/VisaoMes.test.jsx` (4 casos) e `pages/Dashboard/Dashboard.test.jsx` (1 caso).

[Voltar ao índice técnico](tecnico-visao-geral.md).
