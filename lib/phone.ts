// Utilitários para normalização e formatação de telefones

export function cleanDigits(input?: string | null): string {
  if (!input) return ""
  return input.replace(/\D/g, "")
}

/**
 * Normaliza um número de telefone para armazenamento padrão: +55<DDD><NUMERO>
 * Regras simples:
 * - Remove todos os caracteres não numéricos
 * - Se já começa com 55 (código do país), garante o formato +55...
 * - Se vier com 8/9 dígitos assume DDD padrão (defaultDDD)
 * - Se vier com 10/11 dígitos assume os 2 primeiros são DDD
 * - Se for maior que 11 dígitos, usa os 11 finais como DDD+numero
 */
export function normalizePhoneForStorage(raw: string | null | undefined, defaultDDD = "11"): string | null {
  if (!raw) return null
  let digits = cleanDigits(raw)
  if (digits.length === 0) return null

  // Remover zeros à esquerda indesejados
  digits = digits.replace(/^0+/, "")

  if (digits.startsWith("55")) {
    const rest = digits.slice(2)
    if (rest.length === 8 || rest.length === 9) {
      return `+55${defaultDDD}${rest}`
    }
    if (rest.length === 10 || rest.length === 11) {
      return `+55${rest}`
    }
    // caso atípico, guarda como +55 + resto
    return `+55${rest}`
  }

  if (digits.length === 8 || digits.length === 9) {
    return `+55${defaultDDD}${digits}`
  }

  if (digits.length === 10 || digits.length === 11) {
    return `+55${digits}`
  }

  if (digits.length > 11) {
    const last = digits.slice(-11)
    return `+55${last}`
  }

  // fallback
  return `+55${digits}`
}

/**
 * Formata para exibição legível. Se `showCountry` for true inclui +55 no começo.
 * Aceita tanto strings já normalizadas (+5511999888777) quanto números soltos.
 */
export function formatPhoneForDisplay(stored: string | null | undefined, showCountry = true): string {
  if (!stored) return ""
  const digits = cleanDigits(stored)
  let core = digits
  if (digits.startsWith("55")) core = digits.slice(2)

  if (core.length === 11) {
    const m = core.match(/^(\d{2})(\d{5})(\d{4})$/)
    if (m) return `${showCountry ? "+55" : ""}(${m[1]}) ${m[2]}-${m[3]}`
  }

  if (core.length === 10) {
    const m = core.match(/^(\d{2})(\d{4})(\d{4})$/)
    if (m) return `${showCountry ? "+55" : ""}(${m[1]}) ${m[2]}-${m[3]}`
  }

  // Se não bater, tenta formatos menores (8/9) assumindo DDD padrão 11
  if (core.length === 9) {
    const m = core.match(/^(\d{5})(\d{4})$/)
    if (m) return `${showCountry ? "+55(11) " : "(11) "}${m[1]}-${m[2]}`
  }
  if (core.length === 8) {
    const m = core.match(/^(\d{4})(\d{4})$/)
    if (m) return `${showCountry ? "+55(11) " : "(11) "}${m[1]}-${m[2]}`
  }

  // fallback: tenta retornar algo legível
  if (digits.length > 0) return stored || ""
  return ""
}

/**
 * Interface simples: aplica o DDD padrão quando o usuário informou apenas o número.
 * Retorna um objeto com o valor normalizado e também uma versão formatada para exibição.
 */
export function smartDefaultDDD(raw: string | null | undefined, defaultDDD = "11") {
  const normalized = normalizePhoneForStorage(raw, defaultDDD)
  const display = formatPhoneForDisplay(normalized, true)
  return { normalized, display }
}
