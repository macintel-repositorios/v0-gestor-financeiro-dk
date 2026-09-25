import { query } from "@/lib/db"

/**
 * Registra no histórico (boletos_eventos) um evento recebido/gerado por um gateway.
 * Nunca lança erro: falha ao registrar o histórico não deve interromper o fluxo principal.
 */
export async function registrarEventoBoleto(evento: {
  boletoId?: number | string | null
  gateway: "inter" | "asaas"
  origem: "webhook" | "sincronizacao" | "emissao"
  referencia?: string | null
  evento?: string | null
  situacao?: string | null
  payload?: unknown
  processado?: boolean
  erro?: string | null
}): Promise<void> {
  try {
    await query(
      `INSERT INTO boletos_eventos (boleto_id, gateway, origem, referencia, evento, situacao, payload, processado, erro)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        evento.boletoId ?? null,
        evento.gateway,
        evento.origem,
        evento.referencia ?? null,
        evento.evento ?? null,
        evento.situacao ?? null,
        evento.payload !== undefined ? JSON.stringify(evento.payload) : null,
        evento.processado ? 1 : 0,
        evento.erro ?? null,
      ]
    )
  } catch (e) {
    console.error("[boletos_eventos] Falha ao registrar evento:", e)
  }
}
