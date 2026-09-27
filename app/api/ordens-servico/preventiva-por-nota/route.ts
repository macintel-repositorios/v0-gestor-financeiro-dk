import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

/**
 * Encontra a OS preventiva CONCLUÍDA ligada a uma NFS-e de contrato.
 * A nota guarda o contrato em origem_numero e o mês na descrição
 * ("Referente a preventiva realizada em MM/AAAA - Contrato ...").
 */
export async function GET(request: NextRequest) {
  try {
    const numeroNota = request.nextUrl.searchParams.get("numeroNota")
    if (!numeroNota) {
      return NextResponse.json({ success: false, message: "numeroNota é obrigatório" }, { status: 400 })
    }

    const notas: any = await query(
      `SELECT origem, origem_numero, descricao_servico FROM notas_fiscais
       WHERE numero_nfse = ? ORDER BY id DESC LIMIT 1`,
      [numeroNota]
    )
    const nota = notas[0]
    if (!nota || nota.origem !== "contrato" || !nota.origem_numero) {
      return NextResponse.json({ success: true, data: null, motivo: "Nota não é de contrato" })
    }

    // Mesma regra usada no faturamento em lote (app/contratos/page.tsx)
    const desc = String(nota.descricao_servico || "")
    const mes =
      desc.match(/(?:Ref\.|realizada em|em)\s*(\d{2}\/\d{4})/i)?.[1] || desc.match(/(\d{2}\/\d{4})/)?.[1]
    if (!mes) {
      return NextResponse.json({ success: true, data: null, motivo: "Mês da preventiva não encontrado na nota" })
    }
    const [mm, aaaa] = mes.split("/")
    const inicio = `${aaaa}-${mm}-01`

    const os: any = await query(
      `SELECT id, numero FROM ordens_servico
       WHERE contrato_numero = ? AND LOWER(tipo_servico) = 'preventiva' AND situacao = 'concluida'
         AND data_atual BETWEEN ? AND LAST_DAY(?)
       ORDER BY data_execucao DESC, id DESC LIMIT 1`,
      [nota.origem_numero, inicio, inicio]
    )

    return NextResponse.json({
      success: true,
      data: os[0] || null,
      mes,
      motivo: os[0] ? undefined : `Nenhuma OS preventiva concluída em ${mes}`,
    })
  } catch (error: any) {
    console.error("Erro ao buscar OS preventiva da nota:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
