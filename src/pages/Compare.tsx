import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useDailyData } from "@/hooks/useDailyData";
import { DateRangeFilter, DateRangeOption, DateRange, getDateRangeFromOption } from "@/components/DateRangeFilter";
import { ComparisonCard } from "@/components/ComparisonCard";
import { ComparisonTable } from "@/components/ComparisonTable";
import { ComparisonRadarChart } from "@/components/ComparisonChart";
import { ComparisonFunnel } from "@/components/ComparisonFunnel";
import { FinanceDonutChart } from "@/components/FinanceDonutChart";
import { calculateTotals, calculateFunnel, calculateFinanceMetrics } from "@/utils/calculations";
import { DailyData } from "@/types/marketing";
import { parse, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  DollarSign,
  MousePointer,
  Users,
  Target,
  TrendingUp,
  BarChart3,
  Percent,
  Loader2,
} from "lucide-react";

const isCompleteDateString = (dateStr: string): boolean => {
  if (!dateStr || dateStr.trim() === "") return false;
  return /^\d{2}\/\d{2}\/(\d{2}|\d{4})$/.test(dateStr.trim());
};

const parseDailyDate = (dateStr: string): Date => {
  try {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      if (parts[2].length === 2) return parse(dateStr, "dd/MM/yy", new Date());
      if (parts[2].length === 4) return parse(dateStr, "dd/MM/yyyy", new Date());
      return new Date(NaN);
    }
    if (parts.length === 2 && /^\d{2}$/.test(parts[0]) && /^\d{2}$/.test(parts[1])) {
      return parse(`${dateStr}/${new Date().getFullYear()}`, "dd/MM/yyyy", new Date());
    }
    return new Date(NaN);
  } catch {
    return new Date(NaN);
  }
};

const filterByRange = (data: DailyData[], range: DateRange): DailyData[] =>
  data.filter((row) => {
    if (!isCompleteDateString(row.data)) return false;
    try {
      const d = parseDailyDate(row.data);
      if (isNaN(d.getTime())) return false;
      return isWithinInterval(d, { start: startOfDay(range.from), end: endOfDay(range.to) });
    } catch {
      return false;
    }
  });

function calcDerived(t: ReturnType<typeof calculateTotals>) {
  const sd = (a: number, b: number) => (b === 0 ? 0 : a / b);
  return {
    cpc: sd(t.investimento, t.cliques),
    cpv: sd(t.investimento, t.landingPage),
    cliqueLp: t.cliques > 0 ? (t.landingPage / t.cliques) * 100 : 0,
    retencao: t.leadTelegram > 0 ? ((t.leadTelegram - t.saidaTelegram) / t.leadTelegram) * 100 : 0,
    custoLead: sd(t.investimento, t.leadTelegram),
    lpTelegram: t.landingPage > 0 ? (t.leadTelegram / t.landingPage) * 100 : 0,
    custoCadastro: sd(t.investimento, t.cadastros),
    leadCadastro: t.leadTelegram > 0 ? (t.cadastros / t.leadTelegram) * 100 : 0,
    custoFtd: sd(t.investimento, t.ftd),
    cadastroFtd: t.cadastros > 0 ? (t.ftd / t.cadastros) * 100 : 0,
    roi: t.investimento > 0 ? t.valorDepositos / t.investimento : 0,
  };
}

const Compare = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading: isLoadingData } = useDailyData();

  const [optionA, setOptionA] = useState<DateRangeOption>("last30days");
  const [customA, setCustomA] = useState<DateRange | undefined>();
  const [optionB, setOptionB] = useState<DateRangeOption>("last7days");
  const [customB, setCustomB] = useState<DateRange | undefined>();

  useEffect(() => {
    if (!isAuthLoading && !user) navigate("/auth");
  }, [user, isAuthLoading, navigate]);

  const rangeA = useMemo(() => getDateRangeFromOption(optionA, customA), [optionA, customA]);
  const rangeB = useMemo(() => getDateRangeFromOption(optionB, customB), [optionB, customB]);

  const dataA = useMemo(() => filterByRange(data, rangeA), [data, rangeA]);
  const dataB = useMemo(() => filterByRange(data, rangeB), [data, rangeB]);

  const totalsA = useMemo(() => calculateTotals(dataA), [dataA]);
  const totalsB = useMemo(() => calculateTotals(dataB), [dataB]);

  const finA = useMemo(() => calculateFinanceMetrics(totalsA), [totalsA]);
  const finB = useMemo(() => calculateFinanceMetrics(totalsB), [totalsB]);

  const funnelA = useMemo(() => calculateFunnel(totalsA), [totalsA]);
  const funnelB = useMemo(() => calculateFunnel(totalsB), [totalsB]);

  const metricsA = useMemo(() => calcDerived(totalsA), [totalsA]);
  const metricsB = useMemo(() => calcDerived(totalsB), [totalsB]);

  const handleChangeA = (o: DateRangeOption, r?: DateRange) => {
    setOptionA(o);
    if (o === "custom" && r) setCustomA(r);
  };
  const handleChangeB = (o: DateRangeOption, r?: DateRange) => {
    setOptionB(o);
    if (o === "custom" && r) setCustomB(r);
  };

  if (isAuthLoading || isLoadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  // Table rows for consolidated metrics
  const consolidatedRows = [
    { label: "CPC", valueA: metricsA.cpc, valueB: metricsB.cpc, format: "currency" as const, invertLogic: true },
    { label: "CPV", valueA: metricsA.cpv, valueB: metricsB.cpv, format: "currency" as const, invertLogic: true },
    { label: "Clique → LP", valueA: metricsA.cliqueLp, valueB: metricsB.cliqueLp, format: "percent" as const },
    { label: "Retenção TG", valueA: metricsA.retencao, valueB: metricsB.retencao, format: "percent" as const },
    { label: "Custo Lead", valueA: metricsA.custoLead, valueB: metricsB.custoLead, format: "currency" as const, invertLogic: true },
    { label: "LP → Telegram", valueA: metricsA.lpTelegram, valueB: metricsB.lpTelegram, format: "percent" as const },
    { label: "Custo Cadastro", valueA: metricsA.custoCadastro, valueB: metricsB.custoCadastro, format: "currency" as const, invertLogic: true },
    { label: "Lead → Cadastro", valueA: metricsA.leadCadastro, valueB: metricsB.leadCadastro, format: "percent" as const },
    { label: "Custo FTD", valueA: metricsA.custoFtd, valueB: metricsB.custoFtd, format: "currency" as const, invertLogic: true },
    { label: "Cadastro → FTD", valueA: metricsA.cadastroFtd, valueB: metricsB.cadastroFtd, format: "percent" as const },
  ];

  // Finance comparison rows
  const financeRows = [
    { label: "Investimento", valueA: finA.investimento, valueB: finB.investimento, format: "currency" as const },
    { label: "Depósito", valueA: finA.deposito, valueB: finB.deposito, format: "currency" as const },
    { label: "Taxa", valueA: finA.taxa, valueB: finB.taxa, format: "currency" as const, invertLogic: true },
    { label: "Saque", valueA: finA.saque, valueB: finB.saque, format: "currency" as const, invertLogic: true },
    { label: "Expert", valueA: finA.expert, valueB: finB.expert, format: "currency" as const, invertLogic: true },
    { label: "Custo FTD", valueA: finA.custoFtd, valueB: finB.custoFtd, format: "currency" as const, invertLogic: true },
    { label: "Ticket Médio FTD", valueA: finA.ticketMedioFtd, valueB: finB.ticketMedioFtd, format: "currency" as const },
    { label: "Ticket Médio Total", valueA: finA.ticketMedioTotal, valueB: finB.ticketMedioTotal, format: "currency" as const },
    { label: "ROI Depósito", valueA: finA.roiDeposito, valueB: finB.roiDeposito, format: "multiplier" as const },
    { label: "ROI Operação", valueA: finA.roiOperacao, valueB: finB.roiOperacao, format: "multiplier" as const },
    { label: "Lucro Líquido", valueA: finA.lucroLiquido, valueB: finB.lucroLiquido, format: "currency" as const },
  ];

  // Funnel stages
  const funnelStages = funnelA.map((item, i) => ({
    label: item.label,
    valueA: item.value,
    valueB: funnelB[i]?.value ?? 0,
  }));

  // Radar chart data
  const radarData = [
    { metric: "Cliques", periodoA: totalsA.cliques, periodoB: totalsB.cliques },
    { metric: "Leads TG", periodoA: totalsA.leadTelegram, periodoB: totalsB.leadTelegram },
    { metric: "Cadastros", periodoA: totalsA.cadastros, periodoB: totalsB.cadastros },
    { metric: "FTD", periodoA: totalsA.ftd, periodoB: totalsB.ftd },
    { metric: "Depósitos", periodoA: totalsA.valorDepositos, periodoB: totalsB.valorDepositos },
    { metric: "ROI", periodoA: metricsA.roi * 100, periodoB: metricsB.roi * 100 },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                Comparação de Períodos
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">Compare métricas entre dois períodos</p>
            </div>
          </div>

          {/* Period selectors */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass-effect">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "hsl(199 89% 48%)" }} />
              <span className="text-xs font-semibold text-info">Período A</span>
              <DateRangeFilter value={optionA} customRange={customA} onChange={handleChangeA} />
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass-effect">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "hsl(38 92% 50%)" }} />
              <span className="text-xs font-semibold text-warning">Período B</span>
              <DateRangeFilter value={optionB} customRange={customB} onChange={handleChangeB} />
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ComparisonCard title="Investimento" valueA={totalsA.investimento} valueB={totalsB.investimento} format="currency" icon={<DollarSign className="w-4 h-4" />} />
          <ComparisonCard title="Cliques" valueA={totalsA.cliques} valueB={totalsB.cliques} format="number" icon={<MousePointer className="w-4 h-4" />} />
          <ComparisonCard title="Leads TG" valueA={totalsA.leadTelegram} valueB={totalsB.leadTelegram} format="number" icon={<Users className="w-4 h-4" />} />
          <ComparisonCard title="Cadastros" valueA={totalsA.cadastros} valueB={totalsB.cadastros} format="number" icon={<Target className="w-4 h-4" />} />
          <ComparisonCard title="FTD" valueA={totalsA.ftd} valueB={totalsB.ftd} format="number" icon={<BarChart3 className="w-4 h-4" />} />
          <ComparisonCard title="Depósitos" valueA={totalsA.valorDepositos} valueB={totalsB.valorDepositos} format="currency" icon={<TrendingUp className="w-4 h-4" />} />
          <ComparisonCard title="ROI" valueA={metricsA.roi} valueB={metricsB.roi} format="multiplier" icon={<Percent className="w-4 h-4" />} />
        </div>

        {/* Consolidated Metrics Table */}
        <ComparisonTable title="Métricas Consolidadas" rows={consolidatedRows} />

        {/* Finance Comparison Table */}
        <ComparisonTable title="Resumo Financeiro" rows={financeRows} />

        {/* Finance Section - Donut Charts + Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <FinanceDonutChart
            title="Distribuição Financeira"
            investimento={finA.investimento}
            deposito={finA.deposito}
            lucro={finA.lucroLiquido}
            periodLabel="Período A"
            periodColor="hsl(199 89% 48%)"
          />
          <FinanceDonutChart
            title="Distribuição Financeira"
            investimento={finB.investimento}
            deposito={finB.deposito}
            lucro={finB.lucroLiquido}
            periodLabel="Período B"
            periodColor="hsl(38 92% 50%)"
          />
          <ComparisonRadarChart title="Visão Geral" data={radarData} />
        </div>

        {/* Funnel */}
        <ComparisonFunnel title="Funil de Conversão Comparativo" stages={funnelStages} />
      </div>
    </div>
  );
};

export default Compare;
