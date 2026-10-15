import crypto from "crypto"
import { query } from "@/lib/db"

// Configuração SMTP do e-mail marketing, salva no banco (tabela email_smtp_config, registro único).
// A senha é criptografada com AES-256-GCM. Chave: APP_ENCRYPTION_KEY, ou derivada de DB_PASSWORD
// (mesma no ambiente local e na Vercel, pois ambos usam o mesmo banco).

export interface SmtpConfig {
  host: string
  port: number
  user: string
  pass: string
  from: string
  fromName: string
}

function chave(): Buffer {
  const base = process.env.APP_ENCRYPTION_KEY || process.env.DB_PASSWORD
  if (!base) throw new Error("Chave de criptografia indisponível (APP_ENCRYPTION_KEY/DB_PASSWORD)")
  return crypto.scryptSync(base, "gestor-financeiro:smtp", 32)
}

export function criptografar(texto: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", chave(), iv)
  const dados = Buffer.concat([cipher.update(texto, "utf8"), cipher.final()])
  return [iv, cipher.getAuthTag(), dados].map((b) => b.toString("base64")).join(".")
}

export function descriptografar(valor: string): string | null {
  try {
    const [iv, tag, dados] = valor.split(".").map((p) => Buffer.from(p, "base64"))
    const decipher = crypto.createDecipheriv("aes-256-gcm", chave(), iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(dados), decipher.final()]).toString("utf8")
  } catch {
    return null // chave mudou ou valor corrompido: usuário precisa informar a senha de novo
  }
}

/** Configuração salva, com a senha já descriptografada (uso apenas no servidor). */
export async function carregarSmtpSalvo(): Promise<SmtpConfig | null> {
  const rows: any = await query(`SELECT * FROM email_smtp_config WHERE id = 1`)
  const r = rows[0]
  if (!r) return null
  return {
    host: r.host,
    port: Number(r.port) || 587,
    user: r.usuario,
    pass: (r.senha_cripto && descriptografar(r.senha_cripto)) || "",
    from: r.from_email || r.usuario,
    fromName: r.from_name || "",
  }
}

/**
 * Junta o que veio da tela com o que está salvo: se a tela não mandou a senha
 * (campo vazio = "manter a salva"), usa a senha do banco.
 */
export async function resolverSmtp(daTela?: Partial<SmtpConfig>): Promise<SmtpConfig | null> {
  const salvo = await carregarSmtpSalvo()
  if (!daTela?.host && !salvo) return null
  return {
    host: daTela?.host || salvo?.host || "",
    port: Number(daTela?.port) || salvo?.port || 587,
    user: daTela?.user || salvo?.user || "",
    pass: daTela?.pass || (daTela?.user && salvo && daTela.user !== salvo.user ? "" : salvo?.pass || ""),
    from: daTela?.from || daTela?.user || salvo?.from || "",
    fromName: daTela?.fromName ?? salvo?.fromName ?? "",
  }
}
