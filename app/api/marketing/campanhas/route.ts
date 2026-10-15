import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

// GET - Listar campanhas
export async function GET() {
  try {
    const campanhas = await query(
      `SELECT * FROM email_campanhas ORDER BY created_at DESC LIMIT 50`
    )
    return NextResponse.json({ success: true, data: campanhas })
  } catch (error) {
    console.error("Erro ao buscar campanhas:", error)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}

// POST - Criar campanha (rascunho)
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    if (!data.assunto?.trim() || !data.corpo?.trim()) {
      return NextResponse.json({ success: false, message: "Assunto e corpo são obrigatórios" }, { status: 400 })
    }

    const result: any = await query(
      `INSERT INTO email_campanhas (assunto, corpo, filtros, total_destinatarios, status, smtp_host, smtp_from, created_at)
       VALUES (?, ?, ?, ?, 'rascunho', ?, ?, NOW())`,
      [
        data.assunto,
        data.corpo,
        data.filtros ? JSON.stringify(data.filtros) : null,
        data.total_destinatarios || 0,
        data.smtp_host || null,
        data.smtp_from || null,
      ]
    )

    return NextResponse.json({
      success: true,
      message: "Campanha criada",
      data: { id: result.insertId },
    })
  } catch (error) {
    console.error("Erro ao criar campanha:", error)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}
