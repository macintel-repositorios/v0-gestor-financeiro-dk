import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getInterAPI } from "@/lib/inter"
import { registrarEventoBoleto } from "@/lib/boletos-eventos"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Buscar boleto com dados do cliente
    const boletos = await query(
      `
      SELECT 
        b.*,
        c.id as cliente_db_id,
        c.nome as cliente_nome,
        c.email as cliente_email,
        c.cpf,
        c.cnpj,
        c.telefone,
        c.endereco,
        c.bairro,
        c.cidade,
        c.estado,
        c.cep
      FROM boletos b
      LEFT JOIN clientes c ON b.cliente_id = c.id
      WHERE b.id = ?
    `,
      [id]
    )

    if (boletos.length === 0) {
      return NextResponse.json({ success: false, message: "Boleto não encontrado" }, { status: 404 })
    }

    const boleto = boletos[0]

    // Evita duplicidade: boleto já registrado em qualquer gateway (Inter ou Asaas)
    if (boleto.inter_codigo_solicitacao || boleto.asaas_id) {
      return NextResponse.json(
        {
          success: false,
          message: boleto.inter_codigo_solicitacao
            ? "Este boleto já foi registrado no Banco Inter"
            : "Este boleto já foi enviado ao Asaas",
        },
        { status: 400 }
      )
    }

    const inter = getInterAPI()

    const cpfCnpj = (boleto.cnpj || boleto.cpf || "").replace(/\D/g, "")

    if (!cpfCnpj || cpfCnpj.length < 11) {
      return NextResponse.json(
        {
          success: false,
          message: "CPF/CNPJ do cliente é obrigatório para emitir boleto no Banco Inter",
        },
        { status: 400 }
      )
    }

    const dataVencimento = new Date(boleto.data_vencimento).toISOString().split("T")[0]

    const dataNotaFormatada = boleto.data_nota
      ? new Date(boleto.data_nota).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
        })
      : ""

    const descricao =
      boleto.numero_nota && boleto.numero_parcela && boleto.total_parcelas
        ? `NF ${boleto.numero_nota} - ${dataNotaFormatada} - Parc ${boleto.numero_parcela}/${boleto.total_parcelas}`
        : `Boleto ${boleto.numero}`

    // Emitir boleto v3 no Banco Inter
    const resInter = await inter.criarCobranca({
      seuNumero: String(boleto.numero).substring(0, 15),
      valor: Number(boleto.valor),
      dataVencimento,
      pagador: {
        cpfCnpj,
        nome: boleto.cliente_nome,
        email: boleto.cliente_email || undefined,
        telefone: boleto.telefone || undefined,
        logradouro: boleto.endereco || "Não informado",
        numero: "S/N",
        bairro: boleto.bairro || "Centro",
        cidade: boleto.cidade || "São Paulo",
        uf: boleto.estado || "SP",
        cep: (boleto.cep || "01001000").replace(/\D/g, ""),
      },
      mensagem: {
        linha1: descricao.substring(0, 78),
      },
      ...(boleto.multa != null && Number(boleto.multa) > 0
        ? { multa: { taxa: Number(boleto.multa) } }
        : {}),
      ...(boleto.juros != null && Number(boleto.juros) > 0
        ? { juros: { taxa: Number(boleto.juros) } }
        : {}),
    })

    // Atualizar banco de dados local com o código do boleto do Banco Inter
    await query(
      `
      UPDATE boletos
      SET
        inter_codigo_solicitacao = ?,
        inter_nosso_numero = ?,
        inter_linha_digitavel = ?,
        inter_barcode = ?,
        inter_pix_copia_cola = ?,
        inter_situacao = ?,
        inter_atualizado_em = NOW(),
        gateway = 'inter',
        status = 'aguardando_pagamento',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      [
        resInter.codigoSolicitacao,
        resInter.nossoNumero || null,
        resInter.linhaDigitavel || null,
        resInter.codigoBarras || null,
        resInter.pixCopiaECola || null,
        resInter.status || null,
        id,
      ]
    )

    await registrarEventoBoleto({
      boletoId: id,
      gateway: "inter",
      origem: "emissao",
      referencia: resInter.codigoSolicitacao,
      evento: "EMITIDO",
      situacao: resInter.status,
      payload: resInter,
      processado: true,
    })

    return NextResponse.json({
      success: true,
      message: "Boleto emitido e registrado no Banco Inter com sucesso!",
      data: resInter,
    })
  } catch (error: any) {
    console.error("Erro ao emitir boleto no Banco Inter:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Erro ao emitir boleto no Banco Inter: ${error.message || "Erro desconhecido"}`,
      },
      { status: 500 }
    )
  }
}
