import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getInterAPI } from "@/lib/inter"
import { aplicarSituacaoInter } from "@/lib/inter-status"

/**
 * Consulta no Banco Inter a situação de todos os boletos Inter em aberto
 * e atualiza o banco local (alternativa ao webhook, ex.: ambiente local).
 */
export async function POST() {
  try {
    const boletos: any = await query(
      `SELECT id, inter_codigo_solicitacao FROM boletos
       WHERE inter_codigo_solicitacao IS NOT NULL
         AND status NOT IN ('pago', 'cancelado')`
    )

    const inter = getInterAPI()
    let atualizados = 0
    const erros: string[] = []

    for (const b of boletos) {
      try {
        const cob = await inter.consultarCobranca(b.inter_codigo_solicitacao)
        const r = await aplicarSituacaoInter({
          codigoSolicitacao: b.inter_codigo_solicitacao,
          situacao: cob.status,
          valorRecebido: cob.valorTotalRecebido,
          dataSituacao: cob.dataSituacao,
          origem: "sincronizacao",
          payload: cob,
        })
        if (r.atualizado) atualizados++
      } catch (e: any) {
        erros.push(`Boleto ${b.id}: ${e.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `${boletos.length} boleto(s) consultado(s), ${atualizados} atualizado(s)`,
      verificados: boletos.length,
      atualizados,
      erros,
    })
  } catch (error: any) {
    console.error("[Banco Inter] Erro ao sincronizar:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
