// Cliente da API Sefin Nacional (NFS-e Nacional): assinatura, envio (mTLS com e-CNPJ A1),
// consulta, cancelamento e DANFSe.
import https from "node:https"
import { gzipSync, gunzipSync } from "node:zlib"
import { SignedXml } from "xml-crypto"
import { extrairCertKeyDoPfx } from "@/lib/nfse/xml-signer"

export type AmbienteNacional = "producao" | "homologacao"

const HOSTS = {
  producao: { sefin: "https://sefin.nfse.gov.br", adn: "https://adn.nfse.gov.br" },
  homologacao: { sefin: "https://sefin.producaorestrita.nfse.gov.br", adn: "https://adn.producaorestrita.nfse.gov.br" },
}
// A documentação cita os dois prefixos; tenta o primeiro e cai no segundo se a rota não existir
const PREFIXOS = ["/SefinNacional", "/API/SefinNacional"]

/** Assina um elemento com atributo Id (infDPS / infPedReg): RSA-SHA1, C14N, enveloped, Reference URI="#Id" */
export function assinarElemento(xml: string, elemento: string, certPem: string, keyPem: string): string {
  const certB64 = certPem.replace(/-----(BEGIN|END) CERTIFICATE-----/g, "").replace(/[^A-Za-z0-9+/=]/g, "")
  const sig = new SignedXml({
    privateKey: keyPem,
    publicCert: certPem,
    signatureAlgorithm: "http://www.w3.org/2000/09/xmldsig#rsa-sha1",
    canonicalizationAlgorithm: "http://www.w3.org/TR/2001/REC-xml-c14n-20010315",
    getKeyInfoContent: () => `<X509Data><X509Certificate>${certB64}</X509Certificate></X509Data>`,
  })
  sig.addReference({
    xpath: `//*[local-name(.)='${elemento}']`,
    transforms: [
      "http://www.w3.org/2000/09/xmldsig#enveloped-signature",
      "http://www.w3.org/TR/2001/REC-xml-c14n-20010315",
    ],
    digestAlgorithm: "http://www.w3.org/2000/09/xmldsig#sha1",
  })
  // Signature fica depois do elemento assinado, dentro do raiz
  sig.computeSignature(xml, { location: { reference: `//*[local-name(.)='${elemento}']`, action: "after" } })
  return `<?xml version="1.0" encoding="UTF-8"?>` + sig.getSignedXml()
}

const gzB64 = (xml: string) => gzipSync(Buffer.from(xml, "utf8")).toString("base64")
export const deGzB64 = (b64: string) => gunzipSync(Buffer.from(b64, "base64")).toString("utf8")

interface Resposta { status: number; json: any; texto: string; buffer: Buffer }

function requisicao(url: string, metodo: string, cred: { cert: string; key: string }, corpo?: unknown): Promise<Resposta> {
  return new Promise((resolve, reject) => {
    const dados = corpo === undefined ? undefined : Buffer.from(JSON.stringify(corpo), "utf8")
    const req = https.request(
      url,
      {
        method: metodo,
        cert: cred.cert,
        key: cred.key,
        headers: {
          Accept: "application/json",
          ...(dados ? { "Content-Type": "application/json", "Content-Length": dados.length } : {}),
        },
        timeout: 60000,
      },
      (res) => {
        const partes: Buffer[] = []
        res.on("data", (c) => partes.push(c))
        res.on("end", () => {
          const buffer = Buffer.concat(partes)
          const texto = buffer.toString("utf8")
          let json: any = null
          try { json = JSON.parse(texto) } catch {}
          resolve({ status: res.statusCode || 0, json, texto, buffer })
        })
      },
    )
    req.on("timeout", () => req.destroy(new Error("Tempo esgotado na comunicação com a Sefin Nacional")))
    req.on("error", reject)
    if (dados) req.write(dados)
    req.end()
  })
}

export interface CredenciaisNacional { ambiente: AmbienteNacional; pfxBase64: string; senha: string }

// PFX de A1 costuma usar cifra legada (RC2) não suportada pelo OpenSSL 3 do Node — usa PEM extraído via node-forge
function credTls(c: CredenciaisNacional) {
  const { certPem, keyPem } = extrairCertKeyDoPfx(c.pfxBase64, c.senha)
  return { cert: certPem, key: keyPem }
}

async function chamarSefin(c: CredenciaisNacional, caminho: string, metodo: string, corpo?: unknown) {
  const cred = credTls(c)
  let r: Resposta | null = null
  for (const prefixo of PREFIXOS) {
    r = await requisicao(`${HOSTS[c.ambiente].sefin}${prefixo}${caminho}`, metodo, cred, corpo)
    if (!(r.status === 404 && !r.json)) break
  }
  return r!
}

export function errosDaResposta(json: any): string[] {
  const lista = json?.erros || json?.Erros || json?.erro || []
  const arr = Array.isArray(lista) ? lista : [lista]
  return arr
    .filter(Boolean)
    .map((e: any) => [e.Codigo || e.codigo, e.Descricao || e.descricao, e.Complemento || e.complemento].filter(Boolean).join(" - "))
}

export interface ResultadoEmissao {
  sucesso: boolean
  status: number
  chaveAcesso?: string
  numeroNfse?: string
  codigoVerificacao?: string
  xmlNfse?: string
  xmlDpsAssinado: string
  erros: string[]
  respostaBruta: string
}

/** Assina a DPS e envia; retorna a NFS-e gerada ou os erros */
export async function emitirDps(c: CredenciaisNacional, xmlDps: string): Promise<ResultadoEmissao> {
  const { certPem, keyPem } = extrairCertKeyDoPfx(c.pfxBase64, c.senha)
  const assinado = assinarElemento(xmlDps, "infDPS", certPem, keyPem)
  const r = await chamarSefin(c, "/nfse", "POST", { dpsXmlGZipB64: gzB64(assinado) })

  const xmlNfse = r.json?.nfseXmlGZipB64 ? deGzB64(r.json.nfseXmlGZipB64) : undefined
  const chave = r.json?.chaveAcesso || xmlNfse?.match(/<infNFSe[^>]*Id="NFS(\d{50})"/)?.[1]
  const erros = errosDaResposta(r.json)
  if (!r.json && r.status >= 400) erros.push(`HTTP ${r.status}: ${r.texto.slice(0, 300)}`)

  return {
    sucesso: r.status >= 200 && r.status < 300 && !!chave,
    status: r.status,
    chaveAcesso: chave,
    numeroNfse: xmlNfse?.match(/<nNFSe>(\d+)<\/nNFSe>/)?.[1],
    codigoVerificacao: chave,
    xmlNfse,
    xmlDpsAssinado: assinado,
    erros,
    respostaBruta: r.texto.slice(0, 4000),
  }
}

/** Consulta a NFS-e pela chave de acesso */
export async function consultarNfse(c: CredenciaisNacional, chave: string) {
  const r = await chamarSefin(c, `/nfse/${chave}`, "GET")
  return {
    status: r.status,
    xmlNfse: r.json?.nfseXmlGZipB64 ? deGzB64(r.json.nfseXmlGZipB64) : undefined,
    erros: errosDaResposta(r.json),
  }
}

/** Cancelamento (evento e101101). cMotivo: 1=erro na emissão, 2=serviço não prestado, 9=outros */
export async function cancelarNfse(
  c: CredenciaisNacional,
  dados: { chave: string; cnpjAutor: string; cMotivo: 1 | 2 | 9; motivo: string; dhEvento: string },
) {
  const { certPem, keyPem } = extrairCertKeyDoPfx(c.pfxBase64, c.senha)
  const id = `PRE${dados.chave}101101`
  const xml =
    `<pedRegEvento xmlns="http://www.sped.fazenda.gov.br/nfse" versao="1.01"><infPedReg Id="${id}">` +
    `<tpAmb>${c.ambiente === "producao" ? 1 : 2}</tpAmb><verAplic>GestorMacintel_1.0</verAplic>` +
    `<dhEvento>${dados.dhEvento}</dhEvento><CNPJAutor>${dados.cnpjAutor.replace(/[^0-9]/g, "")}</CNPJAutor>` +
    `<chNFSe>${dados.chave}</chNFSe>` +
    `<e101101><xDesc>Cancelamento de NFS-e</xDesc><cMotivo>${dados.cMotivo}</cMotivo>` +
    `<xMotivo>${dados.motivo.replace(/[<>&]/g, " ").slice(0, 255)}</xMotivo></e101101>` +
    `</infPedReg></pedRegEvento>`
  const assinado = assinarElemento(xml, "infPedReg", certPem, keyPem)
  const r = await chamarSefin(c, `/nfse/${dados.chave}/eventos`, "POST", { pedidoRegistroEventoXmlGZipB64: gzB64(assinado) })
  return { sucesso: r.status >= 200 && r.status < 300, status: r.status, erros: errosDaResposta(r.json), respostaBruta: r.texto.slice(0, 4000) }
}

/** PDF oficial (DANFSe) gerado pelo Ambiente de Dados Nacional */
export async function baixarDanfse(c: CredenciaisNacional, chave: string): Promise<Buffer | null> {
  const r = await requisicao(`${HOSTS[c.ambiente].adn}/danfse/${chave}`, "GET", credTls(c))
  return r.status === 200 && r.buffer.subarray(0, 4).toString() === "%PDF" ? r.buffer : null
}
