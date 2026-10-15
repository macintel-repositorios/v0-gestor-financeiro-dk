import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const temContrato = searchParams.get("tem_contrato") // "1", "0", ou null (todos)
    const distanciaMax = searchParams.get("distancia_max") // km máximo
    const distanciaMin = searchParams.get("distancia_min") // km mínimo
    const cidade = searchParams.get("cidade")
    const estado = searchParams.get("estado")
    const tiposEmail = searchParams.get("tipos_email") // "principal,sindico,extras"
    const search = searchParams.get("search")

    let sql = `
      SELECT
        id, nome, codigo, email, emails_extras, email_sindico, email_adm,
        cidade, estado, distancia_km, tem_contrato
      FROM clientes
      WHERE (status IS NULL OR status != 'inativo')
    `

    const params: any[] = []

    if (temContrato === "1" || temContrato === "0") {
      sql += ` AND tem_contrato = ?`
      params.push(Number(temContrato))
    }

    if (distanciaMax) {
      sql += ` AND distancia_km <= ?`
      params.push(Number(distanciaMax))
    }

    if (distanciaMin) {
      sql += ` AND distancia_km >= ?`
      params.push(Number(distanciaMin))
    }

    if (cidade && cidade.trim()) {
      sql += ` AND cidade LIKE ?`
      params.push(`%${cidade.trim().toUpperCase()}%`)
    }

    if (estado && estado.trim()) {
      sql += ` AND estado = ?`
      params.push(estado.trim().toUpperCase())
    }

    if (search && search.trim()) {
      sql += ` AND (nome LIKE ? OR codigo LIKE ?)`
      params.push(`%${search.trim()}%`, `%${search.trim()}%`)
    }

    sql += ` ORDER BY nome`

    const clientes = (await query(sql, params)) as any[]

    // Montar lista de destinatários expandida por tipo de email
    const tipos = tiposEmail ? tiposEmail.split(",") : ["principal", "sindico", "extras"]
    const destinatarios: {
      cliente_id: number
      cliente_nome: string
      email: string
      tipo: string
      cidade: string
      estado: string
      distancia_km: number
      tem_contrato: number
    }[] = []

    for (const c of clientes) {
      if (tipos.includes("principal") && c.email) {
        destinatarios.push({
          cliente_id: c.id,
          cliente_nome: c.nome,
          email: c.email,
          tipo: "principal",
          cidade: c.cidade,
          estado: c.estado,
          distancia_km: c.distancia_km,
          tem_contrato: c.tem_contrato,
        })
      }
      if (tipos.includes("sindico") && c.email_sindico) {
        destinatarios.push({
          cliente_id: c.id,
          cliente_nome: c.nome,
          email: c.email_sindico,
          tipo: "sindico",
          cidade: c.cidade,
          estado: c.estado,
          distancia_km: c.distancia_km,
          tem_contrato: c.tem_contrato,
        })
      }
      if (tipos.includes("extras") && c.emails_extras) {
        let extras: string[] = []
        try {
          extras = typeof c.emails_extras === "string" ? JSON.parse(c.emails_extras) : c.emails_extras
        } catch {}
        for (const em of extras) {
          if (em && em.trim()) {
            destinatarios.push({
              cliente_id: c.id,
              cliente_nome: c.nome,
              email: em.trim().toLowerCase(),
              tipo: "contato_extra",
              cidade: c.cidade,
              estado: c.estado,
              distancia_km: c.distancia_km,
              tem_contrato: c.tem_contrato,
            })
          }
        }
      }
    }

    // Deduplicar por email (manter primeiro encontrado)
    const vistos = new Set<string>()
    const deduplicados = destinatarios.filter((d) => {
      const key = d.email.toLowerCase()
      if (vistos.has(key)) return false
      vistos.add(key)
      return true
    })

    return NextResponse.json({
      success: true,
      data: deduplicados,
      total: deduplicados.length,
      totalClientes: clientes.length,
    })
  } catch (error) {
    console.error("Erro ao buscar destinatários de marketing:", error)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}
