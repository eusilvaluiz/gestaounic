import { useState, useMemo, useRef, useEffect } from "react";
import { DailyData, CalculatedMetrics } from "@/types/marketing";
import { calculateMetrics, formatCurrency, formatPercent } from "@/utils/calculations";
import { CurrencyInput } from "@/components/CurrencyInput";
import { NumberInput } from "@/components/NumberInput";
import { Trash2, Plus, Loader2, GripVertical, CalendarIcon, Lock, LockOpen } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
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
  onChange,
  disabled = false
}: { 
  value: string; 
  onChange: (date: string) => void;
  disabled?: boolean;
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
    <Popover open={disabled ? false : open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={`h-8 text-xs min-w-[90px] justify-start font-normal px-2 hover:bg-accent ${disabled ? 'cursor-not-allowed opacity-90' : ''}`}
          disabled={disabled}
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
  isSelected: boolean;
  onRowClick: (id: string) => void;
  isEditingEnabled: boolean;
}

const SortableRow = ({
  row,
  metrics,
  handleCellChange,
  handleDeleteRow,
  renderMetricsCell,
  isSaving,
  isSelected,
  onRowClick,
  isEditingEnabled,
}: SortableRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id, disabled: !isEditingEnabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow 
      ref={setNodeRef} 
      style={style} 
      onClick={() => onRowClick(row.id)}
      className={`border-border hover:bg-accent/50 cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-primary ring-inset bg-primary/5' : ''
      } ${!isEditingEnabled ? 'opacity-95' : ''}`}
    >
      <TableCell
        {...(isEditingEnabled ? attributes : {})}
        {...(isEditingEnabled ? listeners : {})}
        className={`w-10 ${isEditingEnabled ? 'cursor-grab active:cursor-grabbing' : 'cursor-not-allowed'}`}
      >
        <GripVertical className={`w-4 h-4 ${isEditingEnabled ? 'text-muted-foreground' : 'text-muted-foreground/70'}`} />
      </TableCell>
      <TableCell>
        <DatePickerCell
          value={row.data}
          onChange={(newDate) => handleCellChange(row.id, "data", newDate)}
          disabled={!isEditingEnabled}
        />
      </TableCell>
      <TableCell>
        <CurrencyInput
          value={row.investimento}
          onChange={(val) => handleCellChange(row.id, "investimento", val)}
          className="h-8 text-xs min-w-[90px] bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary"
          placeholder="0,00"
          disabled={!isEditingEnabled}
        />
      </TableCell>
      <TableCell>
        <NumberInput
          value={row.cliques}
          onChange={(val) => handleCellChange(row.id, "cliques", val)}
          className="h-8 text-xs min-w-[70px] bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary"
          disabled={!isEditingEnabled}
        />
      </TableCell>
      <TableCell>{renderMetricsCell(metrics.cpc, false, true)}</TableCell>
      <TableCell>
        <NumberInput
          value={row.landingPage}
          onChange={(val) => handleCellChange(row.id, "landingPage", val)}
          className="h-8 text-xs min-w-[70px] bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary"
          disabled={!isEditingEnabled}
        />
      </TableCell>
      <TableCell>{renderMetricsCell(metrics.cpv, false, true)}</TableCell>
      <TableCell>{renderMetricsCell(metrics.cliqueLp, true)}</TableCell>
      <TableCell>
        <NumberInput
          value={row.leadTelegram}
          onChange={(val) => handleCellChange(row.id, "leadTelegram", val)}
          className="h-8 text-xs min-w-[70px] bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary"
          disabled={!isEditingEnabled}
        />
      </TableCell>
      <TableCell>
        <NumberInput
          value={row.saidaTelegram}
          onChange={(val) => handleCellChange(row.id, "saidaTelegram", val)}
          className="h-8 text-xs min-w-[70px] bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary"
          disabled={!isEditingEnabled}
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
          disabled={!isEditingEnabled}
        />
      </TableCell>
      <TableCell>{renderMetricsCell(metrics.custoCadastro, false, true)}</TableCell>
      <TableCell>{renderMetricsCell(metrics.leadCadastro, true)}</TableCell>
      <TableCell>
        <NumberInput
          value={row.ftd}
          onChange={(val) => handleCellChange(row.id, "ftd", val)}
          className="h-8 text-xs min-w-[70px] bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary"
          disabled={!isEditingEnabled}
        />
      </TableCell>
      <TableCell>
        <CurrencyInput
          value={row.valorFtd}
          onChange={(val) => handleCellChange(row.id, "valorFtd", val)}
          className="h-8 text-xs min-w-[90px] bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary"
          disabled={!isEditingEnabled}
        />
      </TableCell>
      <TableCell>{renderMetricsCell(metrics.custoFtd, false, true)}</TableCell>
      <TableCell>{renderMetricsCell(metrics.cadastroFtd, true)}</TableCell>
      <TableCell>
        <NumberInput
          value={row.depositos}
          onChange={(val) => handleCellChange(row.id, "depositos", val)}
          className="h-8 text-xs min-w-[70px] bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary"
          disabled={!isEditingEnabled}
        />
      </TableCell>
      <TableCell>
        <CurrencyInput
          value={row.valorDepositos}
          onChange={(val) => handleCellChange(row.id, "valorDepositos", val)}
          className="h-8 text-xs min-w-[90px] bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary"
          disabled={!isEditingEnabled}
        />
      </TableCell>
      <TableCell>
        <CurrencyInput
          value={row.rev10}
          onChange={(val) => handleCellChange(row.id, "rev10", val)}
          className="h-8 text-xs min-w-[90px] bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary"
          disabled={!isEditingEnabled}
        />
      </TableCell>
      <TableCell>
        <CurrencyInput
          value={row.vendas}
          onChange={(val) => handleCellChange(row.id, "vendas", val)}
          className="h-8 text-xs min-w-[90px] bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary"
          disabled={!isEditingEnabled}
        />
      </TableCell>
      <TableCell>
        <CurrencyInput
          value={row.taxa}
          onChange={(val) => handleCellChange(row.id, "taxa", val)}
          className="h-8 text-xs min-w-[90px] bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary"
          disabled={!isEditingEnabled}
        />
      </TableCell>
      <TableCell>
        <CurrencyInput
          value={row.saque}
          onChange={(val) => handleCellChange(row.id, "saque", val)}
          className="h-8 text-xs min-w-[90px] bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary"
          disabled={!isEditingEnabled}
        />
      </TableCell>
      <TableCell>
        <CurrencyInput
          value={row.expert}
          onChange={(val) => handleCellChange(row.id, "expert", val)}
          className="h-8 text-xs min-w-[90px] bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary"
          disabled={!isEditingEnabled}
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
          disabled={isSaving || !isEditingEnabled}
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
  
  // Estado do modo de edição
  const [isEditingEnabled, setIsEditingEnabled] = useState(false);
  const [lastEditTime, setLastEditTime] = useState<number>(Date.now());
  const [columnWidths, setColumnWidths] = useState<number[]>([]);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [headerPosition, setHeaderPosition] = useState({ left: 0, width: 0 });
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
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

  // Medir larguras reais das colunas do header original
  const measureWidths = () => {
    if (!headerRef.current) return;
    
    const headerCells = headerRef.current.querySelectorAll('th');
    const widths = Array.from(headerCells).map(cell => cell.getBoundingClientRect().width);
    setColumnWidths(widths);
  };

  // Capturar referência do scroll container e sincronizar scroll
  useEffect(() => {
    // Não rodar durante loading, refs não existem ainda
    if (isLoading) return;
    
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
  }, [isLoading]);

  // Atualizar posição do header flutuante, verificar se a tabela está ativa e detectar floating header
  useEffect(() => {
    // Não rodar durante loading, refs não existem ainda
    if (isLoading) return;
    
    const HEADER_HEIGHT = 48; // Altura do header (h-12 = 48px)
    let rafId: number;
    
    const updatePosition = () => {
      if (tableContainerRef.current && headerRef.current) {
        const containerRect = tableContainerRef.current.getBoundingClientRect();
        setHeaderPosition({ left: containerRect.left, width: containerRect.width });
        
        // A tabela está "ativa" quando:
        // 1. O topo da tabela já passou do topo da viewport (rect.top <= 10)
        // 2. O fundo da tabela ainda está visível (rect.bottom > HEADER_HEIGHT + 10)
        const active = containerRect.top <= 10 && containerRect.bottom > HEADER_HEIGHT + 10;
        setIsTableActive(active);
        
        // Detectar quando o header original sai da tela usando getBoundingClientRect
        const headerRect = headerRef.current.getBoundingClientRect();
        const shouldFloat = headerRect.bottom <= 0;
        setShowFloatingHeader(shouldFloat);
        
        // Medir larguras das colunas
        measureWidths();
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
    // Segunda tentativa para garantir medições corretas
    const timeoutId2 = setTimeout(updatePosition, 300);
    
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
      window.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', onScroll);
      document.removeEventListener('scroll', onScroll, { capture: true });
      scrollableParents.forEach(p => p.removeEventListener('scroll', onScroll));
    };
  }, [isLoading, data]);

  // displayedData continua igual

  const displayedData = useMemo(() => {
    if (rowLimit === "unlimited" || data.length <= 20) {
      return data;
    }
    // Pega as últimas N linhas (mais recentes)
    return data.slice(-rowLimit);
  }, [data, rowLimit]);

  // Auto-desabilitar edição após 5 minutos de inatividade
  useEffect(() => {
    if (!isEditingEnabled) return;
    
    const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutos
    
    const checkInactivity = () => {
      if (Date.now() - lastEditTime > INACTIVITY_TIMEOUT) {
        setIsEditingEnabled(false);
        toast.info("Edição desativada por inatividade", {
          description: "Ative novamente para continuar editando"
        });
      }
    };
    
    const intervalId = setInterval(checkInactivity, 30000); // Verifica a cada 30s
    
    return () => clearInterval(intervalId);
  }, [isEditingEnabled, lastEditTime]);

  const handleCellChange = (id: string, field: keyof DailyData, value: string | number) => {
    setLastEditTime(Date.now()); // Reseta timer de inatividade
    
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
        
        const updatedRow = { ...row, [field]: numValue };
        // Auto-preenche Taxa (7%) e Expert (3%) com base em Valor Depósitos
        if (field === "valorDepositos" && typeof numValue === "number") {
          updatedRow.taxa = Number((numValue * 0.07).toFixed(2));
          updatedRow.expert = Number((numValue * 0.03).toFixed(2));
        }
        return updatedRow;
      }
      return row;
    });
    onDataChange(updatedData);
  };

  const handleAddRow = async () => {
    // Habilita edição automaticamente ao adicionar linha
    setIsEditingEnabled(true);
    setLastEditTime(Date.now());
    
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
        <div className="flex items-center gap-4">
          {/* Toggle de edição */}
          <div className="flex items-center gap-2">
            {isEditingEnabled ? (
              <LockOpen className="w-4 h-4 text-primary" />
            ) : (
              <Lock className="w-4 h-4 text-muted-foreground" />
            )}
            <Switch
              checked={isEditingEnabled}
              onCheckedChange={(checked) => {
                setIsEditingEnabled(checked);
                if (checked) setLastEditTime(Date.now());
              }}
            />
            <Label className="text-sm text-muted-foreground">
              {isEditingEnabled ? "Editando" : "Bloqueado"}
            </Label>
          </div>
          
          <Button onClick={handleAddRow} size="sm" className="gap-2" disabled={isSaving}>
            <Plus className="w-4 h-4" />
            Nova Linha
          </Button>
        </div>
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

      {/* Botão Flutuante (FAB) para adicionar nova linha */}
      {showFloatingHeader && isTableActive && (
        <button
          onClick={handleAddRow}
          disabled={isSaving}
          className="fixed bottom-6 right-6 z-50 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg shadow-primary/25 transition-all duration-300 ease-out flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed animate-in fade-in slide-in-from-bottom-4"
          style={{ 
            width: '48px',
            height: '48px' 
          }}
          title="Adicionar nova linha"
        >
          <Plus className="h-6 w-6" />
        </button>
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
                        isSelected={selectedRowId === row.id}
                        onRowClick={(id) => setSelectedRowId(id)}
                        isEditingEnabled={isEditingEnabled}
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
