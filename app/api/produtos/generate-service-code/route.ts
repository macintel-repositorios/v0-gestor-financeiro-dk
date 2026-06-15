import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

/**
 * Gera o próximo código de serviço no padrão canônico: 015 + 3 dígitos (ex: 015014).
 * Considera APENAS códigos no formato `015` + dígitos (ignora códigos legados com
 * sigla de marca, ex: 015ITB075), pega o maior número e garante unicidade.
 */
export async function GET() {
  try {
    // Maior número entre os códigos no padrão canônico 015 + 3 dígitos
    // (exclui legados malformados de 9 dígitos como 015002925 e códigos com sigla)
    const [rows] = await pool.execute(
      `SELECT CAST(SUBSTRING(codigo, 4) AS UNSIGNED) AS num
       FROM produtos
       WHERE codigo REGEXP '^015[0-9]{3}$'
       ORDER BY num DESC
       LIMIT 1`,
    )

    let proximoNumero = 1
    if (Array.isArray(rows) && rows.length > 0) {
      const num = Number((rows as any[])[0].num)
      if (!Number.isNaN(num)) proximoNumero = num + 1
    }

    // Garante unicidade: pula qualquer código que já exista
    let novoCodigo = ""
    for (let i = 0; i < 10000; i++) {
      const candidato = `015${(proximoNumero + i).toString().padStart(3, "0")}`
      const [existe] = await pool.execute("SELECT id FROM produtos WHERE codigo = ?", [candidato])
      if (!Array.isArray(existe) || existe.length === 0) {
        novoCodigo = candidato
        break
      }
    }

    if (!novoCodigo) {
      return NextResponse.json(
        { success: false, message: "Não foi possível gerar código de serviço único" },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      data: { codigo: novoCodigo },
    })
  } catch (error) {
    console.error("Erro ao gerar código de serviço:", error)
    return NextResponse.json({ success: false, message: "Erro ao gerar código de serviço" }, { status: 500 })
  }
}
