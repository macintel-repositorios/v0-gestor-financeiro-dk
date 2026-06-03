interface LogData {
  usuario_id?: number
  usuario_nome?: string
  usuario_email?: string
  acao: string
  modulo: string
  tipo: "login" | "logout" | "create" | "update" | "delete" | "view" | "error" | "warning" | "info"
  detalhes?: string
  ip_address?: string
  user_agent?: string
  sessao_id?: string
  tempo_sessao?: number
  dados_anteriores?: any
  dados_novos?: any
}

export async function registrarLog(data: LogData) {
  try {
    // Reduzir logs de debug em produção
    const isDev = process.env.NODE_ENV === "development"

    if (isDev) {
      console.log("📝 Registrando log:", data.acao)
    }

    // Validar dados obrigatórios
    if (!data.acao || !data.modulo || !data.tipo) {
      console.error("❌ Dados obrigatórios faltando:", data)
      return
    }

    // Capturar informações do cliente se não fornecidas
    const logData = {
      ...data,
      ip_address: data.ip_address || (await getClientIP()),
      user_agent: data.user_agent || (typeof navigator !== "undefined" ? navigator.userAgent : undefined),
    }

    const response = await fetch("/api/logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(logData),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error("❌ Erro na API de logs:", result.message)
    } else if (isDev) {
      console.log("✅ Log registrado:", data.acao)
    }
  } catch (error) {
    console.error("❌ Erro ao registrar log:", (error as any).message)
  }
}

// Função para obter IP do cliente (client-side)
export async function getClientIP(): Promise<string> {
  try {
    // Tentar obter IP de serviços externos com timeout menor
    const services = ["https://api.ipify.org?format=json"]

    for (const service of services) {
      try {
        const response = await fetch(service, {
          signal: AbortSignal.timeout(3000), // Timeout reduzido
        })

        if (response.ok) {
          const data = await response.json()
          const ip = data.ip || data.origin || data.query
          if (ip) {
            return ip
          }
        }
      } catch (serviceError) {
        continue
      }
    }

    return "client-unknown"
  } catch (error) {
    return "client-error"
  }
}

// Função para obter IP do servidor (server-side)
export function getServerIP(request: Request): string {
  try {
    // Headers possíveis para IP
    const headers = [
      "x-forwarded-for",
      "x-real-ip",
      "x-client-ip",
      "cf-connecting-ip", // Cloudflare
    ]

    for (const header of headers) {
      const value = request.headers.get(header)
      if (value) {
        // Pegar o primeiro IP se houver múltiplos
        const ip = value.split(",")[0].trim()
        if (ip && ip !== "unknown") {
          return ip
        }
      }
    }

    return "server-unknown"
  } catch (error) {
    return "server-error"
  }
}

// Função para gerar ID de sessão
export function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Função para calcular tempo de sessão
export function calculateSessionTime(loginTime: Date): number {
  return Math.floor((Date.now() - loginTime.getTime()) / 1000)
}

// Função para obter horário formatado do Brasil
export function getBrazilTime(): string {
  return new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

// Função para converter UTC para horário de Brasília
export function convertUTCToBrazil(utcDate: string | Date): string {
  const date = typeof utcDate === "string" ? new Date(utcDate) : utcDate
  return date.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}
