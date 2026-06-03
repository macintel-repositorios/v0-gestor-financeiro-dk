import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/database"

export async function GET() {
  try {
    const [rows] = await pool.execute("SELECT salario_minimo FROM equipamentos LIMIT 1")
    const salario = Array.isArray(rows) && rows.length > 0 ? rows[0].salario_minimo : 1412.00
    return NextResponse.json({ success: true, salario_minimo: Number(salario) || 1412.00 })
  } catch (error) {
    console.error("Erro ao obter salário mínimo:", error)
    return NextResponse.json({ success: false, error: "Erro ao carregar salário mínimo" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { salario_minimo } = await request.json()
    const valor = Number(salario_minimo)

    const [countRows] = await pool.execute("SELECT COUNT(*) as count FROM equipamentos")
    if ((countRows as any[])[0].count === 0) {
      await pool.execute(
        "INSERT INTO equipamentos (nome, categoria, valor_hora, descricao, ativo, salario_minimo, created_at, updated_at) VALUES ('Configuração Salário Mínimo', 'basicos', 0, 'Registro para armazenar salário mínimo', 0, ?, NOW(), NOW())",
        [valor]
      )
    } else {
      await pool.execute("UPDATE equipamentos SET salario_minimo = ?, updated_at = NOW()", [valor])
    }

    return NextResponse.json({ success: true, message: "Salário mínimo atualizado com sucesso" })
  } catch (error) {
    console.error("Erro ao salvar salário mínimo:", error)
    return NextResponse.json({ success: false, error: "Erro ao salvar salário mínimo" }, { status: 500 })
  }
}
