

## Funcionalidade: Tela de Comparação de Períodos

### Resumo

Botao "Comparar" ao lado do filtro de Periodo no header. Ao clicar, navega para uma rota `/comparar` que exibe a comparacao lado a lado de dois periodos selecionados, com graficos e indicadores de melhora/piora. Botao "Voltar" retorna ao dashboard.

### Arquivos a criar/modificar

**1. Nova rota `/comparar` — `src/pages/Compare.tsx`**

Pagina dedicada com:
- Header com botao "Voltar ao Dashboard" e titulo "Comparacao de Periodos"
- Dois seletores de periodo (reutilizando a logica do `DateRangeFilter`) — "Periodo A" e "Periodo B", com as mesmas opcoes (Hoje, Ontem, Ultimos 7 dias, etc. + Personalizado)
- Carrega os dados do hook `useDailyData`, filtra por cada periodo, calcula totals/metrics para cada um
- Exibe a comparacao em secoes:

**Secao 1 — KPI Cards (os 7 blocos do topo)**
- Dois valores lado a lado (Periodo A vs Periodo B) + indicador de variacao percentual com seta verde (melhora) ou vermelha (piora)
- Mesmos 7 cards: Investimento, Cliques, Leads Telegram, Cadastros, FTD, Depositos, ROI

**Secao 2 — Metricas Consolidadas**
- Grid com as 10 metricas (CPC, CPV, Clique->LP, etc.), cada uma mostrando valor A, valor B e variacao

**Secao 3 — Resumo Financeiro**
- Mesmas metricas do `FinancePanel` mas em formato comparativo (A vs B + variacao)

**Secao 4 — Funil de Conversao Comparativo**
- Barras horizontais duplas (A vs B) para cada etapa do funil, usando cores diferentes para cada periodo

**Secao 5 — Graficos de Variacao**
- Bar chart (recharts) comparando as principais metricas lado a lado
- Cores distintas para Periodo A (azul) e Periodo B (verde)

**2. `src/components/ComparisonCard.tsx`**
- Componente reutilizavel que recebe `title`, `valueA`, `valueB`, `format` (currency/number/percent) e calcula a variacao percentual automaticamente
- Seta para cima verde = melhora, seta para baixo vermelha = piora
- Para metricas de custo (CPC, Custo Lead, etc.), a logica inverte: reducao = verde

**3. `src/components/ComparisonChart.tsx`**
- Bar chart com recharts mostrando metricas lado a lado
- Usa `ChartContainer` ja existente

**4. `src/App.tsx`**
- Adicionar rota `/comparar` apontando para `Compare`

**5. `src/pages/Index.tsx`**
- Adicionar botao "Comparar" ao lado do filtro de periodo, com `onClick={() => navigate("/comparar")`

### Detalhes tecnicos

- Reutiliza `useDailyData` para buscar todos os dados, filtra client-side por periodo A e B
- Reutiliza `calculateTotals`, `calculateFunnel`, `calculateFinanceMetrics` de `utils/calculations.ts`
- Usa `recharts` (ja instalado) para graficos comparativos via `BarChart` com duas `Bar` series
- Identidade visual: mesmos `glass-effect`, cores, fontes e layout do dashboard atual
- Nao altera banco de dados — tudo calculado no frontend a partir dos dados existentes

