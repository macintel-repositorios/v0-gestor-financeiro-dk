import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get("tipo") || "dashboard"
    const periodo = searchParams.get("periodo") || "30"
    const status = searchParams.get("status") || "todos"
    const clienteId = searchParams.get("clienteId")
    const categoriaId = searchParams.get("categoriaId")
    const dataInicio = searchParams.get("dataInicio")
    const dataFim = searchParams.get("dataFim")

    console.log("Gerando relatório:", { tipo, periodo, status, clienteId, categoriaId, dataInicio, dataFim })

    // Determinar datas de início e fim
    let startDateStr = ""
    let endDateStr = ""

    if (dataInicio) {
      startDateStr = dataInicio
    } else {
      const dataLimite = new Date()
      dataLimite.setDate(dataLimite.getDate() - Number.parseInt(periodo))
      startDateStr = dataLimite.toISOString().split("T")[0]
    }

    if (dataFim) {
      endDateStr = dataFim
    } else {
      endDateStr = new Date().toISOString().split("T")[0]
    }

    let data: any = {}

    try {
      switch (tipo) {
        case "dashboard":
          // Total de clientes ativos (ativo = 1)
          const [clientesResult] = await pool.execute(`SELECT COUNT(*) as total FROM clientes WHERE ativo = 1`)

          // Total de produtos ativos (ativo = 1)
          const [produtosResult] = await pool.execute(`SELECT COUNT(*) as total FROM produtos WHERE ativo = 1`)

          // Orçamentos no período
          const [orcamentosResult] = await pool.execute(
            `SELECT 
              COUNT(*) as total,
              COUNT(CASE WHEN situacao = 'aprovado' THEN 1 END) as aprovados,
              COUNT(CASE WHEN situacao = 'pendente' THEN 1 END) as pendentes,
              COUNT(CASE WHEN situacao = 'rejeitado' THEN 1 END) as rejeitados,
              COALESCE(SUM(valor_total), 0) as valor_total
            FROM orcamentos 
            WHERE DATE(created_at) BETWEEN ? AND ?`,
            [startDateStr, endDateStr],
          )

          // Boletos no período
          const [boletosResult] = await pool.execute(
            `SELECT 
              COUNT(*) as total,
              COALESCE(SUM(valor), 0) as valor_total,
              COUNT(CASE WHEN status = 'pago' THEN 1 END) as pagos,
              COUNT(CASE WHEN status = 'pendente' AND data_vencimento < CURDATE() THEN 1 END) as vencidos,
              COUNT(CASE WHEN status = 'pendente' AND data_vencimento >= CURDATE() THEN 1 END) as pendentes
            FROM boletos 
            WHERE DATE(created_at) BETWEEN ? AND ?`,
            [startDateStr, endDateStr],
          )

          const orcamentos = (orcamentosResult as any[])[0] || {}
          const boletos = (boletosResult as any[])[0] || {}

          data = {
            periodo: dataInicio && dataFim ? `De ${dataInicio} até ${dataFim}` : `Últimos ${periodo} dias`,
            totalClientes: (clientesResult as any[])[0]?.total || 0,
            totalProdutos: (produtosResult as any[])[0]?.total || 0,
            orcamentos: {
              total: orcamentos.total || 0,
              aprovados: orcamentos.aprovados || 0,
              pendentes: orcamentos.pendentes || 0,
              rejeitados: orcamentos.rejeitados || 0,
              valorTotal: orcamentos.valor_total || 0,
            },
            boletos: {
              total: boletos.total || 0,
              valorTotal: boletos.valor_total || 0,
              pagos: boletos.pagos || 0,
              vencidos: boletos.vencidos || 0,
              pendentes: boletos.pendentes || 0,
            },
          }
          break

        case "clientes":
          let clientesQuery = `
            SELECT 
              c.id, c.codigo, c.nome, c.email, c.telefone, c.cidade, c.estado, c.created_at,
              COUNT(DISTINCT o.id) as total_orcamentos,
              COALESCE(SUM(o.valor_total), 0) as valor_orcamentos,
              COUNT(DISTINCT b.id) as total_boletos,
              COALESCE(SUM(b.valor), 0) as valor_boletos
            FROM clientes c
            LEFT JOIN orcamentos o ON c.id = o.cliente_id AND DATE(o.created_at) BETWEEN ? AND ?
            LEFT JOIN boletos b ON c.id = b.cliente_id AND DATE(b.created_at) BETWEEN ? AND ?
            WHERE c.status = 1
          `
          const clientesParams: any[] = [startDateStr, endDateStr, startDateStr, endDateStr]

          if (clienteId && clienteId !== "todos") {
            clientesQuery += ` AND c.id = ?`
            clientesParams.push(clienteId)
          }

          clientesQuery += ` GROUP BY c.id ORDER BY valor_orcamentos DESC`

          const [clientesData] = await pool.execute(clientesQuery, clientesParams)
          data = {
            clientes: clientesData,
            total: (clientesData as any[]).length,
            filtros: { clienteId, dataInicio: startDateStr, dataFim: endDateStr },
          }
          break

        case "produtos":
          let produtosQuery = `
            SELECT 
              p.id, p.codigo, p.descricao as nome, p.valor_unitario as preco_venda, 
              p.estoque as estoque_atual, p.estoque_minimo, p.tipo, p.marca, p.created_at,
              COUNT(oi.id) as vezes_vendido,
              COALESCE(SUM(oi.quantidade), 0) as quantidade_vendida,
              COALESCE(SUM(oi.valor_total), 0) as valor_vendido
            FROM produtos p
            LEFT JOIN orcamentos_itens oi ON p.id = oi.produto_id
            LEFT JOIN orcamentos o ON oi.orcamento_numero = o.numero AND DATE(o.created_at) BETWEEN ? AND ?
            WHERE p.ativo = 1
          `
          const produtosParams: any[] = [startDateStr, endDateStr]

          if (categoriaId && categoriaId !== "todos") {
            produtosQuery += ` AND p.tipo = ?`
            produtosParams.push(categoriaId)
          }

          if (status === "baixo_estoque") {
            produtosQuery += ` AND p.estoque <= p.estoque_minimo`
          } else if (status === "sem_estoque") {
            produtosQuery += ` AND p.estoque = 0`
          }

          produtosQuery += ` GROUP BY p.id ORDER BY quantidade_vendida DESC`

          const [produtosData] = await pool.execute(produtosQuery, produtosParams)

          // Buscar tipos únicos para o filtro
          const [tiposData] = await pool.execute(
            `SELECT DISTINCT tipo FROM produtos WHERE ativo = 1 AND tipo IS NOT NULL AND tipo != '' ORDER BY tipo`,
          )

          data = {
            produtos: produtosData,
            tipos: tiposData,
            total: (produtosData as any[]).length,
            filtros: { categoriaId, status, dataInicio: startDateStr, dataFim: endDateStr },
          }
          break

        case "orcamentos":
          let orcamentosQuery = `
            SELECT 
              o.id, o.numero, o.valor_total, o.situacao, o.created_at, o.validade,
              c.nome as cliente_nome, c.codigo as cliente_codigo,
              COUNT(oi.id) as total_itens,
              DATEDIFF(CURDATE(), o.created_at) as dias_criado
            FROM orcamentos o
            LEFT JOIN clientes c ON o.cliente_id = c.id
            LEFT JOIN orcamentos_itens oi ON o.numero = oi.orcamento_numero
            WHERE DATE(o.created_at) BETWEEN ? AND ?
          `
          const orcamentosParams: any[] = [startDateStr, endDateStr]

          if (status && status !== "todos") {
            orcamentosQuery += ` AND o.situacao = ?`
            orcamentosParams.push(status)
          }

          if (clienteId && clienteId !== "todos") {
            orcamentosQuery += ` AND o.cliente_id = ?`
            orcamentosParams.push(clienteId)
          }

          orcamentosQuery += ` GROUP BY o.id ORDER BY o.created_at DESC`

          const [orcamentosData] = await pool.execute(orcamentosQuery, orcamentosParams)

          // Calcular estatísticas
          const totalOrcamentos = (orcamentosData as any[]).length
          const valorTotal = (orcamentosData as any[]).reduce(
            (sum, o) => sum + (Number.parseFloat(o.valor_total) || 0),
            0,
          )
          const aprovados = (orcamentosData as any[]).filter((o) => o.situacao === "aprovado").length
          const pendentes = (orcamentosData as any[]).filter((o) => o.situacao === "pendente").length
          const rejeitados = (orcamentosData as any[]).filter((o) => o.situacao === "rejeitado").length

          data = {
            orcamentos: orcamentosData,
            total: totalOrcamentos,
            valorTotal,
            estatisticas: { aprovados, pendentes, rejeitados },
            filtros: { status, clienteId, dataInicio: startDateStr, dataFim: endDateStr },
          }
          break

        case "financeiro":
          let boletosQuery = `
            SELECT 
              b.id, b.numero, b.valor, b.data_vencimento, b.status, b.created_at,
              b.data_pagamento, b.observacoes,
              c.nome as cliente_nome, c.codigo as cliente_codigo,
              DATEDIFF(CURDATE(), b.data_vencimento) as dias_vencimento
            FROM boletos b
            LEFT JOIN clientes c ON b.cliente_id = c.id
            WHERE DATE(b.data_vencimento) BETWEEN ? AND ?
          `
          const boletosParams: any[] = [startDateStr, endDateStr]

          if (status && status !== "todos") {
            if (status === "vencidos") {
              boletosQuery += ` AND b.status = 'pendente' AND b.data_vencimento < CURDATE()`
            } else if (status === "vencer") {
              boletosQuery += ` AND b.status = 'pendente' AND b.data_vencimento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)`
            } else {
              boletosQuery += ` AND b.status = ?`
              boletosParams.push(status)
            }
          }

          if (clienteId && clienteId !== "todos") {
            boletosQuery += ` AND b.cliente_id = ?`
            boletosParams.push(clienteId)
          }

          boletosQuery += ` ORDER BY b.data_vencimento ASC`

          const [boletosData] = await pool.execute(boletosQuery, boletosParams)

          // Calcular estatísticas financeiras
          const totalBoletos = (boletosData as any[]).length
          const valorTotalBoletos = (boletosData as any[]).reduce(
            (sum, b) => sum + (Number.parseFloat(b.valor) || 0),
            0,
          )
          const boletosPagos = (boletosData as any[]).filter((b) => b.status === "pago").length
          const valorPago = (boletosData as any[])
            .filter((b) => b.status === "pago")
            .reduce((sum, b) => sum + (Number.parseFloat(b.valor) || 0), 0)
          const boletosVencidos = (boletosData as any[]).filter(
            (b) => b.status === "pendente" && new Date(b.data_vencimento) < new Date(),
          ).length
          const valorVencido = (boletosData as any[])
            .filter((b) => b.status === "pendente" && new Date(b.data_vencimento) < new Date())
            .reduce((sum, b) => sum + (Number.parseFloat(b.valor) || 0), 0)

          data = {
            boletos: boletosData,
            total: totalBoletos,
            valorTotal: valorTotalBoletos,
            estatisticas: {
              pagos: boletosPagos,
              valorPago,
              vencidos: boletosVencidos,
              valorVencido,
              pendentes: totalBoletos - boletosPagos,
              valorPendente: valorTotalBoletos - valorPago,
            },
            filtros: { status, clienteId, dataInicio: startDateStr, dataFim: endDateStr },
          }
          break

        case "ordens_servico":
          let osQuery = `
            SELECT 
              os.id, os.numero, os.cliente_id, c.nome as cliente_nome,
              os.tecnico_name, os.tipo_servico, os.data_atual, os.data_agendamento,
              os.data_execucao, COALESCE(os.situacao, 'rascunho') as situacao, os.created_at
            FROM ordens_servico os
            LEFT JOIN clientes c ON os.cliente_id = c.id
            WHERE (DATE(os.created_at) BETWEEN ? AND ? OR DATE(os.data_agendamento) BETWEEN ? AND ?)
          `
          const osParams: any[] = [startDateStr, endDateStr, startDateStr, endDateStr]

          if (status && status !== "todos") {
            osQuery += ` AND os.situacao = ?`
            osParams.push(status)
          }

          if (clienteId && clienteId !== "todos") {
            osQuery += ` AND os.cliente_id = ?`
            osParams.push(clienteId)
          }

          osQuery += ` ORDER BY os.created_at DESC`

          const [osData] = await pool.execute(osQuery, osParams)

          // Calcular estatísticas
          const totalOs = (osData as any[]).length
          const finalizadas = (osData as any[]).filter(o => o.situacao === "finalizada").length
          const agendadas = (osData as any[]).filter(o => o.situacao === "agendada").length
          const emAndamento = (osData as any[]).filter(o => o.situacao === "em_andamento").length
          const canceladas = (osData as any[]).filter(o => o.situacao === "cancelada").length
          const rascunhos = (osData as any[]).filter(o => o.situacao === "rascunho").length

          // Agrupamentos
          const tiposOsMap: Record<string, number> = {}
          const tecnicosOsMap: Record<string, number> = {}

          ;(osData as any[]).forEach(o => {
            const ts = o.tipo_servico || "NÃO ESPECIFICADO"
            tiposOsMap[ts] = (tiposOsMap[ts] || 0) + 1

            const tec = o.tecnico_name || "NÃO ESPECIFICADO"
            tecnicosOsMap[tec] = (tecnicosOsMap[tec] || 0) + 1
          })

          data = {
            ordensServico: osData,
            total: totalOs,
            estatisticas: {
              finalizadas,
              agendadas,
              emAndamento,
              canceladas,
              rascunhos,
              tipos: Object.entries(tiposOsMap).map(([nome, total]) => ({ nome, total })),
              tecnicos: Object.entries(tecnicosOsMap).map(([nome, total]) => ({ nome, total }))
            },
            filtros: { status, clienteId, dataInicio: startDateStr, dataFim: endDateStr }
          }
          break

        default:
          return NextResponse.json({ success: false, message: "Tipo de relatório inválido" }, { status: 400 })
      }

      console.log("Dados do relatório gerados:", { tipo, dataLength: JSON.stringify(data).length })

      return NextResponse.json({
        success: true,
        data,
        tipo,
        filtros: { periodo, status, clienteId, categoriaId, dataInicio: startDateStr, dataFim: endDateStr },
      })
    } catch (dbError) {
      console.error("Erro na consulta do banco:", dbError)
      return NextResponse.json(
        { success: false, message: `Erro ao consultar banco de dados: ${dbError}` },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Erro ao gerar relatório:", error)
    return NextResponse.json({ success: false, message: `Erro interno do servidor: ${error}` }, { status: 500 })
  }
}
