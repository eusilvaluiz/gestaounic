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

  const isGood = invertLogic ? isNegative : isPositive;
  const isBad = invertLogic ? isPositive : isNegative;

  // Proportion bar
  const total = Math.abs(valueA) + Math.abs(valueB);
  const ratioA = total > 0 ? (Math.abs(valueA) / total) * 100 : 50;

  return (
    <div className="glass-effect rounded-xl p-5 animate-slide-up flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <div className="text-muted-foreground">{icon}</div>}
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
        </div>
        <div
          className={cn(
            "flex items-center gap-1 text-[11px] font-bold rounded-full px-2.5 py-0.5",
            isGood && "text-success bg-success/15",
            isBad && "text-destructive bg-destructive/15",
            isNeutral && "text-muted-foreground bg-muted"
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

      {/* Values */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] text-info font-semibold mb-0.5">Período A</p>
          <p className="text-base font-bold text-foreground">{formatValue(valueA, format)}</p>
        </div>
        <div>
          <p className="text-[10px] text-warning font-semibold mb-0.5">Período B</p>
          <p className="text-base font-bold text-foreground">{formatValue(valueB, format)}</p>
        </div>
      </div>

      {/* Proportion bar */}
      <div className="w-full h-2 rounded-full bg-muted overflow-hidden flex">
        <div
          className="h-full rounded-l-full transition-all duration-500"
          style={{
            width: `${ratioA}%`,
            backgroundColor: "hsl(199 89% 48%)",
          }}
        />
        <div
          className="h-full rounded-r-full transition-all duration-500"
          style={{
            width: `${100 - ratioA}%`,
            backgroundColor: "hsl(38 92% 50%)",
          }}
        />
      </div>
    </div>
  );
};
