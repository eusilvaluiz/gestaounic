import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ComparisonChartProps {
  data: { name: string; periodoA: number; periodoB: number }[];
  title: string;
  formatValue?: (v: number) => string;
}

export const ComparisonChart = ({ data, title, formatValue }: ComparisonChartProps) => {
  const formatter = formatValue || ((v: number) => v.toLocaleString("pt-BR"));

  return (
    <div className="glass-effect rounded-xl p-6 animate-slide-up">
      <h3 className="text-lg font-semibold mb-4 text-foreground">{title}</h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" />
          <XAxis
            dataKey="name"
            tick={{ fill: "hsl(215 20% 65%)", fontSize: 11 }}
            axisLine={{ stroke: "hsl(217 33% 17%)" }}
          />
          <YAxis
            tick={{ fill: "hsl(215 20% 65%)", fontSize: 11 }}
            axisLine={{ stroke: "hsl(217 33% 17%)" }}
            tickFormatter={formatter}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(222 47% 8%)",
              border: "1px solid hsl(217 33% 17%)",
              borderRadius: "8px",
              color: "hsl(210 40% 98%)",
            }}
            formatter={(value: number) => formatter(value)}
          />
          <Legend
            wrapperStyle={{ color: "hsl(210 40% 98%)", fontSize: 12 }}
          />
          <Bar dataKey="periodoA" name="Período A" fill="hsl(199 89% 48%)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="periodoB" name="Período B" fill="hsl(38 92% 50%)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
