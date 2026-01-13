import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { formatCurrencyInput, parseCurrencyInput } from "@/utils/calculations";

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
}

export const CurrencyInput = ({ value, onChange, className, placeholder }: CurrencyInputProps) => {
  const [displayValue, setDisplayValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Sincroniza com valor externo quando não está focado
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatCurrencyInput(value));
    }
  }, [value, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    // Ao focar, mostra valor sem formatação para facilitar edição
    if (value !== 0) {
      setDisplayValue(String(value).replace(".", ","));
    } else {
      setDisplayValue("");
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Ao sair, converte e formata
    const numValue = parseCurrencyInput(displayValue);
    onChange(numValue);
    setDisplayValue(formatCurrencyInput(numValue));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Permite apenas números, vírgula, ponto e sinal de menos
    const raw = e.target.value.replace(/[^\d.,-]/g, "");
    setDisplayValue(raw);
  };

  return (
    <Input
      type="text"
      inputMode="decimal"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={className}
      placeholder={placeholder}
    />
  );
};
