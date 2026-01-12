export interface DailyData {
  id: string;
  data: string;
  investimento: number;
  cliques: number;
  landingPage: number;
  leadTelegram: number;
  saidaTelegram: number;
  cadastros: number;
  ftd: number;
  valorFtd: number;
  depositos: number;
  valorDepositos: number;
  rev10: number;
  vendas: number;
  sortOrder?: number;
}

export interface CalculatedMetrics {
  cpc: number;
  cpv: number;
  cliqueLp: number;
  retencaoTelegram: number;
  custoLead: number;
  lpTelegram: number;
  custoCadastro: number;
  leadCadastro: number;
  custoFtd: number;
  cadastroFtd: number;
  roi: number;
}

export interface TotalsData {
  investimento: number;
  cliques: number;
  landingPage: number;
  leadTelegram: number;
  saidaTelegram: number;
  cadastros: number;
  ftd: number;
  valorFtd: number;
  depositos: number;
  valorDepositos: number;
  rev10: number;
  vendas: number;
}

export interface FunnelData {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

export interface FinanceData {
  investimento: number;
  deposito: number;
  taxa: number;
  saque: number;
  expert: number;
}
