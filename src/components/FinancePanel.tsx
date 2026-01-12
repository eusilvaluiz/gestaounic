import { FinanceData, TotalsData } from "@/types/marketing";
import { calculateFinanceMetrics, formatCurrency } from "@/utils/calculations";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Users, 
  ArrowDownRight
} from "lucide-react";

interface FinancePanelProps {
  finance: FinanceData;
  totals: TotalsData;
  onFinanceChange: (finance: FinanceData) => void;
}

export const FinancePanel = ({ finance, totals, onFinanceChange }: FinancePanelProps) => {
  const metrics = calculateFinanceMetrics(totals, finance);

  const handleChange = (field: keyof FinanceData, value: string) => {
    const numValue = parseFloat(value.replace(",", ".")) || 0;
    onFinanceChange({ ...finance, [field]: numValue });
  };

  return (
    <div className="glass-effect rounded-xl p-6 animate-slide-up">
      <h3 className="text-lg font-semibold mb-6 text-foreground flex items-center gap-2">
        <Wallet className="w-5 h-5 text-primary" />
        Resumo Financeiro
      </h3>
      
      {/* Valores Automáticos (somente leitura) */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Investimento (auto)</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive" />
            <div className="pl-9 h-10 bg-muted/50 border border-border rounded-md flex items-center text-sm font-medium text-destructive">
              {formatCurrency(metrics.investimento)}
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Depósito (auto)</Label>
          <div className="relative">
            <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-success" />
            <div className="pl-9 h-10 bg-muted/50 border border-border rounded-md flex items-center text-sm font-medium text-success">
              {formatCurrency(metrics.deposito)}
            </div>
          </div>
        </div>
      </div>

      {/* Campos Editáveis */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Taxa</Label>
          <div className="relative">
            <TrendingDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warning" />
            <Input
              type="number"
              value={finance.taxa || ""}
              onChange={(e) => handleChange("taxa", e.target.value)}
              className="pl-9 h-10 bg-accent border-border"
              placeholder="0,00"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Saque</Label>
          <div className="relative">
            <ArrowDownRight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="number"
              value={finance.saque || ""}
              onChange={(e) => handleChange("saque", e.target.value)}
              className="pl-9 h-10 bg-accent border-border"
              placeholder="0,00"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Expert</Label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-info" />
            <Input
              type="number"
              value={finance.expert || ""}
              onChange={(e) => handleChange("expert", e.target.value)}
              className="pl-9 h-10 bg-accent border-border"
              placeholder="0,00"
            />
          </div>
        </div>
      </div>
      
      {/* Métricas Calculadas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 pt-4 border-t border-border">
        <div className="text-center p-3 rounded-lg bg-accent">
          <p className="text-xs text-muted-foreground mb-1">Custo por FTD</p>
          <p className="text-sm font-bold text-info">{formatCurrency(metrics.custoFtd)}</p>
        </div>
        
        <div className="text-center p-3 rounded-lg bg-accent">
          <p className="text-xs text-muted-foreground mb-1">Ticket Médio FTD</p>
          <p className="text-sm font-bold text-info">{formatCurrency(metrics.ticketMedioFtd)}</p>
        </div>
        
        <div className="text-center p-3 rounded-lg bg-accent">
          <p className="text-xs text-muted-foreground mb-1">Ticket Médio Total</p>
          <p className="text-sm font-bold text-info">{formatCurrency(metrics.ticketMedioTotal)}</p>
        </div>
        
        <div className="text-center p-3 rounded-lg bg-accent">
          <p className="text-xs text-muted-foreground mb-1">ROI por Depósito</p>
          <p className={`text-sm font-bold ${metrics.roiDeposito >= 1 ? 'text-success' : 'text-destructive'}`}>
            {metrics.roiDeposito.toFixed(2)}x
          </p>
        </div>
        
        <div className="text-center p-3 rounded-lg bg-accent">
          <p className="text-xs text-muted-foreground mb-1">ROI Operação</p>
          <p className={`text-sm font-bold ${metrics.roiOperacao >= 1 ? 'text-success' : 'text-destructive'}`}>
            {metrics.roiOperacao.toFixed(2)}x
          </p>
        </div>
        
        <div className="text-center p-3 rounded-lg bg-accent border border-success/30">
          <p className="text-xs text-muted-foreground mb-1">Lucro Líquido</p>
          <p className={`text-sm font-bold ${metrics.lucroLiquido >= 0 ? 'text-success' : 'text-destructive'}`}>
            {formatCurrency(metrics.lucroLiquido)}
          </p>
        </div>
      </div>
    </div>
  );
};
