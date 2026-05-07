import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Copy, ArrowLeft } from "lucide-react";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const WEBHOOK_URL = `https://${PROJECT_ID}.supabase.co/functions/v1/broker-webhook`;

const Integration = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !user) navigate("/auth");
  }, [user, isLoading, navigate]);

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
            Configure o webhook da Unic Broker para preencher automaticamente Cadastros, FTD, Depósitos e Saques.
          </p>
        </div>

        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">1. URL do Webhook</h2>
          <p className="text-sm text-muted-foreground">
            Cole esta URL no painel da corretora como destino do webhook (método POST):
          </p>
          <div className="flex gap-2">
            <Input value={WEBHOOK_URL} readOnly className="font-mono text-sm" />
            <Button onClick={() => copy(WEBHOOK_URL, "URL")} size="icon">
              <Copy className="h-4 w-4" />
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
