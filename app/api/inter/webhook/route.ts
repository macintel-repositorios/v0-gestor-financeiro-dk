import { type NextRequest, NextResponse } from "next/server"
import { aplicarSituacaoInter } from "@/lib/inter-status"

/**
 * Webhook do Banco Inter para Recebimento de Notificações de Cobrança (v3)
 * O Inter envia um array de cobranças com codigoSolicitacao, seuNumero, situacao, valorTotalRecebido, dataHoraSituacao
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    console.log("[Webhook Banco Inter] Evento recebido:", JSON.stringify(payload, null, 2))

    const eventos = Array.isArray(payload) ? payload : [payload]

    for (const evento of eventos) {
      await aplicarSituacaoInter({
        codigoSolicitacao: evento.codigoSolicitacao,
        seuNumero: evento.seuNumero,
        situacao: evento.situacao,
        valorRecebido: evento.valorTotalRecebido ?? evento.valorPago,
        dataSituacao: evento.dataHoraSituacao || evento.dataSituacao,
      })
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
