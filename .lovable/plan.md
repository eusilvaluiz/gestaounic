

## Redesign da Tela de Comparacao de Periodos

### Problema atual
O layout atual empilha muitos `ComparisonCard` em grids densos, sem hierarquia visual clara. Os graficos de barras no final ficam repetitivos e nao agregam insight imediato. O resultado e uma pagina "achatada" e confusa.

### Proposta de redesign

A nova pagina sera organizada em secoes visuais claras com mais variedade de elementos graficos:

**1. Header (manter)** — Botao voltar + titulo + dois seletores de periodo (A e B) lado a lado.

**2. KPI Cards principais (7 blocos)** — Redesenhar o `ComparisonCard`:
- Layout mais limpo: valor A e valor B em destaque com badge de variacao percentual
- Barra de progresso horizontal colorida mostrando a proporcao A vs B visualmente
- Icone e titulo no topo, valores grandes embaixo
- Manter cores: azul (info) para A, laranja (warning) para B, verde/vermelho para variacao

**3. Secao "Metricas Consolidadas"** — Substituir o grid de cards por uma **tabela comparativa estilizada** dentro de um painel glass-effect:
- Colunas: Metrica | Periodo A | Periodo B | Variacao
- Linhas alternadas, badge colorido na variacao
- Mais compacto e legivel que 10 mini-cards

**4. Secao "Resumo Financeiro"** — Dois paineis lado a lado (A e B) no estilo do `FinancePanel` existente, com um **donut/pie chart** central mostrando a distribuicao (Investimento vs Deposito vs Lucro) para cada periodo. Usar `recharts` `PieChart` com `Cell` colorido.

**5. Secao "Funil de Conversao Comparativo"** — Substituir o bar chart por um **funil visual duplo** com barras horizontais empilhadas (A sobre B), cada etapa mostrando as duas barras com cores distintas e os valores/percentuais ao lado.

**6. Secao "Visao Geral" (grafico)** — Um unico **Radar Chart** (recharts) comparando as metricas normalizadas dos dois periodos, dando uma visao holistica de onde A supera B e vice-versa. Alternativa ao bar chart repetitivo.

### Arquivos a modificar

1. **`src/components/ComparisonCard.tsx`** — Redesenhar com barra de proporcao A/B e layout mais moderno
2. **`src/pages/Compare.tsx`** — Reestruturar layout:
   - Substituir grid de metricas consolidadas por tabela comparativa
   - Adicionar PieChart/DonutChart para resumo financeiro
   - Adicionar RadarChart para visao geral
   - Melhorar funil comparativo com barras duplas horizontais
3. **`src/components/ComparisonChart.tsx`** — Refatorar ou substituir pelo RadarChart

### Detalhes tecnicos
- Usa `PieChart`, `Pie`, `Cell`, `RadarChart`, `Radar`, `PolarGrid` do `recharts` (ja instalado)
- Mantem identidade visual dark com `glass-effect`, cores do tema (info, warning, success, destructive)
- Responsivo: em mobile as secoes empilham verticalmente

