import { useState, useMemo } from "react";
import { DailyData, CalculatedMetrics } from "@/types/marketing";
import { calculateMetrics, formatCurrency, formatPercent } from "@/utils/calculations";
import { CurrencyInput } from "@/components/CurrencyInput";
import { NumberInput } from "@/components/NumberInput";
import { Trash2, Plus, Loader2, GripVertical } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface DataTableProps {
  data: DailyData[];
  onDataChange: (data: DailyData[]) => void;
  onAddRow?: () => Promise<DailyData | null>;
  onDeleteRow?: (id: string) => Promise<void>;
  onReorderRows?: (activeId: string, overId: string) => Promise<void>;
  isLoading?: boolean;
  isSaving?: boolean;
}

// Sortable row component
interface SortableRowProps {
  row: DailyData;
  metrics: CalculatedMetrics;
  handleCellChange: (id: string, field: keyof DailyData, value: string | number) => void;
  handleDeleteRow: (id: string) => void;
  renderMetricsCell: (value: number, isPercent?: boolean, isCurrency?: boolean) => JSX.Element;
  isSaving: boolean;
}

const SortableRow = ({
  row,
  metrics,
  handleCellChange,
  handleDeleteRow,
  renderMetricsCell,
  isSaving,
}: SortableRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className="border-border hover:bg-accent/50">
      <TableCell
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing w-10"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </TableCell>
      <TableCell>
        <Input
          value={row.data}
          onChange={(e) => handleCellChange(row.id, "data", e.target.value)}
          className="h-8 text-xs min-w-[90px] bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary"
          placeholder="dd/mm/aa"
        />
      </TableCell>
      <TableCell>
        <CurrencyInput
          value={row.investimento}
          onChange={(val) => handleCellChange(row.id, "investimento", val)}
          className="h-8 text-xs min-w-[90px] bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary"
          placeholder="0,00"
        />
      </TableCell>
      <TableCell>
        <NumberInput
          value={row.cliques}
          onChange={(val) => handleCellChange(row.id, "cliques", val)}
          className="h-8 text-xs min-w-[70px] bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary"
        />
      </TableCell>
      <TableCell>{renderMetricsCell(metrics.cpc, false, true)}</TableCell>
      <TableCell>
        <NumberInput
          value={row.landingPage}
          onChange={(val) => handleCellChange(row.id, "landingPage", val)}
          className="h-8 text-xs min-w-[70px] bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary"
        />
      </TableCell>
      <TableCell>{renderMetricsCell(metrics.cpv, false, true)}</TableCell>
      <TableCell>{renderMetricsCell(metrics.cliqueLp, true)}</TableCell>
      <TableCell>
        <NumberInput
          value={row.leadTelegram}
          onChange={(val) => handleCellChange(row.id, "leadTelegram", val)}
          className="h-8 text-xs min-w-[70px] bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary"
        />
      </TableCell>
      <TableCell>
        <NumberInput
          value={row.saidaTelegram}
          onChange={(val) => handleCellChange(row.id, "saidaTelegram", val)}
          className="h-8 text-xs min-w-[70px] bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary"
        />
      </TableCell>
      <TableCell>{renderMetricsCell(metrics.retencaoTelegram, true)}</TableCell>
      <TableCell>{renderMetricsCell(metrics.custoLead, false, true)}</TableCell>
      <TableCell>{renderMetricsCell(metrics.lpTelegram, true)}</TableCell>
      <TableCell>
        <NumberInput
          value={row.cadastros}
          onChange={(val) => handleCellChange(row.id, "cadastros", val)}
          className="h-8 text-xs min-w-[70px] bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary"
        />
      </TableCell>
      <TableCell>{renderMetricsCell(metrics.custoCadastro, false, true)}</TableCell>
      <TableCell>{renderMetricsCell(metrics.leadCadastro, true)}</TableCell>
      <TableCell>
        <NumberInput
          value={row.ftd}
          onChange={(val) => handleCellChange(row.id, "ftd", val)}
          className="h-8 text-xs min-w-[70px] bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary"
        />
      </TableCell>
      <TableCell>
        <CurrencyInput
          value={row.valorFtd}
          onChange={(val) => handleCellChange(row.id, "valorFtd", val)}
          className="h-8 text-xs min-w-[90px] bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary"
        />
      </TableCell>
      <TableCell>{renderMetricsCell(metrics.custoFtd, false, true)}</TableCell>
      <TableCell>{renderMetricsCell(metrics.cadastroFtd, true)}</TableCell>
      <TableCell>
        <NumberInput
          value={row.depositos}
          onChange={(val) => handleCellChange(row.id, "depositos", val)}
          className="h-8 text-xs min-w-[70px] bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary"
        />
      </TableCell>
      <TableCell>
        <CurrencyInput
          value={row.valorDepositos}
          onChange={(val) => handleCellChange(row.id, "valorDepositos", val)}
          className="h-8 text-xs min-w-[90px] bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary"
        />
      </TableCell>
      <TableCell>
        <CurrencyInput
          value={row.rev10}
          onChange={(val) => handleCellChange(row.id, "rev10", val)}
          className="h-8 text-xs min-w-[90px] bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary"
        />
      </TableCell>
      <TableCell>
        <CurrencyInput
          value={row.vendas}
          onChange={(val) => handleCellChange(row.id, "vendas", val)}
          className="h-8 text-xs min-w-[90px] bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary"
        />
      </TableCell>
      <TableCell>
        <CurrencyInput
          value={row.taxa}
          onChange={(val) => handleCellChange(row.id, "taxa", val)}
          className="h-8 text-xs min-w-[90px] bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary"
        />
      </TableCell>
      <TableCell>
        <CurrencyInput
          value={row.saque}
          onChange={(val) => handleCellChange(row.id, "saque", val)}
          className="h-8 text-xs min-w-[90px] bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary"
        />
      </TableCell>
      <TableCell>
        <CurrencyInput
          value={row.expert}
          onChange={(val) => handleCellChange(row.id, "expert", val)}
          className="h-8 text-xs min-w-[90px] bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary"
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
          onClick={() => handleDeleteRow(row.id)}
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          disabled={isSaving}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};

export const DataTable = ({ 
  data, 
  onDataChange, 
  onAddRow, 
  onDeleteRow,
  onReorderRows,
  isLoading = false,
  isSaving = false 
}: DataTableProps) => {
  const [rowLimit, setRowLimit] = useState<number | "unlimited">(20);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const displayedData = useMemo(() => {
    if (rowLimit === "unlimited" || data.length <= 20) {
      return data;
    }
    // Pega as últimas N linhas (mais recentes)
    return data.slice(-rowLimit);
  }, [data, rowLimit]);

  const handleCellChange = (id: string, field: keyof DailyData, value: string | number) => {
    const updatedData = data.map((row) => {
      if (row.id === id) {
        let numValue: string | number;
        
        if (field === "data") {
          numValue = value;
        } else if (typeof value === "number") {
          numValue = value;
        } else {
          numValue = parseFloat(value.replace(",", ".")) || 0;
        }
        
        return { ...row, [field]: numValue };
      }
      return row;
    });
    onDataChange(updatedData);
  };

  const handleAddRow = async () => {
    if (onAddRow) {
      await onAddRow();
    } else {
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
        taxa: 0,
        saque: 0,
        expert: 0,
      };
      onDataChange([...data, newRow]);
    }
  };

  const handleDeleteRow = async (id: string) => {
    if (onDeleteRow) {
      await onDeleteRow(id);
    } else {
      onDataChange(data.filter((row) => row.id !== id));
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id && onReorderRows) {
      await onReorderRows(active.id as string, over.id as string);
    }
  };

  const renderMetricsCell = (value: number, isPercent = false, isCurrency = false) => {
    if (!isFinite(value) || isNaN(value)) return <span className="text-muted-foreground">-</span>;
    if (isCurrency) return <span className="text-info font-mono text-xs">{formatCurrency(value)}</span>;
    if (isPercent) return <span className="text-warning font-mono text-xs">{formatPercent(value)}</span>;
    return <span className="font-mono text-xs">{value.toFixed(2)}</span>;
  };

  if (isLoading) {
    return (
      <div className="glass-effect rounded-xl p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Carregando dados...</span>
      </div>
    );
  }

  return (
    <div className="glass-effect rounded-xl overflow-hidden animate-fade-in">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-foreground">Dados Diários</h3>
          {isSaving && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Salvando...</span>
            </div>
          )}
        </div>
        <Button onClick={handleAddRow} size="sm" className="gap-2" disabled={isSaving}>
          <Plus className="w-4 h-4" />
          Nova Linha
        </Button>
      </div>
      <div className="overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="w-10"></TableHead>
                <TableHead className="text-muted-foreground font-semibold min-w-[100px]">Data</TableHead>
                <TableHead className="text-muted-foreground font-semibold min-w-[145px]">Investimento</TableHead>
                <TableHead className="text-muted-foreground font-semibold min-w-[85px]">Cliques</TableHead>
                <TableHead className="text-info font-semibold min-w-[100px]">CPC</TableHead>
                <TableHead className="text-muted-foreground font-semibold min-w-[85px]">LP</TableHead>
                <TableHead className="text-info font-semibold min-w-[100px]">CPV</TableHead>
                <TableHead className="text-warning font-semibold min-w-[95px]">Clique→LP</TableHead>
                <TableHead className="text-muted-foreground font-semibold min-w-[100px]">Lead Telegram</TableHead>
                <TableHead className="text-muted-foreground font-semibold min-w-[85px]">Saída</TableHead>
                <TableHead className="text-warning font-semibold min-w-[95px]">Retenção</TableHead>
                <TableHead className="text-info font-semibold min-w-[100px]">Custo Lead</TableHead>
                <TableHead className="text-warning font-semibold min-w-[95px]">LP→Telegram</TableHead>
                <TableHead className="text-muted-foreground font-semibold min-w-[85px]">Cadastros</TableHead>
                <TableHead className="text-info font-semibold min-w-[100px]">Custo Cadastro</TableHead>
                <TableHead className="text-warning font-semibold min-w-[95px]">Lead→Cadastro</TableHead>
                <TableHead className="text-muted-foreground font-semibold min-w-[85px]">FTD</TableHead>
                <TableHead className="text-muted-foreground font-semibold min-w-[145px]">Valor FTD</TableHead>
                <TableHead className="text-info font-semibold min-w-[100px]">Custo FTD</TableHead>
                <TableHead className="text-warning font-semibold min-w-[95px]">Cadastro→FTD</TableHead>
                <TableHead className="text-muted-foreground font-semibold min-w-[85px]">Depósitos</TableHead>
                <TableHead className="text-muted-foreground font-semibold min-w-[145px]">Valor Depósitos</TableHead>
                <TableHead className="text-muted-foreground font-semibold min-w-[145px]">REV (10%)</TableHead>
                <TableHead className="text-muted-foreground font-semibold min-w-[145px]">Vendas</TableHead>
                <TableHead className="text-warning font-semibold min-w-[100px]">Taxa</TableHead>
                <TableHead className="text-muted-foreground font-semibold min-w-[100px]">Saque</TableHead>
                <TableHead className="text-info font-semibold min-w-[100px]">Expert</TableHead>
                <TableHead className="text-success font-semibold min-w-[75px]">ROI</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <SortableContext items={displayedData.map(d => d.id)} strategy={verticalListSortingStrategy}>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={29} className="text-center py-8 text-muted-foreground">
                      Nenhum dado encontrado. Clique em "Nova Linha" para começar.
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedData.map((row) => {
                    const metrics: CalculatedMetrics = calculateMetrics(row);
                    
                    return (
                      <SortableRow
                        key={row.id}
                        row={row}
                        metrics={metrics}
                        handleCellChange={handleCellChange}
                        handleDeleteRow={handleDeleteRow}
                        renderMetricsCell={renderMetricsCell}
                        isSaving={isSaving}
                      />
                    );
                  })
                )}
              </TableBody>
            </SortableContext>
          </Table>
        </DndContext>
      </div>
      
      {data.length > 20 && (
        <div className="p-4 border-t border-border flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>Exibindo</span>
          <Select 
            value={rowLimit.toString()} 
            onValueChange={(val) => setRowLimit(val === "unlimited" ? "unlimited" : Number(val))}
          >
            <SelectTrigger className="w-[100px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="250">250</SelectItem>
              <SelectItem value="500">500</SelectItem>
              <SelectItem value="unlimited">Todas</SelectItem>
            </SelectContent>
          </Select>
          <span>de {data.length} linhas</span>
        </div>
      )}
    </div>
  );
};
