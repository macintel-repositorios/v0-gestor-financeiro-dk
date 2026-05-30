import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET() {
  try {
    const [rows] = await pool.execute(`
      SELECT c.*,
        (SELECT GROUP_CONCAT(ano_mes) FROM extratos_importados WHERE conta_id = c.id) as periodos_importados
      FROM contas_financeiras c
      WHERE c.ativo = 1
      ORDER BY c.nome ASC
    `)
    return NextResponse.json({ success: true, data: rows })
  } catch (error: any) {
    console.error("Erro ao buscar contas:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { nome, tipo, saldo_inicial, data_saldo_inicial } = await request.json()
    if (!nome || !tipo) {
      return NextResponse.json({ success: false, error: "Nome e tipo são obrigatórios" }, { status: 400 })
    }
    const finalDate = data_saldo_inicial || '2025-12-30'
    const [result] = await pool.execute(
      `INSERT INTO contas_financeiras (nome, tipo, saldo_inicial, data_saldo_inicial, ativo) VALUES (?, ?, ?, ?, 1)`,
      [nome, tipo, parseFloat(saldo_inicial) || 0.00, finalDate]
    )
    return NextResponse.json({
      success: true,
      data: { id: (result as any).insertId, nome, tipo, saldo_inicial, data_saldo_inicial: finalDate }
    })
  } catch (error: any) {
    console.error("Erro ao criar conta:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
