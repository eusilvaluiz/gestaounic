import { TotalsData } from "@/types/marketing";
import { calculateFinanceMetrics, formatCurrency } from "@/utils/calculations";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Users, 
  ArrowDownRight
} from "lucide-react";

interface FinancePanelProps {
  totals: TotalsData;
}

export const FinancePanel = ({ totals }: FinancePanelProps) => {
  const metrics = calculateFinanceMetrics(totals);

  return (
    <div className="glass-effect rounded-xl p-6 animate-slide-up">
      <h3 className="text-lg font-semibold mb-6 text-foreground flex items-center gap-2">
        <Wallet className="w-5 h-5 text-primary" />
        Resumo Financeiro
      </h3>
      
      {/* Valores Automáticos (somente leitura) */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        <div className="space-y-2 min-w-0">
          <p className="text-xs text-muted-foreground">Investimento</p>
          <div className="flex items-center gap-2 min-w-0">
            <DollarSign className="w-4 h-4 text-destructive flex-shrink-0" />
            <span className="text-sm font-medium text-destructive truncate">
              {formatCurrency(metrics.investimento)}
            </span>
          </div>
        </div>
        
        <div className="space-y-2 min-w-0">
          <p className="text-xs text-muted-foreground">Depósito</p>
          <div className="flex items-center gap-2 min-w-0">
            <TrendingUp className="w-4 h-4 text-success flex-shrink-0" />
            <span className="text-sm font-medium text-success truncate">
              {formatCurrency(metrics.deposito)}
            </span>
          </div>
        </div>

        <div className="space-y-2 min-w-0">
          <p className="text-xs text-muted-foreground">Taxa (total)</p>
          <div className="flex items-center gap-2 min-w-0">
            <TrendingDown className="w-4 h-4 text-warning flex-shrink-0" />
            <span className="text-sm font-medium text-warning truncate">
              {formatCurrency(metrics.taxa)}
            </span>
          </div>
        </div>
        
        <div className="space-y-2 min-w-0">
          <p className="text-xs text-muted-foreground">Saque (total)</p>
          <div className="flex items-center gap-2 min-w-0">
            <ArrowDownRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-medium truncate">
              {formatCurrency(metrics.saque)}
            </span>
          </div>
        </div>
        
        <div className="space-y-2 min-w-0">
          <p className="text-xs text-muted-foreground">Expert (total)</p>
          <div className="flex items-center gap-2 min-w-0">
            <Users className="w-4 h-4 text-info flex-shrink-0" />
            <span className="text-sm font-medium text-info truncate">
              {formatCurrency(metrics.expert)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Métricas Calculadas */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 pt-4 border-t border-border">
        <div className="text-center p-3 rounded-lg bg-accent min-w-0">
          <p className="text-xs text-muted-foreground mb-1 truncate">Custo por FTD</p>
          <p className="text-sm font-bold text-info truncate">{formatCurrency(metrics.custoFtd)}</p>
        </div>
        
        <div className="text-center p-3 rounded-lg bg-accent min-w-0">
          <p className="text-xs text-muted-foreground mb-1 truncate">Ticket Médio FTD</p>
          <p className="text-sm font-bold text-info truncate">{formatCurrency(metrics.ticketMedioFtd)}</p>
        </div>
        
        <div className="text-center p-3 rounded-lg bg-accent min-w-0">
          <p className="text-xs text-muted-foreground mb-1 truncate">Ticket Médio Total</p>
          <p className="text-sm font-bold text-info truncate">{formatCurrency(metrics.ticketMedioTotal)}</p>
        </div>
        
        <div className="text-center p-3 rounded-lg bg-accent min-w-0">
          <p className="text-xs text-muted-foreground mb-1 truncate">ROI por Depósito</p>
          <p className={`text-sm font-bold truncate ${metrics.roiDeposito >= 1 ? 'text-success' : 'text-destructive'}`}>
            {metrics.roiDeposito.toFixed(2)}x
          </p>
        </div>
        
        <div className="text-center p-3 rounded-lg bg-accent min-w-0">
          <p className="text-xs text-muted-foreground mb-1 truncate">ROI Operação</p>
          <p className={`text-sm font-bold truncate ${metrics.roiOperacao >= 1 ? 'text-success' : 'text-destructive'}`}>
            {metrics.roiOperacao.toFixed(2)}x
          </p>
        </div>
        
        <div className="text-center p-3 rounded-lg bg-accent border border-success/30 min-w-0">
          <p className="text-xs text-muted-foreground mb-1 truncate">Lucro Líquido</p>
          <p className={`text-sm font-bold truncate ${metrics.lucroLiquido >= 0 ? 'text-success' : 'text-destructive'}`}>
            {formatCurrency(metrics.lucroLiquido)}
          </p>
        </div>
      </div>
    </div>
  );
};