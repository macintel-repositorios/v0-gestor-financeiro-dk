import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { carregarSmtpSalvo, criptografar } from "@/lib/smtp-config"

// Configuração SMTP salva. A senha nunca volta para o navegador: só o indicador "temSenha".
export async function GET() {
  try {
    const cfg = await carregarSmtpSalvo()
    if (!cfg) return NextResponse.json({ success: true, data: null })
    const { pass, ...resto } = cfg
    return NextResponse.json({ success: true, data: { ...resto, temSenha: !!pass } })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { host, port, user, pass, from, fromName } = await request.json()
    if (!host || !user) {
      return NextResponse.json({ success: false, message: "Servidor e usuário são obrigatórios" }, { status: 400 })
    }
    // Senha vazia = manter a já salva (desde que o usuário não tenha mudado)
    const atual: any = await query(`SELECT usuario, senha_cripto FROM email_smtp_config WHERE id = 1`)
    const senhaCripto = pass ? criptografar(pass) : atual[0]?.usuario === user ? atual[0]?.senha_cripto : null

    await query(
      `INSERT INTO email_smtp_config (id, host, port, usuario, senha_cripto, from_email, from_name)
       VALUES (1, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE host = VALUES(host), port = VALUES(port), usuario = VALUES(usuario),
         senha_cripto = VALUES(senha_cripto), from_email = VALUES(from_email), from_name = VALUES(from_name)`,
      [host, Number(port) || 587, user, senhaCripto, from || user, fromName || null]
    )
    return NextResponse.json({ success: true, message: "Configuração SMTP salva", temSenha: !!senhaCripto })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
