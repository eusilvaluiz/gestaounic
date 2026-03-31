import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface FinanceDonutChartProps {
  title: string;
  investimento: number;
  deposito: number;
  lucro: number;
  periodLabel: string;
  periodColor: string;
}

const COLORS = [
  "hsl(0 84% 60%)",    // investimento - destructive
  "hsl(142 76% 45%)",  // deposito - success
  "hsl(199 89% 48%)",  // lucro - info
];

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export const FinanceDonutChart = ({
  title,
  investimento,
  deposito,
  lucro,
  periodLabel,
  periodColor,
}: FinanceDonutChartProps) => {
  const data = [
    { name: "Investimento", value: Math.abs(investimento) },
    { name: "Depósito", value: Math.abs(deposito) },
    { name: "Lucro", value: Math.abs(lucro) },
  ].filter((d) => d.value > 0);

  return (
    <div className="glass-effect rounded-xl p-5 animate-slide-up">
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: periodColor }}
        />
        <h4 className="text-sm font-semibold text-foreground">{periodLabel}</h4>
      </div>
      <h3 className="text-xs font-medium text-muted-foreground mb-3">{title}</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(222 47% 8%)",
              border: "1px solid hsl(217 33% 17%)",
              borderRadius: "8px",
              color: "hsl(210 40% 98%)",
              fontSize: 12,
            }}
            itemStyle={{ color: "hsl(210 40% 98%)" }}
            labelStyle={{ color: "hsl(210 40% 98%)" }}
            formatter={(value: number, name: string) => {
              const colorMap: Record<string, string> = {
                "Investimento": COLORS[0],
                "Depósito": COLORS[1],
                "Lucro": COLORS[2],
              };
              return [formatCurrency(value), <span style={{ color: colorMap[name] || "hsl(210 40% 98%)" }}>{name}</span>];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, color: "hsl(210 40% 98%)" }}
            iconType="circle"
            iconSize={8}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Summary values */}
      <div className="grid grid-cols-3 gap-2 mt-2">
        {[
          { label: "Invest.", value: investimento, color: COLORS[0] },
          { label: "Depósito", value: deposito, color: COLORS[1] },
          { label: "Lucro", value: lucro, color: COLORS[2] },
        ].map((item) => (
          <div key={item.label} className="text-center">
            <p className="text-[10px] text-muted-foreground">{item.label}</p>
            <p className="text-xs font-bold text-foreground">{formatCurrency(item.value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
