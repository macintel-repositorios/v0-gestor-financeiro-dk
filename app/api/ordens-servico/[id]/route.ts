import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { normalizarEmail } from "@/lib/email"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    console.log("Buscando ordem de serviço com ID:", id)

    // Buscar ordem de serviço com informações do cliente
    const ordemResult = await query(
      `
      SELECT 
        os.*,
        c.id as cliente_id,
        c.nome as cliente_nome,
        c.codigo as cliente_codigo,
        c.cnpj as cliente_cnpj,
        c.cpf as cliente_cpf,
        c.endereco as cliente_endereco,
        c.telefone as cliente_telefone,
        c.email as cliente_email,
        c.cidade as cliente_cidade,
        c.estado as cliente_estado,
        c.cep as cliente_cep,
        c.bairro as cliente_bairro,       
        c.distancia_km as cliente_distancia_km
      FROM ordens_servico os
      LEFT JOIN clientes c ON os.cliente_id = c.id
      WHERE os.id = ?
    `,
      [id],
    )

    console.log("Resultado da query:", ordemResult)

    if (!ordemResult || (ordemResult as any[]).length === 0) {
      console.log("Ordem de serviço não encontrada")
      return NextResponse.json({ success: false, message: "Ordem de serviço não encontrada" }, { status: 404 })
    }

    const ordemServico = (ordemResult as any[])[0]
    console.log("Ordem encontrada:", ordemServico)

    // Buscar itens (equipamentos) da ordem de serviço
    const itensResult = await query(
      `
      SELECT 
        osi.id,
        osi.equipamento_id,
        osi.equipamento_nome,
        osi.quantidade,
        osi.observacoes,
        osi.situacao,
        osi.created_at,
        osi.updated_at,
        e.nome as equipamento_nome_atual,
        e.categoria,
        e.valor_hora,
        e.ativo
      FROM ordens_servico_itens osi
      LEFT JOIN equipamentos e ON osi.equipamento_id = e.id
      WHERE osi.ordem_servico_id = ?
      ORDER BY osi.created_at
    `,
      [id],
    )

    console.log("Itens encontrados:", itensResult)

    // Montar objeto cliente apenas com campos existentes
    const cliente = {
      id: ordemServico.cliente_id,
      nome: ordemServico.cliente_nome,
      codigo: ordemServico.cliente_codigo,
      cnpj: ordemServico.cliente_cnpj,
      cpf: ordemServico.cliente_cpf,
      endereco: ordemServico.cliente_endereco,
      telefone: ordemServico.cliente_telefone,
      email: ordemServico.cliente_email,
      cidade: ordemServico.cliente_cidade,
      estado: ordemServico.cliente_estado,
      cep: ordemServico.cliente_cep,
      bairro: ordemServico.cliente_bairro,
      distancia_km: ordemServico.cliente_distancia_km,
    }

    // Remover campos do cliente do objeto principal
    const {
      cliente_id,
      cliente_nome,
      cliente_codigo,
      cliente_cnpj,
      cliente_cpf,
      cliente_endereco,
      cliente_telefone,
      cliente_email,
      cliente_cidade,
      cliente_estado,
      cliente_cep,
      cliente_bairro,
      cliente_distancia_km,
      ...ordemLimpa
    } = ordemServico

    const response = {
      ...ordemLimpa,
      cliente,
      itens: itensResult,
    }

    console.log("Resposta final:", response)

    return NextResponse.json({
      success: true,
      data: response,
    })
  } catch (error) {
    console.error("Erro ao buscar ordem de serviço:", error)
    return NextResponse.json(
      { success: false, message: "Erro interno do servidor", error: String(error) },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await request.json()

    console.log("[v0] 📝 Atualizando ordem de serviço ID:", id)
    console.log("[v0] 📝 Dados recebidos:", data)

    const ordemAnteriorResult = await query("SELECT situacao, cliente_id FROM ordens_servico WHERE id = ?", [id])
    const ordemAnterior = (ordemAnteriorResult as any[])[0]
    const situacaoAnterior = ordemAnterior?.situacao
    const clienteId = ordemAnterior?.cliente_id

    console.log("[v0] 🔍 Situação anterior:", situacaoAnterior)
    console.log("[v0] 🔍 Cliente ID:", clienteId)

    const situacaoFinal = data.situacao || "aberta"

    const result = await query(
      `
      UPDATE ordens_servico 
      SET 
        cliente_id = ?,
        contrato_id = ?,
        contrato_numero = ?,
        tecnico_id = ?,
        tecnico_name = ?,
        tecnico_email = ?,
        data_execucao = ?,
        horario_entrada = ?,
        horario_saida = ?,
        relatorio_visita = ?,
        servico_realizado = ?,
        observacoes = ?,
        responsavel = ?,
        nome_responsavel = ?,
        situacao = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      [
        data.cliente_id,
        data.contrato_id || null,
        data.contrato_numero || null,
        data.tecnico_id || null,
        data.tecnico_name,
        normalizarEmail(data.tecnico_email),
        data.data_execucao || null,
        data.horario_entrada || null,
        data.horario_saida || null,
        data.relatorio_visita || null,
        data.servico_realizado || null,
        data.observacoes || null,
        data.responsavel || null,
        data.nome_responsavel || null,
        situacaoFinal,
        id,
      ],
    )

    console.log("[v0] ✅ Ordem atualizada, situação final:", situacaoFinal)

    if (situacaoAnterior && situacaoAnterior !== situacaoFinal && clienteId) {
      console.log("[v0] 🔔 Detectada mudança de situação:", situacaoAnterior, "→", situacaoFinal)

      // Buscar telefone do cliente para enviar notificação
      const clienteResult = await query("SELECT telefone, nome FROM clientes WHERE id = ?", [clienteId])
      const cliente = (clienteResult as any[])[0]

      console.log("[v0] 👤 Cliente encontrado:", cliente?.nome)
      console.log("[v0] 📞 Telefone original:", cliente?.telefone)

      if (cliente?.telefone) {
        let telefoneFormatado = cliente.telefone.replace(/\D/g, "")

        if (!telefoneFormatado.startsWith("55")) {
          telefoneFormatado = "55" + telefoneFormatado
        }

        console.log("[v0] 📱 Telefone formatado:", telefoneFormatado)

        // Buscar dados completos da ordem para incluir na notificação
        const ordemResult = await query(
          "SELECT numero, tipo_servico, relatorio_visita, servico_realizado, necessidades_cliente FROM ordens_servico WHERE id = ?",
          [id],
        )
        const ordem = (ordemResult as any[])[0]

        const situacaoMap: Record<string, string> = {
          aberta: "🔴 ABERTA",
          agendada: "📅 AGENDADA",
          em_andamento: "🟡 EM ANDAMENTO",
          concluida: "✅ CONCLUÍDA",
        }

        let mensagemNotificacao =
          `🔔 *Atualização de Ordem de Serviço*\n\n` +
          `Olá, *${cliente.nome}*!\n\n` +
          `A situação da sua ordem de serviço foi atualizada:\n\n` +
          `📋 *Ordem:* #${ordem?.numero}\n` +
          `🔄 *Nova situação:* ${situacaoMap[situacaoFinal] || situacaoFinal}\n\n`

        // Se a situação for concluída, incluir relatório da visita ou serviço realizado
        if (situacaoFinal === "concluida") {
          mensagemNotificacao += "✨ *O serviço foi concluído com sucesso!*\n\n"

          // Incluir necessidades do cliente se for preventiva e estiver preenchida
          if (ordem?.tipo_servico === "preventiva" && ordem?.necessidades_cliente) {
            mensagemNotificacao += `📝 *Necessidades do Cliente:*\n${ordem.necessidades_cliente}\n\n`
          }

          // Incluir relatório da visita se estiver preenchido
          if (ordem?.relatorio_visita) {
            mensagemNotificacao += `📄 *Relatório da Visita:*\n${ordem.relatorio_visita}\n\n`
          }

          // Incluir serviço realizado se estiver preenchido
          if (ordem?.servico_realizado) {
            mensagemNotificacao += `🔧 *Serviço Realizado:*\n${ordem.servico_realizado}\n\n`
          }
        }

        mensagemNotificacao += `Se tiver dúvidas, entre em contato conosco! 📞`

        console.log("[v0] 💬 Mensagem preparada:", mensagemNotificacao)

        try {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
          console.log("[v0] 🌐 URL da aplicação:", appUrl)

          const whatsappResponse = await fetch(`${appUrl}/api/whatsapp/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: telefoneFormatado,
              message: mensagemNotificacao,
            }),
          })

          const responseText = await whatsappResponse.text()
          console.log("[v0] 📡 Resposta da API WhatsApp (status):", whatsappResponse.status)
          console.log("[v0] 📡 Resposta da API WhatsApp (body):", responseText)

          if (whatsappResponse.ok) {
            console.log("[v0] ✅ Notificação enviada com sucesso!")
          } else {
            console.error("[v0] ❌ Erro ao enviar notificação:", responseText)
          }
        } catch (error) {
          console.error("[v0] ❌ Erro ao enviar notificação via WhatsApp:", error)
        }
      } else {
        console.log("[v0] ⚠️ Cliente não tem telefone cadastrado, notificação não enviada")
      }
    } else {
      console.log("[v0] ℹ️ Sem mudança de situação ou sem cliente, notificação não enviada")
    }

    return NextResponse.json({
      success: true,
      message: "Ordem de serviço atualizada com sucesso",
      situacao: situacaoFinal,
    })
  } catch (error) {
    console.error("[v0] ❌ Erro ao atualizar ordem de serviço:", error)
    return NextResponse.json(
      { success: false, message: "Erro interno do servidor", error: String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    console.log("Deletando ordem de serviço ID:", id)

    // Primeiro, deletar os itens relacionados
    await query("DELETE FROM ordens_servico_itens WHERE ordem_servico_id = ?", [id])

    // Deletar fotos relacionadas
    await query("DELETE FROM ordens_servico_fotos WHERE ordem_servico_id = ?", [id])

    // Deletar assinaturas relacionadas
    await query("DELETE FROM ordens_servico_assinaturas WHERE ordem_servico_id = ?", [id])

    // Deletar a ordem de serviço
    await query("DELETE FROM ordens_servico WHERE id = ?", [id])

    return NextResponse.json({
      success: true,
      message: "Ordem de serviço deletada com sucesso",
    })
  } catch (error) {
    console.error("Erro ao deletar ordem de serviço:", error)
    return NextResponse.json(
      { success: false, message: "Erro interno do servidor", error: String(error) },
      { status: 500 },
    )
  }
}
