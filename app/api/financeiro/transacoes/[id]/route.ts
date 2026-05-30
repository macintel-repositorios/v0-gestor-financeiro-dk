import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { categoria } = await request.json()
    
    if (!categoria) {
      return NextResponse.json({ success: false, error: "Categoria é obrigatória" }, { status: 400 })
    }

    await pool.execute(
      `UPDATE transacoes_financeiras SET categoria = ? WHERE id = ?`,
      [categoria, id]
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Erro ao atualizar categoria:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    await pool.execute(
      `UPDATE transacoes_financeiras SET ativo = 0 WHERE id = ?`,
      [id]
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Erro ao deletar transação:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
