import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface RadarDataItem {
  metric: string;
  periodoA: number;
  periodoB: number;
}

interface ComparisonRadarChartProps {
  data: RadarDataItem[];
  title: string;
}

export const ComparisonRadarChart = ({ data, title }: ComparisonRadarChartProps) => {
  // Normalize values to 0-100 scale for radar
  const maxValues = data.map((d) => Math.max(d.periodoA, d.periodoB, 1));
  const normalized = data.map((d, i) => ({
    metric: d.metric,
    "Período A": (d.periodoA / maxValues[i]) * 100,
    "Período B": (d.periodoB / maxValues[i]) * 100,
  }));

  return (
    <div className="glass-effect rounded-xl p-6 animate-slide-up">
      <h3 className="text-lg font-semibold mb-4 text-foreground">{title}</h3>
      <ResponsiveContainer width="100%" height={350}>
        <RadarChart data={normalized} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="hsl(217 33% 17%)" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: "hsl(215 20% 65%)", fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name="Período A"
            dataKey="Período A"
            stroke="hsl(199 89% 48%)"
            fill="hsl(199 89% 48%)"
            fillOpacity={0.25}
            strokeWidth={2}
          />
          <Radar
            name="Período B"
            dataKey="Período B"
            stroke="hsl(38 92% 50%)"
            fill="hsl(38 92% 50%)"
            fillOpacity={0.15}
            strokeWidth={2}
          />
          <Legend wrapperStyle={{ color: "hsl(210 40% 98%)", fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(222 47% 8%)",
              border: "1px solid hsl(217 33% 17%)",
              borderRadius: "8px",
              color: "hsl(210 40% 98%)",
            }}
            formatter={(value: number) => `${value.toFixed(0)}%`}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
