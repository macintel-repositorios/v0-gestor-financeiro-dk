// Regras do modelo de Contrato de Conservação que dependem de o contrato ter equipamentos em consignação.

export function temConsignacao(contrato: any): boolean {
  return !!contrato?.equipamentos_consignacao?.trim()
}

/** Título impresso: fica mais específico quando há equipamentos em consignação. */
export function tituloContratoConservacao(contrato: any) {
  return temConsignacao(contrato)
    ? "CONTRATO DE CONSERVAÇÃO E PREVENÇÃO DOS EQUIPAMENTOS ELETRÔNICOS COM FORNECIMENTO DE EQUIPAMENTOS EM CONSIGNAÇÃO"
    : "CONTRATO DE CONSERVAÇÃO E PREVENÇÃO DOS EQUIPAMENTOS ELETRÔNICOS"
}

/**
 * Trechos condicionais do modelo: [SE_CONSIGNACAO] ... [/SE_CONSIGNACAO]
 * aparecem só quando o contrato tem equipamentos em consignação; as marcações são sempre removidas.
 */
export function aplicarCondicionaisContrato(conteudo: string, contrato: any) {
  const mostrar = temConsignacao(contrato)
  return conteudo.replace(/\[SE_CONSIGNACAO\]([\s\S]*?)\[\/SE_CONSIGNACAO\]/g, (_m, trecho) => (mostrar ? trecho : ""))
}
