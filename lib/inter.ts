import fs from "fs"
import https from "https"
import path from "path"

export interface InterConfig {
  clientId: string
  clientSecret: string
  certPath?: string
  keyPath?: string
  certContent?: string
  keyContent?: string
  environment?: "sandbox" | "production"
}

export interface InterPagador {
  cpfCnpj: string
  nome: string
  email?: string
  telefone?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  uf?: string
  cep?: string
}

export interface InterBoletoRequest {
  seuNumero: string
  valor: number
  dataVencimento: string // YYYY-MM-DD
  numDiasAgenda?: number
  pagador: InterPagador
  mensagem?: {
    linha1?: string
    linha2?: string
    linha3?: string
  }
  multa?: {
    taxa?: number
    valor?: number
  }
  juros?: {
    taxa?: number
    valor?: number
  }
  desconto?: {
    taxa?: number
    valor?: number
    dataLimite?: string
  }
}

export interface InterBoletoResponse {
  codigoSolicitacao: string
  seuNumero?: string
  nossoNumero?: string
  codigoBarras?: string
  linhaDigitavel?: string
  pixCopiaECola?: string
  status?: string
  dataEmissao?: string
  dataVencimento?: string
  valorNominal?: number
  pdfUrl?: string
}

export class BancoInterAPI {
  private config: InterConfig
  private baseUrl: string
  private token: string | null = null
  private tokenExpiresAt: number = 0
  private _certBuffer: Buffer | null = null
  private _keyBuffer: Buffer | null = null

  constructor(config: InterConfig) {
    this.config = {
      environment: "production",
      ...config,
    }

    // URLs corretas conforme documentação oficial do Banco Inter
    this.baseUrl =
      this.config.environment === "sandbox"
        ? "https://cdpj-sandbox.partners.uatinter.co"
        : "https://cdpj.partners.bancointer.com.br"

    console.log("[Banco Inter] Inicializado - Ambiente:", this.config.environment)
    console.log("[Banco Inter] Base URL:", this.baseUrl)
  }

  /**
   * Carrega os buffers de certificado e chave
   */
  private getCertAndKey(): { cert: Buffer | string; key: Buffer | string } {
    if (this._certBuffer && this._keyBuffer) {
      return { cert: this._certBuffer, key: this._keyBuffer }
    }

    let cert: Buffer | string
    let key: Buffer | string

    if (this.config.certContent && this.config.keyContent) {
      cert = this.config.certContent.includes("-----BEGIN CERTIFICATE-----")
        ? this.config.certContent
        : Buffer.from(this.config.certContent, "base64").toString("utf-8")

      key =
        this.config.keyContent.includes("-----BEGIN PRIVATE KEY-----") ||
        this.config.keyContent.includes("-----BEGIN RSA PRIVATE KEY-----")
          ? this.config.keyContent
          : Buffer.from(this.config.keyContent, "base64").toString("utf-8")
    } else {
      const certPath =
        this.config.certPath || process.env.INTER_CERT_PATH || "./certs/inter.crt"
      const keyPath =
        this.config.keyPath || process.env.INTER_KEY_PATH || "./certs/inter.key"

      const absoluteCertPath = path.isAbsolute(certPath)
        ? certPath
        : path.join(process.cwd(), certPath)
      const absoluteKeyPath = path.isAbsolute(keyPath)
        ? keyPath
        : path.join(process.cwd(), keyPath)

      if (!fs.existsSync(absoluteCertPath) || !fs.existsSync(absoluteKeyPath)) {
        throw new Error(
          `Certificados do Banco Inter não encontrados.\nCert: ${absoluteCertPath}\nKey: ${absoluteKeyPath}`
        )
      }

      cert = fs.readFileSync(absoluteCertPath)
      key = fs.readFileSync(absoluteKeyPath)
    }

    this._certBuffer = typeof cert === "string" ? Buffer.from(cert) : cert
    this._keyBuffer = typeof key === "string" ? Buffer.from(key) : key

    return { cert, key }
  }

  /**
   * Faz uma requisição HTTPS com suporte completo a mTLS usando https.request
   * (necessário pois fetch nativo do Node 18+ ignora o parâmetro agent)
   */
  private httpsRequest(
    urlStr: string,
    method: string,
    headers: Record<string, string>,
    body?: string
  ): Promise<{ status: number; text: string }> {
    return new Promise((resolve, reject) => {
      const { cert, key } = this.getCertAndKey()
      const url = new URL(urlStr)

      const options: https.RequestOptions = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method,
        headers,
        cert,
        key,
        rejectUnauthorized: true,
      }

      const req = https.request(options, (res) => {
        let data = ""
        res.on("data", (chunk) => { data += chunk })
        res.on("end", () => {
          resolve({ status: res.statusCode || 0, text: data })
        })
      })

      req.on("error", (err) => {
        reject(err)
      })

      if (body) {
        req.write(body)
      }
      req.end()
    })
  }

  /**
   * Autenticação OAuth2 do Banco Inter com mTLS via https.request
   */
  async autenticar(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiresAt - 60000) {
      return this.token
    }

    console.log("[Banco Inter] Solicitando novo Bearer Token OAuth2...")
    const url = `${this.baseUrl}/oauth/v2/token`

    const bodyParams = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      grant_type: "client_credentials",
      scope: "boleto-cobranca.read boleto-cobranca.write",
    })
    const bodyStr = bodyParams.toString()

    try {
      const { status, text } = await this.httpsRequest(
        url,
        "POST",
        {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(bodyStr).toString(),
        },
        bodyStr
      )

      if (status < 200 || status >= 300) {
        console.error("[Banco Inter] Erro na autenticação OAuth2:", text)
        throw new Error(`Banco Inter Auth (${status}): ${text}`)
      }

      const data = JSON.parse(text)
      this.token = data.access_token
      this.tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000

      console.log("[Banco Inter] Autenticação realizada com sucesso!")
      return this.token!
    } catch (error: any) {
      console.error("[Banco Inter] Falha ao autenticar:", error.message || error)
      throw error
    }
  }

  /**
   * Requisição genérica autenticada com mTLS via https.request
   */
  private async request<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    data?: any
  ): Promise<T> {
    const token = await this.autenticar()
    const url = `${this.baseUrl}${endpoint}`

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }

    let bodyStr: string | undefined
    if (data && (method === "POST" || method === "PUT")) {
      bodyStr = JSON.stringify(data)
      headers["Content-Length"] = Buffer.byteLength(bodyStr).toString()
    }

    console.log(`[Banco Inter] ${method} ${url}`)
    const { status, text } = await this.httpsRequest(url, method, headers, bodyStr)

    if (status < 200 || status >= 300) {
      console.error(`[Banco Inter] Erro API (${status}):`, text)
      throw new Error(`Banco Inter API (${status}): ${text}`)
    }

    if (!text || text.trim() === "") {
      return {} as T
    }

    return JSON.parse(text) as T
  }

  /**
   * 1. Emissão de Boleto no Banco Inter (v3)
   */
  async criarCobranca(dados: InterBoletoRequest): Promise<InterBoletoResponse> {
    const cpfCnpjLimpo = dados.pagador.cpfCnpj.replace(/\D/g, "")
    const cepLimpo = (dados.pagador.cep || "01001000").replace(/\D/g, "")
    const tipoPessoa = cpfCnpjLimpo.length > 11 ? "JURIDICA" : "FISICA"

    const payload: any = {
      seuNumero: dados.seuNumero,
      valorNominal: dados.valor,
      dataVencimento: dados.dataVencimento,
      numDiasAgenda: dados.numDiasAgenda || 60,
      pagador: {
        cpfCnpj: cpfCnpjLimpo,
        tipoPessoa,
        nome: dados.pagador.nome,
        endereco: dados.pagador.logradouro || "Não informado",
        numero: dados.pagador.numero || "S/N",
        complemento: dados.pagador.complemento || "",
        bairro: dados.pagador.bairro || "Centro",
        cidade: dados.pagador.cidade || "São Paulo",
        uf: dados.pagador.uf || "SP",
        cep: cepLimpo,
        email: dados.pagador.email || "",
      },
    }

    if (dados.mensagem) {
      payload.mensagem = dados.mensagem
    }

    if (dados.multa?.taxa) {
      payload.multa = {
        codigoMulta: "PERCENTUAL",
        percentual: dados.multa.taxa,
      }
    } else if (dados.multa?.valor) {
      payload.multa = {
        codigoMulta: "VALORFIXO",
        valor: dados.multa.valor,
      }
    }

    if (dados.juros?.taxa) {
      payload.juros = {
        codigoJuros: "TAXAMENSAL",
        percentual: dados.juros.taxa,
      }
    } else if (dados.juros?.valor) {
      payload.juros = {
        codigoJuros: "VALORPORDIA",
        valor: dados.juros.valor,
      }
    }

    console.log("[Banco Inter] Emitindo boleto v3:", JSON.stringify(payload, null, 2))

    // 1. Post para registrar a solicitação de emissão
    const resSolicitacao = await this.request<{ codigoSolicitacao: string }>(
      "/cobranca/v3/cobrancas",
      "POST",
      payload
    )

    console.log("[Banco Inter] Solicitação criada com código:", resSolicitacao.codigoSolicitacao)

    // 2. Consulta os detalhes completos da cobrança gerada
    const detalhes = await this.consultarCobranca(resSolicitacao.codigoSolicitacao)

    return { ...detalhes }
  }

  /**
   * 2. Consulta Detalhes de um Boleto pelo Código de Solicitação
   */
  async consultarCobranca(codigoSolicitacao: string): Promise<InterBoletoResponse> {
    const data = await this.request<any>(`/cobranca/v3/cobrancas/${codigoSolicitacao}`, "GET")

    const boleto = data.boleto || data
    const pix = data.pix || {}

    return {
      codigoSolicitacao,
      seuNumero: boleto.seuNumero,
      nossoNumero: boleto.nossoNumero,
      codigoBarras: boleto.codigoBarras,
      linhaDigitavel: boleto.linhaDigitavel,
      pixCopiaECola: pix.pixCopiaECola || data.pixCopiaECola,
      status: data.situacao || boleto.status || "EMABERTO",
      dataEmissao: boleto.dataEmissao,
      dataVencimento: boleto.dataVencimento,
      valorNominal: boleto.valorNominal,
    }
  }

  /**
   * 3. Download do PDF do Boleto do Banco Inter
   */
  async obterPdfBoleto(codigoSolicitacao: string): Promise<string> {
    // PDF do boleto Inter v3: /cobranca/v3/cobrancas/{id}/boleto/pdf
    const res = await this.request<{ pdf: string }>(
      `/cobranca/v3/cobrancas/${codigoSolicitacao}/boleto/pdf`,
      "GET"
    )
    return res.pdf // string em Base64
  }

  /**
   * 4. Cancelar / Baixar Boleto
   */
  async cancelarCobranca(codigoSolicitacao: string, motivo: string = "ACERTOS"): Promise<boolean> {
    await this.request(`/cobranca/v3/cobrancas/${codigoSolicitacao}/cancelar`, "POST", {
      motivoCancelamento: motivo,
    })
    return true
  }

  /**
   * 5. Cadastrar URL de Webhook no Banco Inter
   */
  async cadastrarWebhook(webhookUrl: string): Promise<boolean> {
    console.log(`[Banco Inter] Registrando Webhook na URL: ${webhookUrl}`)
    await this.request(`/cobranca/v3/cobrancas/webhook`, "PUT", { webhookUrl })
    return true
  }

  /**
   * 6. Obter URL de Webhook cadastrada no Banco Inter
   */
  async obterWebhook(): Promise<{ webhookUrl?: string; dataCriacao?: string }> {
    return await this.request<{ webhookUrl?: string; dataCriacao?: string }>(
      `/cobranca/v3/cobrancas/webhook`,
      "GET"
    )
  }

  /**
   * 7. Excluir Webhook cadastrado
   */
  async excluirWebhook(): Promise<boolean> {
    await this.request(`/cobranca/v3/cobrancas/webhook`, "DELETE")
    return true
  }
}

/**
 * Função helper para obter instância da API do Banco Inter
 */
export function getInterAPI(): BancoInterAPI {
  let clientId = (process.env.INTER_CLIENT_ID || "").replace(/^clientld:\s*/i, "").trim()
  let clientSecret = (process.env.INTER_CLIENT_SECRET || "").trim()
  const certPath = process.env.INTER_CERT_PATH
  const keyPath = process.env.INTER_KEY_PATH
  const certContent = process.env.INTER_CERT_CONTENT
  const keyContent = process.env.INTER_KEY_CONTENT
  const environment = (process.env.INTER_ENVIRONMENT as "sandbox" | "production") || "production"

  if (!clientId || !clientSecret) {
    throw new Error(
      "Credenciais do Banco Inter (INTER_CLIENT_ID e INTER_CLIENT_SECRET) não estão configuradas no .env.local"
    )
  }

  return new BancoInterAPI({
    clientId,
    clientSecret,
    certPath,
    keyPath,
    certContent,
    keyContent,
    environment,
  })
}
