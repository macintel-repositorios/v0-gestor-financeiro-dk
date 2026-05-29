import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Log apenas em desenvolvimento ou para ações importantes
    if (process.env.NODE_ENV === "development" && data.tipo === "login") {
      console.log(`📝 Registrando log: ${data.acao}`)
    }

    const insertQuery = `
      INSERT INTO logs_sistema (
        usuario_id, usuario_nome, usuario_email, acao, modulo, tipo,
        detalhes, ip_address, user_agent, sessao_id, tempo_sessao,
        dados_anteriores, dados_novos, data_hora
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())
    `

    const result = await query(insertQuery, [
      data.usuario_id,
      data.usuario_nome,
      data.usuario_email,
      data.acao,
      data.modulo,
      data.tipo,
      data.detalhes,
      data.ip_address,
      data.user_agent,
      data.sessao_id,
      data.tempo_sessao || null,
      data.dados_anteriores || null,
      data.dados_novos || null,
    ])

    return NextResponse.json({
      success: true,
      message: "Log registrado com sucesso",
      data: { id: result.insertId },
    })
  } catch (error) {
    console.error("❌ Erro ao registrar log:", error)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const tipo = searchParams.get("tipo") || "all"
    const modulo = searchParams.get("modulo") || "all"
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const offset = (page - 1) * limit

    const whereConditions: string[] = []
    const queryParams: any[] = []

    if (tipo !== "all") {
      whereConditions.push("tipo = ?")
      queryParams.push(tipo)
    }

    if (modulo !== "all") {
      whereConditions.push("modulo = ?")
      queryParams.push(modulo)
    }

    if (search.trim() !== "") {
      whereConditions.push("(usuario_nome LIKE ? OR usuario_email LIKE ? OR acao LIKE ? OR detalhes LIKE ?)")
      const likeSearch = `%${search}%`
      queryParams.push(likeSearch, likeSearch, likeSearch, likeSearch)
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

    const logsQuery = `
      SELECT * FROM logs_sistema 
      ${whereClause}
      ORDER BY data_hora DESC 
      LIMIT ? OFFSET ?
    `

    const logs = await query(logsQuery, [...queryParams, limit, offset])

    const countQuery = `SELECT COUNT(*) as total FROM logs_sistema ${whereClause}`
    const countResult = await query(countQuery, queryParams)
    const total = countResult[0]?.total || 0

    // Calcular estatísticas globais para os cards
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN tipo = 'login' THEN 1 ELSE 0 END) as logins,
        SUM(CASE WHEN tipo = 'logout' THEN 1 ELSE 0 END) as logouts,
        SUM(CASE WHEN tipo = 'create' THEN 1 ELSE 0 END) as creates,
        SUM(CASE WHEN tipo = 'update' THEN 1 ELSE 0 END) as updates,
        SUM(CASE WHEN tipo = 'delete' THEN 1 ELSE 0 END) as deletes,
        SUM(CASE WHEN tipo = 'error' THEN 1 ELSE 0 END) as errors
      FROM logs_sistema
    `
    const statsResult = await query(statsQuery)
    const stats = {
      total: statsResult[0]?.total || 0,
      logins: statsResult[0]?.logins || 0,
      logouts: statsResult[0]?.logouts || 0,
      creates: statsResult[0]?.creates || 0,
      updates: statsResult[0]?.updates || 0,
      deletes: statsResult[0]?.deletes || 0,
      errors: statsResult[0]?.errors || 0,
    }

    return NextResponse.json({
      success: true,
      data: logs,
      stats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("❌ Erro ao buscar logs:", error)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}
