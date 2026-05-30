import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const contaId = searchParams.get("contaId")
    
    let sql = `
      SELECT t.*, c.nome as conta_nome 
      FROM transacoes_financeiras t
      JOIN contas_financeiras c ON t.conta_id = c.id
      WHERE t.ativo = 1
    `
    const params: any[] = []
    
    if (contaId) {
      sql += " AND t.conta_id = ?"
      params.push(contaId)
    }
    
    sql += " ORDER BY t.data DESC, t.id DESC"
    
    const [rows] = await pool.execute(sql, params)
    return NextResponse.json({ success: true, data: rows })
  } catch (error: any) {
    console.error("Erro ao buscar transações:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { conta_id, data, descricao, tipo, valor, categoria } = await request.json()
    if (!conta_id || !data || !descricao || !tipo || !valor) {
      return NextResponse.json({ success: false, error: "Dados obrigatórios não informados" }, { status: 400 })
    }
    const [result] = await pool.execute(
      `INSERT INTO transacoes_financeiras (conta_id, data, descricao, tipo, valor, categoria, ativo) VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [conta_id, data, descricao, tipo, parseFloat(valor), categoria || "Outros"]
    )
    return NextResponse.json({
      success: true,
      data: { id: (result as any).insertId, conta_id, data, descricao, tipo, valor, categoria }
    })
  } catch (error: any) {
    console.error("Erro ao criar transação:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
