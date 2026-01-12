import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FinanceData } from "@/types/marketing";
import { useToast } from "@/hooks/use-toast";

interface DbFinanceData {
  id: string;
  investimento: number;
  deposito: number;
  taxa: number;
  saque: number;
  expert: number;
}

const defaultFinance: FinanceData = {
  investimento: 0,
  deposito: 0,
  taxa: 0,
  saque: 0,
  expert: 0,
};

export const useFinanceData = () => {
  const [finance, setFinance] = useState<FinanceData>(defaultFinance);
  const [financeId, setFinanceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Fetch finance data
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: rows, error } = await supabase
        .from("finance_data")
        .select("*")
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (rows) {
        setFinanceId(rows.id);
        setFinance({
          investimento: Number(rows.investimento),
          deposito: Number(rows.deposito),
          taxa: Number(rows.taxa),
          saque: Number(rows.saque),
          expert: Number(rows.expert),
        });
      }
    } catch (error) {
      console.error("Error fetching finance data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save finance data
  const saveFinance = useCallback(async (newFinance: FinanceData) => {
    try {
      setIsSaving(true);
      setFinance(newFinance);

      if (financeId) {
        // Update existing
        const { error } = await supabase
          .from("finance_data")
          .update({
            investimento: newFinance.investimento,
            deposito: newFinance.deposito,
            taxa: newFinance.taxa,
            saque: newFinance.saque,
            expert: newFinance.expert,
          })
          .eq("id", financeId);

        if (error) throw error;
      } else {
        // Insert new
        const { data: inserted, error } = await supabase
          .from("finance_data")
          .insert({
            investimento: newFinance.investimento,
            deposito: newFinance.deposito,
            taxa: newFinance.taxa,
            saque: newFinance.saque,
            expert: newFinance.expert,
          })
          .select()
          .single();

        if (error) throw error;
        if (inserted) setFinanceId(inserted.id);
      }
    } catch (error) {
      console.error("Error saving finance data:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar os dados financeiros.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [financeId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    finance,
    setFinance: saveFinance,
    isLoading,
    isSaving,
    refetch: fetchData,
  };
};
