// Helpers (client e server) para saber em qual gateway um boleto foi registrado.

type BoletoGatewayCampos = {
  id?: number | string
  inter_codigo_solicitacao?: string | null
  asaas_id?: string | null
  asaas_bankslip_url?: string | null
  asaas_invoice_url?: string | null
  pdf_url?: string | null
}

/** Boleto já registrado em algum gateway (Inter ou Asaas) — usado para evitar duplicidade. */
export function boletoEnviado(b?: BoletoGatewayCampos | null): boolean {
  return !!(b?.inter_codigo_solicitacao || b?.asaas_id)
}

export function boletoNoInter(b?: BoletoGatewayCampos | null): boolean {
  return !!b?.inter_codigo_solicitacao
}

/** URL do PDF do boleto para impressão, conforme o gateway. */
export function urlPdfBoleto(b?: BoletoGatewayCampos | null): string | null {
  if (!b) return null
  if (b.inter_codigo_solicitacao && b.id != null) return `/api/boletos/${b.id}/pdf-inter`
  return b.pdf_url || b.asaas_bankslip_url || b.asaas_invoice_url || null
}
