import { query } from "@/lib/db"

/**
 * Mantém clientes.tem_contrato igual à realidade: 1 se o cliente tem algum contrato de conservação ativo.
 * Chamado sempre que um contrato é criado, alterado ou excluído.
 */
export async function sincronizarTemContrato(clienteId?: number | string | null): Promise<void> {
  if (!clienteId) return
  try {
    await query(
      `UPDATE clientes SET tem_contrato = EXISTS(
         SELECT 1 FROM contratos_conservacao WHERE cliente_id = ? AND status = 'ativo'
       ) WHERE id = ?`,
      [clienteId, clienteId]
    )
  } catch (e) {
    console.error("[tem_contrato] Falha ao sincronizar cliente", clienteId, e)
  }
}
