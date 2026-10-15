import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

// Assinatura (imagem) usada no final dos e-mails de marketing. Uma única por vez (tabela email_assinatura).
const MAX_BYTES = 1024 * 1024 // 1 MB

export async function GET() {
  try {
    const rows: any = await query(
      `SELECT id, nome, dados, formato, tamanho, dimensoes FROM email_assinatura ORDER BY id DESC LIMIT 1`
    )
    return NextResponse.json({ success: true, data: rows[0] || null })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { nome, dados, dimensoes } = await request.json()
    const m = String(dados || "").match(/^data:image\/(png|jpe?g);base64,(.+)$/)
    if (!m) {
      return NextResponse.json({ success: false, message: "Envie uma imagem PNG ou JPG" }, { status: 400 })
    }
    const tamanho = Buffer.from(m[2], "base64").length
    if (tamanho > MAX_BYTES) {
      return NextResponse.json({ success: false, message: "A imagem deve ter no máximo 1 MB" }, { status: 400 })
    }
    const formato = m[1] === "png" ? "png" : "jpg"

    await query(`DELETE FROM email_assinatura`)
    await query(
      `INSERT INTO email_assinatura (nome, dados, formato, tamanho, dimensoes) VALUES (?, ?, ?, ?, ?)`,
      [nome || `assinatura.${formato}`, dados, formato, tamanho, dimensoes || null]
    )
    return NextResponse.json({ success: true, message: "Assinatura salva" })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    await query(`DELETE FROM email_assinatura`)
    return NextResponse.json({ success: true, message: "Assinatura removida" })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
