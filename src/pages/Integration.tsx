import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Copy, ArrowLeft, DollarSign, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const BASE_WEBHOOK_URL = `https://${PROJECT_ID}.supabase.co/functions/v1/broker-webhook`;
const WEBHOOK_URL = `${BASE_WEBHOOK_URL}?broker=3x`;

const Integration = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [rateInput, setRateInput] = useState("");
  const [savedRate, setSavedRate] = useState<number | null>(null);
  const [isSavingRate, setIsSavingRate] = useState(false);
  const [ggrDate, setGgrDate] = useState("");
  const [isSyncingGgr, setIsSyncingGgr] = useState(false);
  const [metaSince, setMetaSince] = useState("");
  const [metaUntil, setMetaUntil] = useState("");
  const [isSyncingMeta, setIsSyncingMeta] = useState(false);

  const syncMeta = async () => {
    setIsSyncingMeta(true);
    const body: Record<string, string> = {};
    if (metaSince.trim()) body.since = metaSince.trim();
    if (metaUntil.trim()) body.until = metaUntil.trim();
    const { data, error } = await supabase.functions.invoke("meta-sync", { body });
    setIsSyncingMeta(false);
    if (error || (data as any)?.error) {
      toast({
        title: "Erro ao buscar tráfego",
        description: (data as any)?.error ?? error?.message ?? "Falha na consulta.",
        variant: "destructive",
      });
      return;
    }
    const d = data as any;
    const dias = (d.results ?? []).map((r: any) => r.date).join(", ");
    toast({
      title: "Tráfego atualizado",
      description: `${d.accounts} contas · dias: ${dias || "nenhum dado no período"}`,
    });
  };

  const syncGgr = async () => {
    setIsSyncingGgr(true);
    const { data, error } = await supabase.functions.invoke("ggr-sync", {
      body: ggrDate.trim() ? { date: ggrDate.trim() } : {},
    });
    setIsSyncingGgr(false);
    if (error || (data as any)?.error) {
      toast({
        title: "Erro ao buscar GGR",
        description: (data as any)?.error ?? error?.message ?? "Falha na consulta.",
        variant: "destructive",
      });
      return;
    }
    const d = data as any;
    toast({
      title: `GGR de ${d.date} atualizado`,
      description: `${d.currency} ${d.original} × ${d.rate} = R$ ${Number(d.ggr).toFixed(2).replace(".", ",")}`,
    });
  };

  useEffect(() => {
    if (!isLoading && !user) navigate("/auth");
  }, [user, isLoading, navigate]);

  const loadRate = useCallback(async () => {
    const { data } = await supabase
      .from("broker_settings")
      .select("usd_rate")
      .eq("broker", "3x")
      .maybeSingle();
    if (data) {
      const rate = Number(data.usd_rate);
      setSavedRate(rate);
      setRateInput(rate.toFixed(2).replace(".", ","));
    }
  }, []);

  useEffect(() => {
    if (user) loadRate();
  }, [user, loadRate]);

  const saveRate = async () => {
    const parsed = Number(rateInput.replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast({ title: "Cotação inválida", description: "Informe um valor como 5,20.", variant: "destructive" });
      return;
    }
    setIsSavingRate(true);
    const { error } = await supabase
      .from("broker_settings")
      .update({ usd_rate: parsed, currency: "USD" })
      .eq("broker", "3x");
    setIsSavingRate(false);
    if (error) {
      toast({ title: "Erro ao salvar cotação", description: error.message, variant: "destructive" });
      return;
    }
    setSavedRate(parsed);
    toast({ title: "Cotação salva", description: `Novos eventos da 3X usarão R$ ${parsed.toFixed(2).replace(".", ",")} por dólar.` });
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copiado!` });
  };

  const examplePayload = `{
  "event": "deposit",
  "amount": 150.00,
  "date": "2026-05-07"
}`;

  const curlExample = `curl -X POST "${WEBHOOK_URL}" \\
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \\
  -H "Content-Type: application/json" \\
  -d '${examplePayload.replace(/\n\s*/g, " ")}'`;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        <div>
          <h1 className="text-3xl font-bold">Integração com a Corretora</h1>
          <p className="text-muted-foreground mt-2">
            Configure o webhook da <strong>3X Broker</strong> para preencher automaticamente Cadastros, FTD, Depósitos e Saques.
          </p>
        </div>

        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">1. URL do Webhook (3X Broker)</h2>
          <p className="text-sm text-muted-foreground">
            Cole esta URL no painel da 3X Broker como destino do webhook (método POST). O parâmetro{" "}
            <code className="px-1 py-0.5 rounded bg-muted">?broker=3x</code> identifica a origem dos eventos.
          </p>
          <div className="flex gap-2">
            <Input value={WEBHOOK_URL} readOnly className="font-mono text-sm" />
            <Button onClick={() => copy(WEBHOOK_URL, "URL")} size="icon">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            <strong>Importante:</strong> desative o webhook no painel da Unic Broker para parar de receber os eventos dela. O histórico já registrado (até 28/07) permanece intacto na tabela.
          </p>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" /> Cotação do Dólar (3X Broker)
          </h2>
          <p className="text-sm text-muted-foreground">
            A 3X opera em <strong>dólar</strong>. Todo valor de depósito, FTD e saque recebido é multiplicado por esta
            cotação antes de entrar na planilha, então toda a matemática (taxa, expert, ROI, lucro) continua em reais.
          </p>
          <div className="flex gap-2 items-end max-w-sm">
            <div className="flex-1 space-y-1">
              <Label htmlFor="usd-rate">R$ por US$ 1,00</Label>
              <Input
                id="usd-rate"
                value={rateInput}
                onChange={(e) => setRateInput(e.target.value)}
                placeholder="5,20"
                className="font-mono"
              />
            </div>
            <Button onClick={saveRate} disabled={isSavingRate}>
              {isSavingRate ? "Salvando..." : "Salvar"}
            </Button>
          </div>
          {savedRate !== null && (
            <p className="text-xs text-muted-foreground">
              Cotação ativa: <strong>R$ {savedRate.toFixed(2).replace(".", ",")}</strong> — um depósito de US$ 50 entra
              como R$ {(savedRate * 50).toFixed(2).replace(".", ",")}. Alterar a cotação afeta apenas os eventos novos.
            </p>
          )}
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" /> GGR (3X Broker)
          </h2>
          <p className="text-sm text-muted-foreground">
            O GGR é buscado direto no painel da 3X (endpoint <code className="px-1 py-0.5 rounded bg-muted">/api/balance</code>),
            convertido pela cotação acima e gravado na coluna <strong>GGR</strong> da planilha. A sincronização roda
            automaticamente de hora em hora — use o botão para atualizar agora.
          </p>
          <div className="flex gap-2 items-end max-w-md">
            <div className="flex-1 space-y-1">
              <Label htmlFor="ggr-date">Data (opcional, AAAA-MM-DD)</Label>
              <Input
                id="ggr-date"
                value={ggrDate}
                onChange={(e) => setGgrDate(e.target.value)}
                placeholder="hoje"
                className="font-mono"
              />
            </div>
            <Button onClick={syncGgr} disabled={isSyncingGgr}>
              {isSyncingGgr ? "Buscando..." : "Atualizar GGR"}
            </Button>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" /> Tráfego (Meta Ads)
          </h2>
          <p className="text-sm text-muted-foreground">
            As colunas <strong>Investimento</strong>, <strong>Cliques</strong>, <strong>Landing Page</strong> e{" "}
            <strong>Lead Telegram</strong> são buscadas direto na Graph API (v21.0), somando todas as contas de anúncio
            da BM. Cliques = evento <code className="px-1 py-0.5 rounded bg-muted">link_click</code>, LP ={" "}
            <code className="px-1 py-0.5 rounded bg-muted">landing_page_view</code>, Lead Telegram ={" "}
            <code className="px-1 py-0.5 rounded bg-muted">enter_channel</code>. Roda automaticamente a cada 15 minutos
            (hoje e ontem) — use o botão para atualizar agora ou reprocessar um período.
          </p>
          <div className="flex gap-2 items-end flex-wrap">
            <div className="space-y-1">
              <Label htmlFor="meta-since">Início (opcional)</Label>
              <Input
                id="meta-since"
                value={metaSince}
                onChange={(e) => setMetaSince(e.target.value)}
                placeholder="AAAA-MM-DD"
                className="font-mono w-40"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="meta-until">Fim (opcional)</Label>
              <Input
                id="meta-until"
                value={metaUntil}
                onChange={(e) => setMetaUntil(e.target.value)}
                placeholder="AAAA-MM-DD"
                className="font-mono w-40"
              />
            </div>
            <Button onClick={syncMeta} disabled={isSyncingMeta}>
              {isSyncingMeta ? "Buscando..." : "Atualizar tráfego"}
            </Button>
          </div>
        </Card>






        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">2. Autenticação</h2>
          <p className="text-sm text-muted-foreground">
            A corretora precisa enviar o header abaixo em toda requisição. O token foi salvo nos secrets como{" "}
            <code className="px-1 py-0.5 rounded bg-muted">UNIC_WEBHOOK_TOKEN</code> — use o valor que você cadastrou.
          </p>
          <div className="flex gap-2">
            <Input value="Authorization: Bearer SEU_TOKEN" readOnly className="font-mono text-sm" />
            <Button onClick={() => copy("Authorization: Bearer SEU_TOKEN", "Header")} size="icon">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">3. Formato do Payload (JSON)</h2>
          <p className="text-sm text-muted-foreground">
            Cada chamada deve enviar UM evento. O sistema acha (ou cria) a linha do dia e atualiza o campo correspondente.
          </p>

          <div className="space-y-2">
            <Label>Exemplo:</Label>
            <pre className="bg-muted p-4 rounded text-sm font-mono overflow-x-auto">{examplePayload}</pre>
          </div>

          <div className="space-y-2">
            <Label>Eventos aceitos:</Label>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">event</th>
                    <th className="text-left py-2 px-3">Campos</th>
                    <th className="text-left py-2 px-3">Atualiza</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-xs">
                  <tr className="border-b">
                    <td className="py-2 px-3">cadastro</td>
                    <td className="py-2 px-3">—</td>
                    <td className="py-2 px-3">cadastros +1</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-3">ftd</td>
                    <td className="py-2 px-3">amount</td>
                    <td className="py-2 px-3">ftd +1, valor_ftd += amount</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-3">deposit</td>
                    <td className="py-2 px-3">amount</td>
                    <td className="py-2 px-3">depositos +1, valor_depositos += amount (recalcula taxa 7% e expert 3%)</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3">withdrawal</td>
                    <td className="py-2 px-3">amount</td>
                    <td className="py-2 px-3">saque += amount</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            <strong>date</strong> é opcional. Aceita <code>YYYY-MM-DD</code> ou <code>dd/MM/yy</code>. Se omitido, usa a data de hoje (fuso de São Paulo).
          </p>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">4. Teste com cURL</h2>
          <pre className="bg-muted p-4 rounded text-xs font-mono overflow-x-auto whitespace-pre-wrap">{curlExample}</pre>
          <Button onClick={() => copy(curlExample, "Comando")} variant="outline" size="sm">
            <Copy className="h-4 w-4 mr-2" /> Copiar comando
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Integration;
