import { useState, useMemo, useRef, useEffect } from "react";
import { DailyData, CalculatedMetrics } from "@/types/marketing";
import { calculateMetrics, formatCurrency, formatPercent } from "@/utils/calculations";
import { CurrencyInput } from "@/components/CurrencyInput";
import { NumberInput } from "@/components/NumberInput";
import { Trash2, Plus, Loader2, GripVertical, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, parse, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
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

// DatePicker cell component for date selection
const DatePickerCell = ({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (date: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  
  // Parse date from "dd/MM/yy" format
  const parseDate = (dateStr: string): Date | undefined => {
    if (!dateStr) return undefined;
    
    // Try different formats
    const formats = ["dd/MM/yy", "dd/MM/yyyy", "dd/MM"];
    for (const fmt of formats) {
      const parsed = parse(dateStr, fmt, new Date());
      if (isValid(parsed)) return parsed;
    }
    return undefined;
  };

  const selectedDate = parseDate(value);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, "dd/MM/yy"));
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 text-xs min-w-[90px] justify-start font-normal px-2 hover:bg-accent"
        >
          <CalendarIcon className="mr-1 h-3 w-3 text-muted-foreground" />
          {value || <span className="text-muted-foreground">Selecionar</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          locale={ptBR}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};

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
        <DatePickerCell
          value={row.data}
          onChange={(newDate) => handleCellChange(row.id, "data", newDate)}
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
        <span className={`font-mono text-sm font-bold ${metrics.roi >= 0 ? 'text-success' : 'text-destructive'}`}>
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
  // Padrão: mostrar todas as linhas (sem limite)
  const [rowLimit, setRowLimit] = useState<number | "unlimited">("unlimited");
  const [showFloatingHeader, setShowFloatingHeader] = useState(false);
  const [columnWidths, setColumnWidths] = useState<number[]>([]);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [headerPosition, setHeaderPosition] = useState({ left: 0, width: 0 });
  const [isTableActive, setIsTableActive] = useState(false);
  
  const headerRef = useRef<HTMLTableSectionElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Definições das colunas para reutilização
  const columnDefs = useMemo(() => [
    { key: 'drag', label: '', colorClass: 'text-muted-foreground', width: 'w-10' },
    { key: 'data', label: 'Data', colorClass: 'text-muted-foreground', minWidth: 'min-w-[100px]' },
    { key: 'investimento', label: 'Investimento', colorClass: 'text-muted-foreground', minWidth: 'min-w-[145px]' },
    { key: 'cliques', label: 'Cliques', colorClass: 'text-muted-foreground', minWidth: 'min-w-[85px]' },
    { key: 'cpc', label: 'CPC', colorClass: 'text-info', minWidth: 'min-w-[100px]' },
    { key: 'lp', label: 'LP', colorClass: 'text-muted-foreground', minWidth: 'min-w-[85px]' },
    { key: 'cpv', label: 'CPV', colorClass: 'text-info', minWidth: 'min-w-[100px]' },
    { key: 'cliqueLp', label: 'Clique→LP', colorClass: 'text-warning', minWidth: 'min-w-[95px]' },
    { key: 'leadTelegram', label: 'Lead Telegram', colorClass: 'text-muted-foreground', minWidth: 'min-w-[100px]' },
    { key: 'saida', label: 'Saída', colorClass: 'text-muted-foreground', minWidth: 'min-w-[85px]' },
    { key: 'retencao', label: 'Retenção', colorClass: 'text-warning', minWidth: 'min-w-[95px]' },
    { key: 'custoLead', label: 'Custo Lead', colorClass: 'text-info', minWidth: 'min-w-[100px]' },
    { key: 'lpTelegram', label: 'LP→Telegram', colorClass: 'text-warning', minWidth: 'min-w-[95px]' },
    { key: 'cadastros', label: 'Cadastros', colorClass: 'text-muted-foreground', minWidth: 'min-w-[85px]' },
    { key: 'custoCadastro', label: 'Custo Cadastro', colorClass: 'text-info', minWidth: 'min-w-[100px]' },
    { key: 'leadCadastro', label: 'Lead→Cadastro', colorClass: 'text-warning', minWidth: 'min-w-[95px]' },
    { key: 'ftd', label: 'FTD', colorClass: 'text-muted-foreground', minWidth: 'min-w-[85px]' },
    { key: 'valorFtd', label: 'Valor FTD', colorClass: 'text-muted-foreground', minWidth: 'min-w-[145px]' },
    { key: 'custoFtd', label: 'Custo FTD', colorClass: 'text-info', minWidth: 'min-w-[100px]' },
    { key: 'cadastroFtd', label: 'Cadastro→FTD', colorClass: 'text-warning', minWidth: 'min-w-[95px]' },
    { key: 'depositos', label: 'Depósitos', colorClass: 'text-muted-foreground', minWidth: 'min-w-[85px]' },
    { key: 'valorDepositos', label: 'Valor Depósitos', colorClass: 'text-muted-foreground', minWidth: 'min-w-[145px]' },
    { key: 'rev10', label: 'REV (10%)', colorClass: 'text-muted-foreground', minWidth: 'min-w-[145px]' },
    { key: 'vendas', label: 'Vendas', colorClass: 'text-muted-foreground', minWidth: 'min-w-[145px]' },
    { key: 'taxa', label: 'Taxa', colorClass: 'text-warning', minWidth: 'min-w-[100px]' },
    { key: 'saque', label: 'Saque', colorClass: 'text-muted-foreground', minWidth: 'min-w-[100px]' },
    { key: 'expert', label: 'Expert', colorClass: 'text-info', minWidth: 'min-w-[100px]' },
    { key: 'roi', label: 'ROI', colorClass: 'text-success', minWidth: 'min-w-[75px]' },
    { key: 'delete', label: '', colorClass: 'text-muted-foreground', width: 'w-10' },
  ], []);

  // Detectar quando o header original sai da tela
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowFloatingHeader(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: '-1px 0px 0px 0px' }
    );

    if (headerRef.current) {
      observer.observe(headerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Medir larguras reais das colunas do header original
  useEffect(() => {
    const measureWidths = () => {
      if (!headerRef.current) return;
      
      const headerCells = headerRef.current.querySelectorAll('th');
      const widths = Array.from(headerCells).map(cell => cell.getBoundingClientRect().width);
      setColumnWidths(widths);
    };
    
    // Medir após um pequeno delay para garantir que o layout foi calculado
    const timeoutId = setTimeout(measureWidths, 100);
    
    // Atualizar quando a janela redimensionar
    window.addEventListener('resize', measureWidths);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', measureWidths);
    };
  }, [data]);

  // Capturar referência do scroll container e sincronizar scroll
  useEffect(() => {
    // O Table do shadcn envolve o <table> em um div com overflow-auto
    const tableWrapper = tableContainerRef.current?.querySelector('.relative.w-full.overflow-auto') as HTMLDivElement | null;
    if (tableWrapper) {
      tableScrollRef.current = tableWrapper;
      
      const handleScroll = () => {
        setScrollLeft(tableWrapper.scrollLeft);
      };
      
      tableWrapper.addEventListener('scroll', handleScroll);
      return () => tableWrapper.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Atualizar posição do header flutuante e verificar se a tabela está ativa
  useEffect(() => {
    const HEADER_HEIGHT = 48; // Altura do header (h-12 = 48px)
    let rafId: number;
    
    const updatePosition = () => {
      if (tableContainerRef.current) {
        const rect = tableContainerRef.current.getBoundingClientRect();
        setHeaderPosition({ left: rect.left, width: rect.width });
        
        // A tabela está "ativa" quando:
        // 1. O topo da tabela já passou do topo da viewport (rect.top <= 10)
        // 2. O fundo da tabela ainda está visível (rect.bottom > HEADER_HEIGHT + 10)
        // Margem de 10px para tolerância entre navegadores
        const active = rect.top <= 10 && rect.bottom > HEADER_HEIGHT + 10;
        setIsTableActive(active);
      }
    };
    
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updatePosition);
    };
    
    // Listeners no window
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    window.addEventListener('resize', onScroll, { passive: true });
    document.addEventListener('scroll', onScroll, { passive: true, capture: true });
    
    // Encontrar containers scrolláveis pais e adicionar listeners
    const scrollableParents: HTMLElement[] = [];
    let parent = tableContainerRef.current?.parentElement;
    while (parent) {
      const style = window.getComputedStyle(parent);
      if (style.overflow === 'auto' || style.overflow === 'scroll' || 
          style.overflowY === 'auto' || style.overflowY === 'scroll') {
        scrollableParents.push(parent);
        parent.addEventListener('scroll', onScroll, { passive: true });
      }
      parent = parent.parentElement;
    }
    
    // Atualização inicial
    updatePosition();
    
    // Garantir atualização após renderização completa
    const timeoutId = setTimeout(updatePosition, 100);
    
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', onScroll);
      document.removeEventListener('scroll', onScroll, { capture: true });
      scrollableParents.forEach(p => p.removeEventListener('scroll', onScroll));
    };
  }, []);

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
      <div className="bg-[hsl(222,47%,12%)] rounded-xl p-8 flex items-center justify-center shadow-2xl shadow-black/40 border border-border">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Carregando dados...</span>
      </div>
    );
  }

  return (
    <div className="bg-[hsl(222,47%,12%)] rounded-xl overflow-hidden animate-fade-in shadow-2xl shadow-black/40 border border-border">
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
      {/* Header Flutuante com larguras sincronizadas */}
      {showFloatingHeader && isTableActive && columnWidths.length > 0 && (
        <div 
          className="fixed top-0 z-50 bg-[hsl(222,47%,11%)] border-b border-border shadow-lg shadow-black/50 overflow-hidden"
          style={{
            left: headerPosition.left,
            width: headerPosition.width
          }}
        >
          <div 
            style={{ 
              marginLeft: -scrollLeft,
              width: columnWidths.reduce((a, b) => a + b, 0)
            }}
          >
            <table className="text-sm" style={{ tableLayout: 'fixed', width: columnWidths.reduce((a, b) => a + b, 0) }}>
              <thead>
                <tr className="bg-[hsl(222,47%,12%)] border-b">
                  {columnDefs.map((col, index) => (
                    <th 
                      key={col.key}
                      style={{ width: columnWidths[index] }}
                      className={`h-12 px-4 text-left align-middle font-semibold ${col.colorClass}`}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
            </table>
          </div>
        </div>
      )}
      
      <div ref={tableContainerRef} className="overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader ref={headerRef}>
              <TableRow className="hover:bg-transparent border-border bg-[hsl(222,47%,12%)]">
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
