import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

/**
 * Webhook do Banco Inter para Recebimento de Notificações de Cobrança
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    console.log("[Webhook Banco Inter] Evento recebido:", JSON.stringify(payload, null, 2))

    const eventos = Array.isArray(payload) ? payload : [payload]

    for (const evento of eventos) {
      const codigoSolicitacao = evento.codigoSolicitacao || evento.seuNumero
      const situacao = evento.situacao
      const valorPago = evento.valorTotalRecebido || evento.valorPago

      if (!codigoSolicitacao) continue

      console.log(`[Webhook Banco Inter] Atualizando boleto ${codigoSolicitacao} para status: ${situacao}`)

      // Mapear situação do Inter para o banco de dados
      let statusBanco = "PENDENTE"
      if (situacao === "PAGO" || situacao === "LIQUIDADO") {
        statusBanco = "PAGO"
      } else if (situacao === "CANCELADO" || situacao === "BAIXADO") {
        statusBanco = "CANCELADO"
      } else if (situacao === "VENCIDO") {
        statusBanco = "VENCIDO"
      }

      // Atualiza o boleto no banco de dados local
      await query(
        `UPDATE boletos 
         SET status = ?, 
             valor_pago = COALESCE(?, valor), 
             data_pagamento = CASE WHEN ? = 'PAGO' THEN CURRENT_TIMESTAMP ELSE data_pagamento END,
             updated_at = CURRENT_TIMESTAMP 
         WHERE asaas_id = ? OR numero_boleto = ?`,
        [statusBanco, valorPago, statusBanco, codigoSolicitacao, evento.seuNumero]
      )
    }

    return NextResponse.json({ status: "success", received: true })
  } catch (error: any) {
    console.error("[Webhook Banco Inter] Erro ao processar evento:", error)
    return NextResponse.json({ error: error.message || "Erro interno no webhook" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: "active", gateway: "Banco Inter Webhook Endpoint" })
}
