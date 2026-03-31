import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { ReactNode } from "react";
import { PieChart, Pie, Cell } from "recharts";

type FormatType = "currency" | "number" | "percent" | "multiplier";

interface ComparisonCardProps {
  title: string;
  valueA: number;
  valueB: number;
  format: FormatType;
  icon?: ReactNode;
  invertLogic?: boolean;
}

const formatValue = (value: number, format: FormatType): string => {
  if (isNaN(value) || !isFinite(value)) {
    if (format === "currency") return "R$ 0,00";
    if (format === "percent") return "0,00%";
    if (format === "multiplier") return "0,00x";
    return "0";
  }
  switch (format) {
    case "currency":
      return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
    case "number":
      return new Intl.NumberFormat("pt-BR").format(value);
    case "percent":
      return `${value.toFixed(2).replace(".", ",")}%`;
    case "multiplier":
      return `${value.toFixed(2)}x`;
  }
};

// Variation: how B compares to A. If B < A → negative (decrease)
const calcVariation = (a: number, b: number): number | null => {
  if (a === 0) return b === 0 ? 0 : null;
  return ((b - a) / Math.abs(a)) * 100;
};

const COLORS = ["hsl(199 89% 48%)", "hsl(38 92% 50%)"];

export const ComparisonCard = ({
  title,
  valueA,
  valueB,
  format,
  icon,
  invertLogic = false,
}: ComparisonCardProps) => {
  const variation = calcVariation(valueA, valueB);
  const isPositive = variation !== null && variation > 0;
  const isNegative = variation !== null && variation < 0;
  const isNeutral = variation === null || variation === 0;
  const isGood = invertLogic ? isNegative : isPositive;
  const isBad = invertLogic ? isPositive : isNegative;

  const pieData = [
    { name: "A", value: Math.abs(valueA) || 0.01 },
    { name: "B", value: Math.abs(valueB) || 0.01 },
  ];

  return (
    <div className="glass-effect rounded-xl p-4 animate-slide-up flex flex-col items-center gap-2">
      {/* Header */}
      <div className="flex items-center gap-1.5 w-full">
        {icon && <div className="text-muted-foreground">{icon}</div>}
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider truncate">{title}</p>
      </div>

      {/* Donut chart */}
      <div className="relative w-[100px] h-[100px]">
        <PieChart width={100} height={100}>
          <Pie
            data={pieData}
            cx={45}
            cy={45}
            innerRadius={28}
            outerRadius={42}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {pieData.map((_, index) => (
              <Cell key={index} fill={COLORS[index]} />
            ))}
          </Pie>
        </PieChart>
        {/* Variation in center - clean */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={cn(
            "flex flex-col items-center",
            isGood && "text-success",
            isBad && "text-destructive",
            isNeutral && "text-muted-foreground"
          )}>
            {isPositive && <ArrowUp className="w-3 h-3" />}
            {isNegative && <ArrowDown className="w-3 h-3" />}
            {isNeutral && <Minus className="w-3 h-3" />}
          </div>
        </div>
      </div>

      {/* Variation badge */}
      <div
        className={cn(
          "text-[11px] font-bold rounded-full px-2 py-0.5",
          isGood && "text-success bg-success/15",
          isBad && "text-destructive bg-destructive/15",
          isNeutral && "text-muted-foreground bg-muted"
        )}
      >
        {variation !== null
          ? `${variation > 0 ? "+" : ""}${variation.toFixed(1).replace(".", ",")}%`
          : "N/A"}
      </div>

      {/* Values */}
      <div className="grid grid-cols-2 gap-2 w-full text-center">
        <div>
          <p className="text-[9px] text-info font-semibold">Período A</p>
          <p className="text-xs font-bold text-foreground">{formatValue(valueA, format)}</p>
        </div>
        <div>
          <p className="text-[9px] text-warning font-semibold">Período B</p>
          <p className="text-xs font-bold text-foreground">{formatValue(valueB, format)}</p>
        </div>
      </div>
    </div>
  );
};
