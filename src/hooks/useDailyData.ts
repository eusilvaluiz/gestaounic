import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DailyData } from "@/types/marketing";
import { useToast } from "@/hooks/use-toast";

interface DbDailyData {
  id: string;
  data: string;
  investimento: number;
  cliques: number;
  landing_page: number;
  lead_telegram: number;
  saida_telegram: number;
  cadastros: number;
  ftd: number;
  valor_ftd: number;
  depositos: number;
  valor_depositos: number;
  rev10: number;
  vendas: number;
  sort_order: number;
}

const mapDbToLocal = (row: DbDailyData): DailyData => ({
  id: row.id,
  data: row.data,
  investimento: Number(row.investimento),
  cliques: row.cliques,
  landingPage: row.landing_page,
  leadTelegram: row.lead_telegram,
  saidaTelegram: row.saida_telegram,
  cadastros: row.cadastros,
  ftd: row.ftd,
  valorFtd: Number(row.valor_ftd),
  depositos: row.depositos,
  valorDepositos: Number(row.valor_depositos),
  rev10: Number(row.rev10),
  vendas: row.vendas,
  sortOrder: row.sort_order,
});

const mapLocalToDb = (row: DailyData): Omit<DbDailyData, 'id'> & { id?: string } => ({
  id: row.id,
  data: row.data,
  investimento: row.investimento,
  cliques: row.cliques,
  landing_page: row.landingPage,
  lead_telegram: row.leadTelegram,
  saida_telegram: row.saidaTelegram,
  cadastros: row.cadastros,
  ftd: row.ftd,
  valor_ftd: row.valorFtd,
  depositos: row.depositos,
  valor_depositos: row.valorDepositos,
  rev10: row.rev10,
  vendas: row.vendas,
  sort_order: row.sortOrder ?? 0,
});

export const useDailyData = () => {
  const [data, setData] = useState<DailyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Fetch data from database
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: rows, error } = await supabase
        .from("daily_data")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;

      if (rows && rows.length > 0) {
        setData(rows.map(mapDbToLocal));
      }
    } catch (error) {
      console.error("Error fetching daily data:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados do banco.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Save/update a single row
  const saveRow = useCallback(async (row: DailyData) => {
    try {
      setIsSaving(true);
      const dbRow = mapLocalToDb(row);
      
      const { error } = await supabase
        .from("daily_data")
        .upsert(dbRow as any, { onConflict: "id" });

      if (error) throw error;
    } catch (error) {
      console.error("Error saving row:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [toast]);

  // Add new row
  const addRow = useCallback(async (): Promise<DailyData | null> => {
    try {
      setIsSaving(true);
      // Get max sort_order to place new row at the end
      const maxSortOrder = data.length > 0 
        ? Math.max(...data.map(d => d.sortOrder ?? 0)) 
        : 0;

      const newRow = {
        data: new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        investimento: 0,
        cliques: 0,
        landing_page: 0,
        lead_telegram: 0,
        saida_telegram: 0,
        cadastros: 0,
        ftd: 0,
        valor_ftd: 0,
        depositos: 0,
        valor_depositos: 0,
        rev10: 0,
        vendas: 0,
        sort_order: maxSortOrder + 1,
      };

      const { data: inserted, error } = await supabase
        .from("daily_data")
        .insert(newRow)
        .select()
        .single();

      if (error) throw error;

      const mappedRow = mapDbToLocal(inserted);
      setData(prev => [...prev, mappedRow]);
      
      toast({
        title: "Linha adicionada",
        description: "Nova linha criada com sucesso.",
      });
      
      return mappedRow;
    } catch (error) {
      console.error("Error adding row:", error);
      toast({
        title: "Erro ao adicionar",
        description: "Não foi possível adicionar nova linha.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [toast]);

  // Delete row
  const deleteRow = useCallback(async (id: string) => {
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from("daily_data")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setData(prev => prev.filter(row => row.id !== id));
      
      toast({
        title: "Linha removida",
        description: "Linha excluída com sucesso.",
      });
    } catch (error) {
      console.error("Error deleting row:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a linha.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [toast]);

  // Reorder rows (for drag and drop)
  const reorderRows = useCallback(async (activeId: string, overId: string) => {
    if (activeId === overId) return;

    try {
      setIsSaving(true);
      
      const oldIndex = data.findIndex(row => row.id === activeId);
      const newIndex = data.findIndex(row => row.id === overId);
      
      if (oldIndex === -1 || newIndex === -1) return;

      // Create new array with reordered items
      const newData = [...data];
      const [movedItem] = newData.splice(oldIndex, 1);
      newData.splice(newIndex, 0, movedItem);

      // Update sort_order for all items
      const updatedData = newData.map((row, index) => ({
        ...row,
        sortOrder: index + 1,
      }));

      setData(updatedData);

      // Save new order to database
      const updates = updatedData.map(row => ({
        id: row.id,
        sort_order: row.sortOrder,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("daily_data")
          .update({ sort_order: update.sort_order })
          .eq("id", update.id);
        
        if (error) throw error;
      }
    } catch (error) {
      console.error("Error reordering rows:", error);
      toast({
        title: "Erro ao reordenar",
        description: "Não foi possível salvar a nova ordem.",
        variant: "destructive",
      });
      // Refetch to restore correct order
      fetchData();
    } finally {
      setIsSaving(false);
    }
  }, [data, toast, fetchData]);

  // Update local state and save to database
  const updateData = useCallback((newData: DailyData[]) => {
    const oldData = data;
    setData(newData);
    
    // Find changed rows and save them
    newData.forEach(row => {
      const oldRow = oldData.find(r => r.id === row.id);
      if (!oldRow || JSON.stringify(oldRow) !== JSON.stringify(row)) {
        saveRow(row);
      }
    });
  }, [data, saveRow]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    setData: updateData,
    isLoading,
    isSaving,
    addRow,
    deleteRow,
    reorderRows,
    refetch: fetchData,
  };
};
