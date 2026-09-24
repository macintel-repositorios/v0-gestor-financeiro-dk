import { getAsaasAPI, AsaasCustomer, AsaasPayment } from "./asaas"
import { getInterAPI, InterBoletoRequest } from "./inter"

export type PaymentProvider = "ASAAS" | "INTER"

export interface CobrancaUnificadaInput {
  provedor: PaymentProvider
  seuNumero: string
  valor: number
  dataVencimento: string // YYYY-MM-DD
  descricao?: string
  cliente: {
    nome: string
    cpfCnpj: string
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
}

export interface CobrancaUnificadaOutput {
  provedor: PaymentProvider
  idExterno: string // ID do Asaas (pay_xxxx) ou codigoSolicitacao do Inter
  seuNumero: string
  nossoNumero?: string
  codigoBarras?: string
  linhaDigitavel?: string
  pixCopiaECola?: string
  pdfUrl?: string
  status: string
  valor: number
  dataVencimento: string
}

/**
 * Cria uma cobrança unificada redirecionando para Asaas ou Banco Inter
 */
export async function criarCobrancaUnificada(input: CobrancaUnificadaInput): Promise<CobrancaUnificadaOutput> {
  const { provedor, cliente, valor, dataVencimento, seuNumero, descricao } = input

  if (provedor === "INTER") {
    console.log("[Payment Gateway] Redirecionando criação para Banco Inter...")
    const interAPI = getInterAPI()

    const interRequest: InterBoletoRequest = {
      seuNumero,
      valor,
      dataVencimento,
      pagador: {
        cpfCnpj: cliente.cpfCnpj,
        nome: cliente.nome,
        email: cliente.email,
        telefone: cliente.telefone,
        logradouro: cliente.logradouro,
        numero: cliente.numero,
        complemento: cliente.complemento,
        bairro: cliente.bairro,
        cidade: cliente.cidade,
        uf: cliente.uf,
        cep: cliente.cep,
      },
      mensagem: descricao ? { linha1: descricao.substring(0, 78) } : undefined,
    }

    const resInter = await interAPI.criarCobranca(interRequest)

    return {
      provedor: "INTER",
      idExterno: resInter.codigoSolicitacao,
      seuNumero: resInter.seuNumero || seuNumero,
      nossoNumero: resInter.nossoNumero,
      codigoBarras: resInter.codigoBarras,
      linhaDigitavel: resInter.linhaDigitavel,
      pixCopiaECola: resInter.pixCopiaECola,
      status: resInter.status || "EMABERTO",
      valor,
      dataVencimento,
    }
  }

  // Padrão: ASAAS
  console.log("[Payment Gateway] Redirecionando criação para Asaas...")
  const asaasAPI = getAsaasAPI()

  // 1. Garante a existência do cliente no Asaas
  const asaasCliente: AsaasCustomer = {
    name: cliente.nome,
    cpfCnpj: cliente.cpfCnpj,
    email: cliente.email,
    mobilePhone: cliente.telefone,
    address: cliente.logradouro,
    addressNumber: cliente.numero,
    complement: cliente.complemento,
    province: cliente.bairro,
    postalCode: cliente.cep,
  }

  const clienteCadastrado = await asaasAPI.obterOuCriarCliente(asaasCliente)

  // 2. Cria a cobrança no Asaas
  const asaasPayment: AsaasPayment = {
    customer: clienteCadastrado.id,
    billingType: "BOLETO",
    value: valor,
    dueDate: dataVencimento,
    description: descricao,
    externalReference: seuNumero,
  }

  const resAsaas = await asaasAPI.criarCobranca(asaasPayment)

  return {
    provedor: "ASAAS",
    idExterno: resAsaas.id,
    seuNumero: resAsaas.externalReference || seuNumero,
    nossoNumero: resAsaas.nossoNumero,
    codigoBarras: resAsaas.barCode,
    linhaDigitavel: resAsaas.identificationField,
    pdfUrl: resAsaas.bankSlipUrl,
    status: resAsaas.status,
    valor: resAsaas.value,
    dataVencimento: resAsaas.dueDate,
  }
}

/**
 * Consulta cobrança unificada
 */
export async function consultarCobrancaUnificada(
  provedor: PaymentProvider,
  idExterno: string
): Promise<Partial<CobrancaUnificadaOutput>> {
  if (provedor === "INTER") {
    const interAPI = getInterAPI()
    const res = await interAPI.consultarCobranca(idExterno)
    return {
      provedor: "INTER",
      idExterno,
      status: res.status,
      linhaDigitavel: res.linhaDigitavel,
      codigoBarras: res.codigoBarras,
      pixCopiaECola: res.pixCopiaECola,
    }
  }

  const asaasAPI = getAsaasAPI()
  const res = await asaasAPI.consultarCobranca(idExterno)
  return {
    provedor: "ASAAS",
    idExterno,
    status: res.status,
    linhaDigitavel: res.identificationField,
    codigoBarras: res.barCode,
    pdfUrl: res.bankSlipUrl,
  }
}

/**
 * Cancela cobrança unificada
 */
export async function cancelarCobrancaUnificada(provedor: PaymentProvider, idExterno: string): Promise<boolean> {
  if (provedor === "INTER") {
    const interAPI = getInterAPI()
    return await interAPI.cancelarCobranca(idExterno)
  }

  const asaasAPI = getAsaasAPI()
  await asaasAPI.cancelarCobranca(idExterno)
  return true
}
