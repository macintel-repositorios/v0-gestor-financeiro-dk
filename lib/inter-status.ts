import { query } from "@/lib/db"

/**
 * Aplica no boleto local a situação de uma cobrança do Banco Inter (v3).
 * Situações v3: EMABERTO, A_RECEBER, RECEBIDO, MARCADO_RECEBIDO, ATRASADO, CANCELADO, EXPIRADO, FALHA_EMISSAO, EM_PROCESSAMENTO, PROTESTO
 */
export async function aplicarSituacaoInter(params: {
  codigoSolicitacao?: string
  seuNumero?: string
  situacao?: string
  valorRecebido?: number | string | null
  dataSituacao?: string | null
}): Promise<{ atualizado: boolean; boletoId?: number; status?: string }> {
  const { codigoSolicitacao, seuNumero, situacao } = params
  if (!codigoSolicitacao && !seuNumero) return { atualizado: false }

  const boletos: any = await query(
    `SELECT id, status, valor FROM boletos WHERE ${codigoSolicitacao ? "asaas_id = ?" : "numero = ? AND gateway = 'inter'"} LIMIT 1`,
    [codigoSolicitacao || seuNumero]
  )
  if (boletos.length === 0) {
    console.warn(`[Banco Inter] Boleto não encontrado para ${codigoSolicitacao || seuNumero}`)
    return { atualizado: false }
  }
  const boleto = boletos[0]

  const s = String(situacao || "").toUpperCase()
  let novoStatus: string | null = null
  if (s === "RECEBIDO" || s === "MARCADO_RECEBIDO" || s === "PAGO" || s === "LIQUIDADO") novoStatus = "pago"
  else if (s === "CANCELADO" || s === "EXPIRADO" || s === "BAIXADO") novoStatus = "cancelado"
  else if (s === "ATRASADO" || s === "VENCIDO") novoStatus = "vencido"

  if (!novoStatus || boleto.status === novoStatus) {
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
  return { atualizado: true, boletoId: boleto.id, status: novoStatus }
}
