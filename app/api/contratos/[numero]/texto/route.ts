import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

/**
 * Texto (cláusulas) de um contrato específico — permite ajustar exigências de cada cliente
 * sem alterar o modelo geral de Configurações > Termos.
 *   PUT { conteudo_contrato }        -> salva o texto deste contrato
 *   PUT { restaurarModelo: true }    -> substitui pelo texto do modelo atual (Contrato de Conservação)
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ numero: string }> }) {
  try {
    const { numero } = await params
    const body = await request.json()

    let conteudo: string = body.conteudo_contrato
    if (body.restaurarModelo) {
      const modelo: any = await query(
        `SELECT conteudo FROM termos_contratos WHERE tipo = 'contrato_conservacao' AND ativo = 1 ORDER BY updated_at DESC LIMIT 1`
      )
      if (!modelo[0]?.conteudo) {
        return NextResponse.json({ success: false, message: "Modelo de contrato não encontrado" }, { status: 404 })
      }
      conteudo = modelo[0].conteudo
    }

    if (!conteudo || !String(conteudo).trim()) {
      return NextResponse.json({ success: false, message: "O texto do contrato não pode ficar vazio" }, { status: 400 })
    }

    const r: any = await query(
      `UPDATE contratos_conservacao SET conteudo_contrato = ?, updated_at = NOW() WHERE numero = ?`,
      [conteudo, numero]
    )
    if (!r.affectedRows) {
      return NextResponse.json({ success: false, message: "Contrato não encontrado" }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: { conteudo_contrato: conteudo } })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
