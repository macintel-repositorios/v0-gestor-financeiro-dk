// Padronização de e-mails: sempre minúsculas e sem espaços nas pontas.

/** "  Fulano@Gmail.COM " -> "fulano@gmail.com" ; vazio -> null */
export function normalizarEmail(email?: string | null): string | null {
  const e = String(email ?? "").trim().toLowerCase()
  return e || null
}

/** Lista de e-mails extras (array ou JSON) -> JSON com e-mails normalizados, sem vazios/repetidos; vazio -> null */
export function normalizarEmailsExtras(valor: unknown): string | null {
  let lista: unknown = valor
  if (typeof valor === "string") {
    try {
      lista = JSON.parse(valor || "[]")
    } catch {
      lista = valor.split(/[,;\s]+/)
    }
  }
  if (!Array.isArray(lista)) return null
  const emails = Array.from(new Set(lista.map((e) => normalizarEmail(String(e ?? ""))).filter(Boolean) as string[]))
  return emails.length ? JSON.stringify(emails) : null
}
