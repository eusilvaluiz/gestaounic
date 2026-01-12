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
  const custoFtd = totals.ftd > 0 ? finance.investimento / totals.ftd : 0;
  const ticketMedioFtd = totals.ftd > 0 ? totals.valorFtd / totals.ftd : 0;
  const ticketMedioTotal = totals.depositos > 0 ? totals.valorDepositos / totals.depositos : 0;
  const roiDeposito = finance.investimento > 0 ? totals.valorDepositos / finance.investimento : 0;
  const lucroLiquido = finance.deposito - finance.taxa - finance.saque - finance.expert - finance.investimento;
  const roiOperacao = finance.investimento > 0 ? (finance.deposito - finance.taxa - finance.saque - finance.expert) / finance.investimento : 0;

  return {
    custoFtd,
    ticketMedioFtd,
    ticketMedioTotal,
    roiDeposito,
    lucroLiquido,
    roiOperacao
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
