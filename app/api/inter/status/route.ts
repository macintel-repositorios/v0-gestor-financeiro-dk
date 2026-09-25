import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    let clientId = process.env.INTER_CLIENT_ID || ""
    // Limpar prefixo tipo "clientld: " se o usuário colou junto
    clientId = clientId.replace(/^clientld:\s*/i, "").trim()

    const clientSecret = (process.env.INTER_CLIENT_SECRET || "").trim()
    const certPath = process.env.INTER_CERT_PATH || "./certs/inter.crt"
    const keyPath = process.env.INTER_KEY_PATH || "./certs/inter.key"
    const certContent = process.env.INTER_CERT_CONTENT
    const keyContent = process.env.INTER_KEY_CONTENT

    const absoluteCertPath = path.isAbsolute(certPath) ? certPath : path.join(process.cwd(), certPath)
    const absoluteKeyPath = path.isAbsolute(keyPath) ? keyPath : path.join(process.cwd(), keyPath)

    const hasCertFiles =
      !!certContent && !!keyContent || (fs.existsSync(absoluteCertPath) && fs.existsSync(absoluteKeyPath))

    const environment = process.env.INTER_ENVIRONMENT || "production"
    const isConfigured = !!(clientId && clientSecret && hasCertFiles)

    return NextResponse.json({
      success: true,
      data: {
        configured: isConfigured,
        connected: isConfigured,
        environment,
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        hasCert: hasCertFiles,
      },
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error.message || "Erro ao verificar status do Banco Inter",
    })
  }
}
