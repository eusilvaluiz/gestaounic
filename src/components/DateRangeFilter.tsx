import { useState, useEffect } from "react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type DateRangeOption = 
  | "today" 
  | "yesterday" 
  | "last7days" 
  | "last14days" 
  | "last30days" 
  | "maximum"
  | "custom";

export interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangeFilterProps {
  value: DateRangeOption;
  customRange?: DateRange;
  onChange: (option: DateRangeOption, customRange?: DateRange) => void;
}

const filterOptions: { value: DateRangeOption; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "yesterday", label: "Ontem" },
  { value: "last7days", label: "Últimos 7 dias" },
  { value: "last14days", label: "Últimos 14 dias" },
  { value: "last30days", label: "Últimos 30 dias" },
  { value: "maximum", label: "Máximo" },
  { value: "custom", label: "Personalizado" },
];

export const getDateRangeFromOption = (
  option: DateRangeOption,
  customRange?: DateRange
): DateRange => {
  const today = new Date();
  
  switch (option) {
    case "today":
      return { from: startOfDay(today), to: endOfDay(today) };
    case "yesterday":
      const yesterday = subDays(today, 1);
      return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
    case "last7days":
      return { from: startOfDay(subDays(today, 6)), to: endOfDay(today) };
    case "last14days":
      return { from: startOfDay(subDays(today, 13)), to: endOfDay(today) };
    case "last30days":
      return { from: startOfDay(subDays(today, 29)), to: endOfDay(today) };
    case "maximum":
      return { from: startOfDay(new Date(2000, 0, 1)), to: endOfDay(today) };
    case "custom":
      return customRange || { from: startOfDay(subDays(today, 6)), to: endOfDay(today) };
    default:
      return { from: startOfDay(subDays(today, 6)), to: endOfDay(today) };
  }
};

export const DateRangeFilter = ({ value, customRange, onChange }: DateRangeFilterProps) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [tempValue, setTempValue] = useState<DateRangeOption>(value);
  const [tempRange, setTempRange] = useState<{ from?: Date; to?: Date }>({
    from: customRange?.from,
    to: customRange?.to,
  });

  const currentRange = getDateRangeFromOption(value, customRange);

  // Sincronizar tempValue com value externo
  useEffect(() => {
    setTempValue(value);
  }, [value]);
  
  const getDisplayLabel = () => {
    // Usar tempValue para mostrar o estado atual (antes de aplicar)
    if (tempValue === "custom") {
      if (tempRange.from) {
        const toDate = tempRange.to ?? tempRange.from;
        return `${format(tempRange.from, "dd/MM", { locale: ptBR })} - ${format(toDate, "dd/MM", { locale: ptBR })}`;
      }
      return "Personalizado";
    }
    const option = filterOptions.find(o => o.value === tempValue);
    return option?.label || "Últimos 7 dias";
  };

  const handleOptionChange = (newValue: string) => {
    const option = newValue as DateRangeOption;
    if (option === "custom") {
      setTempValue("custom"); // Mostra "Personalizado" imediatamente
      setTempRange({ from: currentRange.from, to: currentRange.to });
      // Usar setTimeout para evitar conflito com o fechamento do Select
      setTimeout(() => setIsCalendarOpen(true), 100);
    } else {
      setTempValue(option);
      onChange(option);
    }
  };

  const handlePopoverOpenChange = (open: boolean) => {
    setIsCalendarOpen(open);
    // Se fechar sem aplicar, volta para o valor original
    if (!open && tempValue === "custom" && value !== "custom") {
      setTempValue(value);
    }
  };

  const handleCalendarSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range) {
      setTempRange(range);
    }
  };

  const handleApplyCustomRange = () => {
    if (tempRange.from) {
      const toDate = tempRange.to ?? tempRange.from;
      onChange("custom", { 
        from: startOfDay(tempRange.from), 
        to: endOfDay(toDate) 
      });
      setIsCalendarOpen(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Período:</span>
      
      <Select value={tempValue} onValueChange={handleOptionChange}>
        <SelectTrigger className="w-[180px] bg-card border-border">
          <SelectValue>{getDisplayLabel()}</SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          {filterOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Botão de calendário só aparece quando custom está selecionado */}
      {value === "custom" && (
        <Button 
          variant="outline" 
          size="icon" 
          className="bg-card border-border"
          onClick={() => setIsCalendarOpen(true)}
        >
          <CalendarIcon className="h-4 w-4" />
        </Button>
      )}

      {/* Popover sempre renderizado, controlado pelo estado isCalendarOpen */}
      <Popover open={isCalendarOpen} onOpenChange={handlePopoverOpenChange}>
        <PopoverTrigger asChild>
          <span className="hidden" />
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 bg-card border-border" 
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <div className="p-3">
            <Calendar
              mode="range"
              selected={tempRange.from ? { from: tempRange.from, to: tempRange.to } : undefined}
              onSelect={handleCalendarSelect}
              numberOfMonths={2}
              locale={ptBR}
              className="pointer-events-auto"
            />
            <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-border">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsCalendarOpen(false)}
              >
                Cancelar
              </Button>
                <Button 
                  size="sm" 
                  onClick={handleApplyCustomRange}
                  disabled={!tempRange.from}
                >
                  Aplicar
                </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
