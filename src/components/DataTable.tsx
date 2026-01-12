import { DailyData, CalculatedMetrics } from "@/types/marketing";
import { calculateMetrics, formatCurrency, formatPercent } from "@/utils/calculations";
import { Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableProps {
  data: DailyData[];
  onDataChange: (data: DailyData[]) => void;
}

export const DataTable = ({ data, onDataChange }: DataTableProps) => {
  const handleCellChange = (id: string, field: keyof DailyData, value: string) => {
    const updatedData = data.map((row) => {
      if (row.id === id) {
        const numValue = field === "data" ? value : parseFloat(value.replace(",", ".")) || 0;
        return { ...row, [field]: numValue };
      }
      return row;
    });
    onDataChange(updatedData);
  };

  const addRow = () => {
    const newRow: DailyData = {
      id: crypto.randomUUID(),
      data: "",
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
    };
    onDataChange([...data, newRow]);
  };

  const deleteRow = (id: string) => {
    onDataChange(data.filter((row) => row.id !== id));
  };

  const renderMetricsCell = (value: number, isPercent = false, isCurrency = false) => {
    if (!isFinite(value) || isNaN(value)) return <span className="text-muted-foreground">-</span>;
    if (isCurrency) return <span className="text-info font-mono text-xs">{formatCurrency(value)}</span>;
    if (isPercent) return <span className="text-warning font-mono text-xs">{formatPercent(value)}</span>;
    return <span className="font-mono text-xs">{value.toFixed(2)}</span>;
  };

  return (
    <div className="glass-effect rounded-xl overflow-hidden animate-fade-in">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Dados Diários</h3>
        <Button onClick={addRow} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Linha
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="text-muted-foreground font-semibold min-w-[80px]">Data</TableHead>
              <TableHead className="text-muted-foreground font-semibold min-w-[120px]">Investimento</TableHead>
              <TableHead className="text-muted-foreground font-semibold min-w-[80px]">Cliques</TableHead>
              <TableHead className="text-info font-semibold min-w-[80px]">CPC</TableHead>
              <TableHead className="text-muted-foreground font-semibold min-w-[80px]">LP</TableHead>
              <TableHead className="text-info font-semibold min-w-[80px]">CPV</TableHead>
              <TableHead className="text-warning font-semibold min-w-[80px]">Clique→LP</TableHead>
              <TableHead className="text-muted-foreground font-semibold min-w-[100px]">Lead Telegram</TableHead>
              <TableHead className="text-muted-foreground font-semibold min-w-[80px]">Saída</TableHead>
              <TableHead className="text-warning font-semibold min-w-[90px]">Retenção</TableHead>
              <TableHead className="text-info font-semibold min-w-[100px]">Custo Lead</TableHead>
              <TableHead className="text-warning font-semibold min-w-[90px]">LP→Telegram</TableHead>
              <TableHead className="text-muted-foreground font-semibold min-w-[80px]">Cadastros</TableHead>
              <TableHead className="text-info font-semibold min-w-[110px]">Custo Cadastro</TableHead>
              <TableHead className="text-warning font-semibold min-w-[100px]">Lead→Cadastro</TableHead>
              <TableHead className="text-muted-foreground font-semibold min-w-[60px]">FTD</TableHead>
              <TableHead className="text-muted-foreground font-semibold min-w-[100px]">Valor FTD</TableHead>
              <TableHead className="text-info font-semibold min-w-[100px]">Custo FTD</TableHead>
              <TableHead className="text-warning font-semibold min-w-[100px]">Cadastro→FTD</TableHead>
              <TableHead className="text-muted-foreground font-semibold min-w-[80px]">Depósitos</TableHead>
              <TableHead className="text-muted-foreground font-semibold min-w-[120px]">Valor Depósitos</TableHead>
              <TableHead className="text-muted-foreground font-semibold min-w-[100px]">REV (10%)</TableHead>
              <TableHead className="text-muted-foreground font-semibold min-w-[100px]">Vendas</TableHead>
              <TableHead className="text-success font-semibold min-w-[60px]">ROI</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => {
              const metrics: CalculatedMetrics = calculateMetrics(row);
              
              return (
                <TableRow key={row.id} className="border-border hover:bg-accent/50">
                  <TableCell>
                    <Input
                      value={row.data}
                      onChange={(e) => handleCellChange(row.id, "data", e.target.value)}
                      className="h-8 text-xs bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary"
                      placeholder="dd/mm"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={row.investimento || ""}
                      onChange={(e) => handleCellChange(row.id, "investimento", e.target.value)}
                      className="h-8 text-xs bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary"
                      placeholder="0,00"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={row.cliques || ""}
                      onChange={(e) => handleCellChange(row.id, "cliques", e.target.value)}
                      className="h-8 text-xs bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </TableCell>
                  <TableCell>{renderMetricsCell(metrics.cpc, false, true)}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={row.landingPage || ""}
                      onChange={(e) => handleCellChange(row.id, "landingPage", e.target.value)}
                      className="h-8 text-xs bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </TableCell>
                  <TableCell>{renderMetricsCell(metrics.cpv, false, true)}</TableCell>
                  <TableCell>{renderMetricsCell(metrics.cliqueLp, true)}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={row.leadTelegram || ""}
                      onChange={(e) => handleCellChange(row.id, "leadTelegram", e.target.value)}
                      className="h-8 text-xs bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={row.saidaTelegram || ""}
                      onChange={(e) => handleCellChange(row.id, "saidaTelegram", e.target.value)}
                      className="h-8 text-xs bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </TableCell>
                  <TableCell>{renderMetricsCell(metrics.retencaoTelegram, true)}</TableCell>
                  <TableCell>{renderMetricsCell(metrics.custoLead, false, true)}</TableCell>
                  <TableCell>{renderMetricsCell(metrics.lpTelegram, true)}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={row.cadastros || ""}
                      onChange={(e) => handleCellChange(row.id, "cadastros", e.target.value)}
                      className="h-8 text-xs bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </TableCell>
                  <TableCell>{renderMetricsCell(metrics.custoCadastro, false, true)}</TableCell>
                  <TableCell>{renderMetricsCell(metrics.leadCadastro, true)}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={row.ftd || ""}
                      onChange={(e) => handleCellChange(row.id, "ftd", e.target.value)}
                      className="h-8 text-xs bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={row.valorFtd || ""}
                      onChange={(e) => handleCellChange(row.id, "valorFtd", e.target.value)}
                      className="h-8 text-xs bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </TableCell>
                  <TableCell>{renderMetricsCell(metrics.custoFtd, false, true)}</TableCell>
                  <TableCell>{renderMetricsCell(metrics.cadastroFtd, true)}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={row.depositos || ""}
                      onChange={(e) => handleCellChange(row.id, "depositos", e.target.value)}
                      className="h-8 text-xs bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={row.valorDepositos || ""}
                      onChange={(e) => handleCellChange(row.id, "valorDepositos", e.target.value)}
                      className="h-8 text-xs bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={row.rev10 || ""}
                      onChange={(e) => handleCellChange(row.id, "rev10", e.target.value)}
                      className="h-8 text-xs bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={row.vendas || ""}
                      onChange={(e) => handleCellChange(row.id, "vendas", e.target.value)}
                      className="h-8 text-xs bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </TableCell>
                  <TableCell>
                    <span className={`font-mono text-sm font-bold ${metrics.roi >= 1 ? 'text-success' : 'text-destructive'}`}>
                      {isFinite(metrics.roi) ? metrics.roi.toFixed(2) : "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteRow(row.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
