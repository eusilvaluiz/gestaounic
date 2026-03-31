import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type FormatType = "currency" | "number" | "percent" | "multiplier";

interface MetricRow {
  label: string;
  valueA: number;
  valueB: number;
  format: FormatType;
  invertLogic?: boolean;
}

interface ComparisonTableProps {
  title: string;
  rows: MetricRow[];
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

export const ComparisonTable = ({ title, rows }: ComparisonTableProps) => {
  return (
    <div className="glass-effect rounded-xl p-6 animate-slide-up">
      <h3 className="text-lg font-semibold mb-4 text-foreground">{title}</h3>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-muted-foreground text-xs font-semibold uppercase">Métrica</TableHead>
              <TableHead className="text-info text-xs font-semibold uppercase text-right">Período A</TableHead>
              <TableHead className="text-warning text-xs font-semibold uppercase text-right">Período B</TableHead>
              <TableHead className="text-muted-foreground text-xs font-semibold uppercase text-right">Variação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => {
              const variation = calcVariation(row.valueA, row.valueB);
              const isPositive = variation !== null && variation > 0;
              const isNegative = variation !== null && variation < 0;
              const isNeutral = variation === null || variation === 0;
              const isGood = row.invertLogic ? isNegative : isPositive;
              const isBad = row.invertLogic ? isPositive : isNegative;

              return (
                <TableRow
                  key={row.label}
                  className={cn(
                    "border-border/30 hover:bg-accent/30",
                    index % 2 === 0 && "bg-accent/10"
                  )}
                >
                  <TableCell className="text-sm font-medium text-foreground">{row.label}</TableCell>
                  <TableCell className="text-sm text-right font-semibold text-foreground">
                    {formatValue(row.valueA, row.format)}
                  </TableCell>
                  <TableCell className="text-sm text-right font-semibold text-foreground">
                    {formatValue(row.valueB, row.format)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-xs font-bold rounded-full px-2.5 py-0.5",
                        isGood && "text-success bg-success/15",
                        isBad && "text-destructive bg-destructive/15",
                        isNeutral && "text-muted-foreground bg-muted"
                      )}
                    >
                      {isPositive && <ArrowUp className="w-3 h-3" />}
                      {isNegative && <ArrowDown className="w-3 h-3" />}
                      {isNeutral && <Minus className="w-3 h-3" />}
                      {variation !== null
                        ? `${variation > 0 ? "+" : ""}${variation.toFixed(1).replace(".", ",")}%`
                        : "N/A"}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
