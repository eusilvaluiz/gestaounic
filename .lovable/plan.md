## Objetivo

Criar um webhook receptor que a Unic Broker chama sempre que acontecer um evento (cadastro, FTD, depósito, saque). O sistema atualiza automaticamente a linha do dia em `daily_data` e a tela atualiza em tempo real, sem precisar dar refresh.

## Como vai funcionar

```text
Unic Broker  ──POST──▶  Edge Function (URL fixa + token)
                              │
                              ▼
                       Acha/cria linha do
                       dia em daily_data
                              │
                              ▼
                       Incrementa o campo
                       (cadastros++, ftd++,
                        valor_depositos+=X...)
                              │
                              ▼
                       Recalcula taxa (7%)
                       e expert (3%)
                              │
                              ▼
                  Realtime atualiza a tela 🟢
```

## O que você (dono da Unic) vai precisar fazer

Depois que eu implementar, você recebe:
- **Uma URL** tipo: `https://...supabase.co/functions/v1/broker-webhook`
- **Um token secreto** (eu gero) que você cola no painel da Unic Broker

E na Unic Broker você configura o webhook pra mandar POST nessa URL com header `Authorization: Bearer SEU_TOKEN` toda vez que acontecer um evento.

## Formato que a Unic vai mandar (eu defino, você implementa do lado da corretora)

```json
{
  "event": "deposit",          // cadastro | ftd | deposit | withdrawal
  "amount": 150.00,            // valor (só pra ftd, deposit, withdrawal)
  "date": "2026-05-07",        // data do evento (opcional, default = hoje)
  "user_id": "abc123"          // opcional, só pra log
}
```

Cada tipo de evento atualiza um campo:

| event | Campo atualizado |
|---|---|
| `cadastro` | `cadastros += 1` |
| `ftd` | `ftd += 1` e `valor_ftd += amount` |
| `deposit` | `depositos += 1` e `valor_depositos += amount` (e recalcula taxa/expert) |
| `withdrawal` | `saque += amount` |

## Implementação (passos técnicos)

1. **Criar secret** `UNIC_WEBHOOK_TOKEN` (token aleatório que valida quem está chamando)
2. **Criar edge function** `broker-webhook` (pública, sem JWT) que:
   - Valida o header `Authorization`
   - Valida o payload com Zod
   - Busca a linha de `daily_data` da data informada (cria se não existir)
   - Incrementa o campo correspondente ao evento
   - Recalcula `taxa` e `expert` se mudou `valor_depositos`
3. **Habilitar Realtime** na tabela `daily_data` pra tela atualizar sozinha
4. **Adaptar `useDailyData`** pra escutar mudanças em tempo real
5. **Criar tela de configuração** (`/integracao` ou modal nas configurações) que mostra a URL do webhook + botão pra copiar token

## O que NÃO muda

- Você continua editando manualmente `Investimento`, `Cliques`, `Landing Page`, `Lead Telegram`, etc. (esses não vêm da corretora)
- `Taxa` e `Expert` continuam sendo calculados automaticamente como já fazem
- Os campos preenchidos pelo webhook ainda podem ser editados manualmente se quiser corrigir

## Pendências (você me responde depois, não trava agora)

- Confirmar se a Unic permite configurar URL + header `Authorization` no webhook (90% das plataformas permitem)
- Se quiser, eu adapto o formato do payload pro que for mais fácil de você emitir do lado da Unic
