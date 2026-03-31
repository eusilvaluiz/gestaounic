import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { ReactNode } from "react";

type FormatType = "currency" | "number" | "percent" | "multiplier";

interface ComparisonCardProps {
  title: string;
  valueA: number;
  valueB: number;
  format: FormatType;
  icon?: ReactNode;
  invertLogic?: boolean; // true for cost metrics (lower is better)
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

const calcVariation = (a: number, b: number): number | null => {
  if (b === 0) return a === 0 ? 0 : null;
  return ((a - b) / Math.abs(b)) * 100;
};

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

  // Determine color: for cost metrics, decrease (negative variation) is good
  const isGood = invertLogic ? isNegative : isPositive;
  const isBad = invertLogic ? isPositive : isNegative;

  return (
    <div className="glass-effect rounded-xl p-4 animate-slide-up">
      <div className="flex items-center gap-2 mb-3">
        {icon && <div className="text-muted-foreground">{icon}</div>}
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-[10px] text-muted-foreground mb-0.5">Período A</p>
          <p className="text-sm font-bold text-info">{formatValue(valueA, format)}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground mb-0.5">Período B</p>
          <p className="text-sm font-bold text-warning">{formatValue(valueB, format)}</p>
        </div>
      </div>
      <div
        className={cn(
          "flex items-center gap-1 text-xs font-semibold rounded-md px-2 py-1 w-fit",
          isGood && "text-success bg-success/10",
          isBad && "text-destructive bg-destructive/10",
          isNeutral && "text-muted-foreground bg-accent"
        )}
      >
        {isPositive && <ArrowUp className="w-3 h-3" />}
        {isNegative && <ArrowDown className="w-3 h-3" />}
        {isNeutral && <Minus className="w-3 h-3" />}
        <span>
          {variation !== null
            ? `${variation > 0 ? "+" : ""}${variation.toFixed(1).replace(".", ",")}%`
            : "N/A"}
        </span>
      </div>
    </div>
  );
};
