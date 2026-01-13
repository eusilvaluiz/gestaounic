import { useState, useEffect, forwardRef } from "react";
import { Input } from "@/components/ui/input";

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ value, onChange, className, placeholder }, ref) => {
    const [displayValue, setDisplayValue] = useState("");
    const [isFocused, setIsFocused] = useState(false);

    // Sincroniza com valor externo quando não está focado
    useEffect(() => {
      if (!isFocused) {
        setDisplayValue(value === 0 ? "0" : String(value));
      }
    }, [value, isFocused]);

    const handleFocus = () => {
      setIsFocused(true);
      setDisplayValue(String(value));
    };

    const handleBlur = () => {
      setIsFocused(false);
      const numValue = parseInt(displayValue, 10) || 0;
      onChange(numValue);
      setDisplayValue(numValue === 0 ? "0" : String(numValue));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Permite apenas números
      const raw = e.target.value.replace(/[^\d]/g, "");
      setDisplayValue(raw);
    };

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={`${className} ${value === 0 && !isFocused ? 'text-muted-foreground' : ''}`}
        placeholder={placeholder}
      />
    );
  }
);

NumberInput.displayName = "NumberInput";
