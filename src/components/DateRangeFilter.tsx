import { useState } from "react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
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
    case "custom":
      return customRange || { from: startOfDay(subDays(today, 6)), to: endOfDay(today) };
    default:
      return { from: startOfDay(subDays(today, 6)), to: endOfDay(today) };
  }
};

export const DateRangeFilter = ({ value, customRange, onChange }: DateRangeFilterProps) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [tempRange, setTempRange] = useState<{ from?: Date; to?: Date }>({
    from: customRange?.from,
    to: customRange?.to,
  });

  const currentRange = getDateRangeFromOption(value, customRange);
  
  const getDisplayLabel = () => {
    const option = filterOptions.find(o => o.value === value);
    if (value === "custom" && customRange) {
      return `${format(customRange.from, "dd/MM", { locale: ptBR })} - ${format(customRange.to, "dd/MM", { locale: ptBR })}`;
    }
    return option?.label || "Últimos 7 dias";
  };

  const handleOptionChange = (newValue: string) => {
    const option = newValue as DateRangeOption;
    if (option === "custom") {
      setIsCalendarOpen(true);
      setTempRange({ from: currentRange.from, to: currentRange.to });
    } else {
      onChange(option);
    }
  };

  const handleCalendarSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range) {
      setTempRange(range);
    }
  };

  const handleApplyCustomRange = () => {
    if (tempRange.from && tempRange.to) {
      onChange("custom", { 
        from: startOfDay(tempRange.from), 
        to: endOfDay(tempRange.to) 
      });
      setIsCalendarOpen(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Período:</span>
      
      <Select value={value} onValueChange={handleOptionChange}>
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
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <span className="hidden" />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
          <div className="p-3">
            <Calendar
              mode="range"
              selected={tempRange as { from: Date; to: Date }}
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
                disabled={!tempRange.from || !tempRange.to}
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
