import { useMemo } from "react";
import { calculateTotals, calculateFunnel, formatCurrency, formatNumber, formatPercent } from "@/utils/calculations";
import { MetricCard } from "@/components/MetricCard";
import { FunnelChart } from "@/components/FunnelChart";
import { DataTable } from "@/components/DataTable";
import { FinancePanel } from "@/components/FinancePanel";
import { useDailyData } from "@/hooks/useDailyData";
import { useFinanceData } from "@/hooks/useFinanceData";
import { 
  DollarSign, 
  MousePointer, 
  Users, 
  Target,
  TrendingUp,
  BarChart3,
  Percent
} from "lucide-react";

const Index = () => {
  const { 
    data, 
    setData, 
    isLoading: isLoadingData, 
    isSaving: isSavingData,
    addRow,
    deleteRow 
  } = useDailyData();
  
  const { 
    finance, 
    setFinance, 
    isLoading: isLoadingFinance 
  } = useFinanceData();

  const totals = useMemo(() => calculateTotals(data), [data]);
  const funnelData = useMemo(() => calculateFunnel(totals), [totals]);

  const totalMetrics = useMemo(() => {
    const cpcTotal = totals.cliques > 0 ? totals.investimento / totals.cliques : 0;
    const cpvTotal = totals.landingPage > 0 ? totals.investimento / totals.landingPage : 0;
    const cliqueLpTotal = totals.cliques > 0 ? (totals.landingPage / totals.cliques) * 100 : 0;
    const retencaoTotal = totals.leadTelegram > 0 
      ? ((totals.leadTelegram - totals.saidaTelegram) / totals.leadTelegram) * 100 
      : 0;
    const custoLeadTotal = totals.leadTelegram > 0 ? totals.investimento / totals.leadTelegram : 0;
    const lpTelegramTotal = totals.landingPage > 0 ? (totals.leadTelegram / totals.landingPage) * 100 : 0;
    const custoCadastroTotal = totals.cadastros > 0 ? totals.investimento / totals.cadastros : 0;
    const leadCadastroTotal = totals.leadTelegram > 0 ? (totals.cadastros / totals.leadTelegram) * 100 : 0;
    const custoFtdTotal = totals.ftd > 0 ? totals.investimento / totals.ftd : 0;
    const cadastroFtdTotal = totals.cadastros > 0 ? (totals.ftd / totals.cadastros) * 100 : 0;
    const roiTotal = totals.investimento > 0 ? totals.valorDepositos / totals.investimento : 0;

    return {
      cpcTotal,
      cpvTotal,
      cliqueLpTotal,
      retencaoTotal,
      custoLeadTotal,
      lpTelegramTotal,
      custoCadastroTotal,
      leadCadastroTotal,
      custoFtdTotal,
      cadastroFtdTotal,
      roiTotal
    };
  }, [totals]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              Dashboard de Performance
            </h1>
            <p className="text-muted-foreground mt-1">
              Análise de métricas e conversões de marketing digital
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent">
            <span className="text-sm text-muted-foreground">Período:</span>
            <span className="font-semibold text-foreground">Julho 2024</span>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <MetricCard
            title="Investimento"
            value={formatCurrency(totals.investimento)}
            icon={<DollarSign className="w-5 h-5" />}
            variant="danger"
          />
          <MetricCard
            title="Cliques"
            value={formatNumber(totals.cliques)}
            icon={<MousePointer className="w-5 h-5" />}
            variant="info"
            subtitle={`CPC: ${formatCurrency(totalMetrics.cpcTotal)}`}
          />
          <MetricCard
            title="Leads Telegram"
            value={formatNumber(totals.leadTelegram)}
            icon={<Users className="w-5 h-5" />}
            variant="warning"
            subtitle={`Custo: ${formatCurrency(totalMetrics.custoLeadTotal)}`}
          />
          <MetricCard
            title="Cadastros"
            value={formatNumber(totals.cadastros)}
            icon={<Target className="w-5 h-5" />}
            variant="info"
            subtitle={`Custo: ${formatCurrency(totalMetrics.custoCadastroTotal)}`}
          />
          <MetricCard
            title="FTD"
            value={formatNumber(totals.ftd)}
            icon={<BarChart3 className="w-5 h-5" />}
            variant="success"
            subtitle={`Custo: ${formatCurrency(totalMetrics.custoFtdTotal)}`}
          />
          <MetricCard
            title="Depósitos"
            value={formatCurrency(totals.valorDepositos)}
            icon={<TrendingUp className="w-5 h-5" />}
            variant="success"
          />
          <MetricCard
            title="ROI"
            value={`${totalMetrics.roiTotal.toFixed(2)}x`}
            icon={<Percent className="w-5 h-5" />}
            variant={totalMetrics.roiTotal >= 1 ? "success" : "danger"}
          />
        </div>

        {/* Funnel and Finance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FunnelChart data={funnelData} />
          <FinancePanel 
            finance={finance} 
            totals={totals}
            onFinanceChange={setFinance} 
          />
        </div>

        {/* Totals Row */}
        <div className="glass-effect rounded-xl p-4">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Métricas Consolidadas</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-3">
            <div className="text-center p-2 rounded-lg bg-accent">
              <p className="text-[10px] text-muted-foreground mb-1">CPC</p>
              <p className="text-xs font-bold text-info">{formatCurrency(totalMetrics.cpcTotal)}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-accent">
              <p className="text-[10px] text-muted-foreground mb-1">CPV</p>
              <p className="text-xs font-bold text-info">{formatCurrency(totalMetrics.cpvTotal)}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-accent">
              <p className="text-[10px] text-muted-foreground mb-1">Clique→LP</p>
              <p className="text-xs font-bold text-warning">{formatPercent(totalMetrics.cliqueLpTotal)}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-accent">
              <p className="text-[10px] text-muted-foreground mb-1">Retenção TG</p>
              <p className="text-xs font-bold text-warning">{formatPercent(totalMetrics.retencaoTotal)}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-accent">
              <p className="text-[10px] text-muted-foreground mb-1">Custo Lead</p>
              <p className="text-xs font-bold text-info">{formatCurrency(totalMetrics.custoLeadTotal)}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-accent">
              <p className="text-[10px] text-muted-foreground mb-1">LP→Telegram</p>
              <p className="text-xs font-bold text-warning">{formatPercent(totalMetrics.lpTelegramTotal)}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-accent">
              <p className="text-[10px] text-muted-foreground mb-1">Custo Cadastro</p>
              <p className="text-xs font-bold text-info">{formatCurrency(totalMetrics.custoCadastroTotal)}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-accent">
              <p className="text-[10px] text-muted-foreground mb-1">Lead→Cadastro</p>
              <p className="text-xs font-bold text-warning">{formatPercent(totalMetrics.leadCadastroTotal)}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-accent">
              <p className="text-[10px] text-muted-foreground mb-1">Custo FTD</p>
              <p className="text-xs font-bold text-info">{formatCurrency(totalMetrics.custoFtdTotal)}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-accent">
              <p className="text-[10px] text-muted-foreground mb-1">Cadastro→FTD</p>
              <p className="text-xs font-bold text-warning">{formatPercent(totalMetrics.cadastroFtdTotal)}</p>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <DataTable 
          data={data} 
          onDataChange={setData}
          onAddRow={addRow}
          onDeleteRow={deleteRow}
          isLoading={isLoadingData}
          isSaving={isSavingData}
        />
      </div>
    </div>
  );
};

export default Index;
