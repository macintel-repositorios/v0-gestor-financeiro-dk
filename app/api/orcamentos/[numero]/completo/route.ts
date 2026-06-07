import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: Promise<{ numero: string }> }) {
  try {
    const { numero } = await params

    // Buscar dados do orçamento com informações do cliente e administradora
    const orcamentoQuery = `
      SELECT 
        o.*,
        c.nome as cliente_nome,
        c.codigo as cliente_codigo,
        c.cnpj as cliente_cnpj,
        c.cpf as cliente_cpf,
        c.email as cliente_email,
        c.telefone as cliente_telefone,
        c.endereco as cliente_endereco,
        c.cidade as cliente_cidade,
        c.estado as cliente_estado,
        c.distancia_km,
        c.nome_adm,
        c.contato_adm,
        c.telefone_adm,
        c.email_adm
      FROM orcamentos o
      LEFT JOIN clientes c ON o.cliente_id = c.id
      WHERE o.numero = ?
    `

    const orcamentos = await query(orcamentoQuery, [numero]) as any[]

    if (!orcamentos || orcamentos.length === 0) {
      return NextResponse.json({ success: false, message: "Orçamento não encontrado" }, { status: 404 })
    }

    const orcamento = orcamentos[0]

    // Buscar itens do orçamento com informações dos produtos
    const itensQuery = `
      SELECT 
        oi.*,
        p.codigo as produto_codigo,
        p.descricao as produto_descricao,
        p.unidade as produto_unidade,
        p.ncm as produto_ncm,
        p.marca as marca_nome
      FROM orcamentos_itens oi
      LEFT JOIN produtos p ON oi.produto_id = p.id
      WHERE oi.orcamento_numero = ?
      ORDER BY oi.ordem ASC, oi.created_at ASC
    `

    const itens = await query(itensQuery, [numero]) as any[]

    // Format dates to YYYY-MM-DD for frontend compatibility
    if (orcamento.data_orcamento) {
      if (orcamento.data_orcamento instanceof Date) {
        orcamento.data_orcamento = orcamento.data_orcamento.toISOString().split('T')[0]
      } else if (typeof orcamento.data_orcamento === 'string') {
        orcamento.data_orcamento = orcamento.data_orcamento.split('T')[0]
      }
    }
    if (orcamento.data_inicio) {
      if (orcamento.data_inicio instanceof Date) {
        orcamento.data_inicio = orcamento.data_inicio.toISOString().split('T')[0]
      } else if (typeof orcamento.data_inicio === 'string') {
        orcamento.data_inicio = orcamento.data_inicio.split('T')[0]
      }
    }

    // Montar resposta
    const response = {
      ...orcamento,
      itens: itens || [],
    }

    return NextResponse.json({
      success: true,
      data: response,
    })
  } catch (error) {
    console.error("Erro ao buscar orçamento completo:", error)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}
