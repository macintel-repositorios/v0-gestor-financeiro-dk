import { query } from "@/lib/db"
import { registrarEventoBoleto } from "@/lib/boletos-eventos"

/**
 * Aplica no boleto local a situação de uma cobrança do Banco Inter (v3) e registra o evento.
 * Situações v3: EMABERTO, A_RECEBER, RECEBIDO, MARCADO_RECEBIDO, ATRASADO, CANCELADO, EXPIRADO, FALHA_EMISSAO, EM_PROCESSAMENTO, PROTESTO
 */
export async function aplicarSituacaoInter(params: {
  codigoSolicitacao?: string
  seuNumero?: string
  situacao?: string
  valorRecebido?: number | string | null
  dataSituacao?: string | null
  origem?: "webhook" | "sincronizacao"
  payload?: unknown
}): Promise<{ atualizado: boolean; boletoId?: number; status?: string }> {
  const { codigoSolicitacao, seuNumero, situacao } = params
  const origem = params.origem || "webhook"
  const s = String(situacao || "").toUpperCase()

  if (!codigoSolicitacao && !seuNumero) {
    await registrarEventoBoleto({ gateway: "inter", origem, situacao: s, payload: params.payload, erro: "Evento sem identificador" })
    return { atualizado: false }
  }

  const boletos: any = await query(
    `SELECT id, status, valor, inter_situacao FROM boletos
     WHERE ${codigoSolicitacao ? "inter_codigo_solicitacao = ?" : "numero = ? AND gateway = 'inter'"} LIMIT 1`,
    [codigoSolicitacao || seuNumero]
  )
  if (boletos.length === 0) {
    console.warn(`[Banco Inter] Boleto não encontrado para ${codigoSolicitacao || seuNumero}`)
    await registrarEventoBoleto({
      gateway: "inter",
      origem,
      referencia: codigoSolicitacao || seuNumero,
      situacao: s,
      payload: params.payload,
      erro: "Boleto não encontrado",
    })
    return { atualizado: false }
  }
  const boleto = boletos[0]

  let novoStatus: string | null = null
  if (s === "RECEBIDO" || s === "MARCADO_RECEBIDO" || s === "PAGO" || s === "LIQUIDADO") novoStatus = "pago"
  else if (s === "CANCELADO" || s === "EXPIRADO" || s === "BAIXADO") novoStatus = "cancelado"
  else if (s === "ATRASADO" || s === "VENCIDO") novoStatus = "vencido"

  // Sempre guarda a última situação informada pelo Inter
  if (s) {
    await query(`UPDATE boletos SET inter_situacao = ?, inter_atualizado_em = NOW() WHERE id = ?`, [s, boleto.id])
  }

  // Sincronização sem mudança não gera histórico, para não poluir a tabela
  const mudou = !!novoStatus && boleto.status !== novoStatus
  if (origem === "webhook" || mudou || boleto.inter_situacao !== s) {
    await registrarEventoBoleto({
      boletoId: boleto.id,
      gateway: "inter",
      origem,
      referencia: codigoSolicitacao || seuNumero,
      evento: mudou ? `STATUS_${novoStatus!.toUpperCase()}` : "SITUACAO",
      situacao: s,
      payload: params.payload,
      processado: true,
    })
  }

  if (!mudou) {
    return { atualizado: false, boletoId: boleto.id, status: boleto.status }
  }

  if (novoStatus === "pago") {
    const dataPagamento = (params.dataSituacao || new Date().toISOString()).split("T")[0]
    const valorPago = params.valorRecebido != null ? Number(params.valorRecebido) : Number(boleto.valor)
    await query(
      `UPDATE boletos SET status = 'pago', data_pagamento = ?, valor_pago = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [dataPagamento, valorPago, boleto.id]
    )
  } else {
    await query(`UPDATE boletos SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [novoStatus, boleto.id])
  }

  console.log(`[Banco Inter] Boleto ${boleto.id}: ${boleto.status} -> ${novoStatus}`)
  return { atualizado: true, boletoId: boleto.id, status: novoStatus! }
}
