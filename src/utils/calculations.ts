import { DailyData, CalculatedMetrics, TotalsData, FunnelData, FinanceData } from "@/types/marketing";

export const calculateMetrics = (data: DailyData): CalculatedMetrics => {
  const safeDivide = (a: number, b: number): number => {
    if (b === 0 || isNaN(b)) return 0;
    return a / b;
  };

  const cpc = safeDivide(data.investimento, data.cliques);
  const cpv = safeDivide(data.investimento, data.landingPage);
  const cliqueLp = safeDivide(data.landingPage, data.cliques) * 100;
  const retencaoTelegram = safeDivide(data.leadTelegram - data.saidaTelegram, data.leadTelegram) * 100;
  const custoLead = safeDivide(data.investimento, data.leadTelegram);
  const lpTelegram = safeDivide(data.leadTelegram, data.landingPage) * 100;
  const custoCadastro = safeDivide(data.investimento, data.cadastros);
  const leadCadastro = safeDivide(data.cadastros, data.leadTelegram) * 100;
  const custoFtd = safeDivide(data.investimento, data.ftd);
  const cadastroFtd = safeDivide(data.ftd, data.cadastros) * 100;
  const roi = safeDivide(data.valorDepositos, data.investimento);

  return {
    cpc,
    cpv,
    cliqueLp,
    retencaoTelegram,
    custoLead,
    lpTelegram,
    custoCadastro,
    leadCadastro,
    custoFtd,
    cadastroFtd,
    roi
  };
};

export const calculateTotals = (dataList: DailyData[]): TotalsData => {
  return dataList.reduce(
    (acc, curr) => ({
      investimento: acc.investimento + (curr.investimento || 0),
      cliques: acc.cliques + (curr.cliques || 0),
      landingPage: acc.landingPage + (curr.landingPage || 0),
      leadTelegram: acc.leadTelegram + (curr.leadTelegram || 0),
      saidaTelegram: acc.saidaTelegram + (curr.saidaTelegram || 0),
      cadastros: acc.cadastros + (curr.cadastros || 0),
      ftd: acc.ftd + (curr.ftd || 0),
      valorFtd: acc.valorFtd + (curr.valorFtd || 0),
      depositos: acc.depositos + (curr.depositos || 0),
      valorDepositos: acc.valorDepositos + (curr.valorDepositos || 0),
      rev10: acc.rev10 + (curr.rev10 || 0),
      vendas: acc.vendas + (curr.vendas || 0),
    }),
    {
      investimento: 0,
      cliques: 0,
      landingPage: 0,
      leadTelegram: 0,
      saidaTelegram: 0,
      cadastros: 0,
      ftd: 0,
      valorFtd: 0,
      depositos: 0,
      valorDepositos: 0,
      rev10: 0,
      vendas: 0,
    }
  );
};

export const calculateFunnel = (totals: TotalsData): FunnelData[] => {
  const baseCliques = totals.cliques || 1;
  
  return [
    { 
      label: "Cliques no Link", 
      value: totals.cliques, 
      percentage: 100, 
      color: "hsl(var(--info))" 
    },
    { 
      label: "Visualização LP", 
      value: totals.landingPage, 
      percentage: (totals.landingPage / baseCliques) * 100, 
      color: "hsl(199 89% 55%)" 
    },
    { 
      label: "Lead Telegram", 
      value: totals.leadTelegram, 
      percentage: (totals.leadTelegram / baseCliques) * 100, 
      color: "hsl(38 92% 50%)" 
    },
    { 
      label: "Cadastro", 
      value: totals.cadastros, 
      percentage: (totals.cadastros / baseCliques) * 100, 
      color: "hsl(142 76% 45%)" 
    },
    { 
      label: "FTD", 
      value: totals.ftd, 
      percentage: (totals.ftd / baseCliques) * 100, 
      color: "hsl(142 76% 36%)" 
    },
  ];
};

export const calculateFinanceMetrics = (totals: TotalsData, finance: FinanceData) => {
  // Receita = apenas Vendas (REV 10% é custo, não receita)
  const receita = totals.vendas;
  
  // REV 10% é custo pago à plataforma white label
  const rev10 = totals.rev10;
  
  // Custo por FTD usando investimento da tabela diária
  const custoFtd = totals.ftd > 0 ? totals.investimento / totals.ftd : 0;
  const ticketMedioFtd = totals.ftd > 0 ? totals.valorFtd / totals.ftd : 0;
  const ticketMedioTotal = totals.depositos > 0 ? totals.valorDepositos / totals.depositos : 0;
  const roiDeposito = totals.investimento > 0 ? totals.valorDepositos / totals.investimento : 0;
  
  // Lucro Líquido = Vendas - REV 10% - Investimento - Taxa - Saque - Expert
  const lucroLiquido = totals.vendas - totals.rev10 - totals.investimento - finance.taxa - finance.saque - finance.expert;
  
  // ROI Operação = (Vendas - REV 10% - Taxa - Saque - Expert) / Investimento
  const roiOperacao = totals.investimento > 0 
    ? (totals.vendas - totals.rev10 - finance.taxa - finance.saque - finance.expert) / totals.investimento 
    : 0;

  return {
    custoFtd,
    ticketMedioFtd,
    ticketMedioTotal,
    roiDeposito,
    lucroLiquido,
    roiOperacao,
    receita, // Vendas (exibição)
    rev10, // REV 10% como custo (exibição)
    investimento: totals.investimento, // Expondo para exibição
    deposito: totals.valorDepositos // Expondo para exibição
  };
};

export const formatCurrency = (value: number): string => {
  if (isNaN(value) || !isFinite(value)) return "R$ 0,00";
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatPercent = (value: number): string => {
  if (isNaN(value) || !isFinite(value)) return "0,00%";
  return `${value.toFixed(2).replace('.', ',')}%`;
};

export const formatNumber = (value: number): string => {
  if (isNaN(value) || !isFinite(value)) return "0";
  return new Intl.NumberFormat('pt-BR').format(value);
};

// Formata número para exibição em input no padrão brasileiro (sem símbolo R$)
export const formatCurrencyInput = (value: number): string => {
  if (!value || value === 0) return "";
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Converte string formatada (padrão brasileiro) para número
export const parseCurrencyInput = (value: string): number => {
  if (!value) return 0;
  // Remove pontos de milhar e troca vírgula por ponto
  const cleaned = value.replace(/\./g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
};
