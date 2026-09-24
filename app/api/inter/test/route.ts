import { NextResponse } from "next/server"
import { getInterAPI } from "@/lib/inter"

export async function GET() {
  try {
    const interAPI = getInterAPI()
    const token = await interAPI.autenticar()

    return NextResponse.json({
      success: true,
      message: "Conexão com Banco Inter (OAuth2 + mTLS) estabelecida com sucesso!",
      data: {
        environment: process.env.INTER_ENVIRONMENT || "production",
        authenticated: !!token,
      },
    })
  } catch (error: any) {
    console.error("[Banco Inter API Test Error]:", error)
    return NextResponse.json({
      success: false,
      message: error.message || "Erro ao conectar com a API do Banco Inter",
    })
  }
}
