import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

/**
 * Testa a conexão SMTP: conecta, negocia TLS e autentica, sem enviar e-mail.
 * Retorna o tempo de resposta e uma mensagem amigável em caso de erro.
 */
export async function POST(request: NextRequest) {
  const inicio = Date.now()
  try {
    const { host, port, user, pass } = await request.json()
    if (!host || !user || !pass) {
      return NextResponse.json({ success: false, message: "Preencha servidor, usuário e senha" }, { status: 400 })
    }

    const transporter = nodemailer.createTransport({
      host,
      port: Number(port) || 587,
      secure: Number(port) === 465,
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    })
    await transporter.verify()

    return NextResponse.json({ success: true, message: "Conectado e autenticado", ms: Date.now() - inicio })
  } catch (error: any) {
    const code = error?.code || error?.responseCode
    let message = error?.message || "Falha na conexão"
    if (code === "EAUTH" || code === 535) message = "Usuário ou senha inválidos (no Gmail, use uma Senha de App)"
    else if (code === "ETIMEDOUT" || code === "ESOCKET" || code === "ECONNECTION")
      message = "Servidor não respondeu — confira o endereço e a porta (587 ou 465)"
    else if (code === "ENOTFOUND" || code === "EDNS") message = "Servidor SMTP não encontrado — confira o endereço"
    return NextResponse.json({ success: false, message, code, ms: Date.now() - inicio })
  }
}
