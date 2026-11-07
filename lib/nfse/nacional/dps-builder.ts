// Montagem da DPS (Declaração de Prestação de Serviço) — NFS-e Nacional, leiaute v1.01.
// Molde: XML real da NFS-e nacional nº 1 da Macintel (emitida pelo portal em 06/11/2026).

export const NS_NFSE = "http://www.sped.fazenda.gov.br/nfse"
export const VERSAO_DPS = "1.01"
export const COD_MUN_SAO_PAULO = "3550308"

export interface DadosDps {
  ambiente: "producao" | "homologacao"
  dhEmi: string // YYYY-MM-DDTHH:mm:ss-03:00
  dCompet: string // YYYY-MM-DD
  serie: string // até 5 dígitos
  numero: number // nDPS (até 15 dígitos)
  prestador: { cnpj: string; codMunicipio?: string }
  tomador: {
    cpfCnpj: string
    nome: string
    email?: string | null
    codMunicipio?: string | null
    cep?: string | null
    logradouro?: string | null
    numero?: string | null
    complemento?: string | null
    bairro?: string | null
  }
  servico: {
    codTribNacional: string // ex 14.01.01
    codTribMunicipal?: string | null // ex 005
    nbs?: string | null // ex 1.2001.89.00
    descricao: string
    codMunPrestacao?: string
  }
  valor: number
  valorTotTribMun?: number // Lei 12.741 (aprox.)
}

const so = (v: unknown) => String(v ?? "").replace(/[^0-9]/g, "")

export function escaparXml(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .trim()
}

const tag = (nome: string, valor: unknown) =>
  valor === undefined || valor === null || String(valor).trim() === "" ? "" : `<${nome}>${escaparXml(valor)}</${nome}>`

const dec = (n: number) => (Math.round(n * 100) / 100).toFixed(2)

/** Id da DPS: "DPS" + cMun(7) + tipo inscrição(1=CPF,2=CNPJ) + inscrição(14) + série(5) + número(15) */
export function idDps(codMun: string, cnpj: string, serie: string, numero: number) {
  return `DPS${codMun}2${so(cnpj).padStart(14, "0")}${so(serie).padStart(5, "0")}${String(numero).padStart(15, "0")}`
}

export function montarDps(d: DadosDps): { xml: string; id: string } {
  const cMunEmi = d.prestador.codMunicipio || COD_MUN_SAO_PAULO
  const id = idDps(cMunEmi, d.prestador.cnpj, d.serie, d.numero)

  const doc = so(d.tomador.cpfCnpj)
  const docTomador = doc.length === 11 ? tag("CPF", doc) : tag("CNPJ", doc)

  const t = d.tomador
  const cep = so(t.cep)
  const endereco =
    t.codMunicipio && cep.length === 8 && t.logradouro
      ? `<end><endNac><cMun>${so(t.codMunicipio)}</cMun><CEP>${cep}</CEP></endNac>` +
        tag("xLgr", t.logradouro) +
        tag("nro", t.numero || "S/N") +
        tag("xCpl", t.complemento) +
        tag("xBairro", t.bairro || "-") +
        `</end>`
      : ""

  const s = d.servico
  const xml =
    `<DPS xmlns="${NS_NFSE}" versao="${VERSAO_DPS}">` +
    `<infDPS Id="${id}">` +
    `<tpAmb>${d.ambiente === "producao" ? 1 : 2}</tpAmb>` +
    `<dhEmi>${d.dhEmi}</dhEmi>` +
    `<verAplic>GestorMacintel_1.0</verAplic>` +
    `<serie>${so(d.serie)}</serie>` +
    `<nDPS>${d.numero}</nDPS>` +
    `<dCompet>${d.dCompet}</dCompet>` +
    `<tpEmit>1</tpEmit>` +
    `<cLocEmi>${cMunEmi}</cLocEmi>` +
    `<prest><CNPJ>${so(d.prestador.cnpj)}</CNPJ>` +
    // Simples Nacional ME/EPP (opSimpNac 3), apuração pelo SN (1), sem regime especial (0)
    `<regTrib><opSimpNac>3</opSimpNac><regApTribSN>1</regApTribSN><regEspTrib>0</regEspTrib></regTrib></prest>` +
    `<toma>${docTomador}${tag("xNome", t.nome)}${endereco}${tag("email", t.email)}</toma>` +
    `<serv><locPrest><cLocPrestacao>${s.codMunPrestacao || cMunEmi}</cLocPrestacao></locPrest>` +
    `<cServ><cTribNac>${so(s.codTribNacional)}</cTribNac>${tag("cTribMun", so(s.codTribMunicipal))}` +
    `${tag("xDescServ", s.descricao.slice(0, 2000))}${tag("cNBS", so(s.nbs))}</cServ></serv>` +
    `<valores><vServPrest><vServ>${dec(d.valor)}</vServ></vServPrest>` +
    `<trib><tribMun><tribISSQN>1</tribISSQN><tpRetISSQN>1</tpRetISSQN></tribMun>` +
    `<tribFed><piscofins><CST>00</CST><vPis>0</vPis><vCofins>0</vCofins><tpRetPisCofins>0</tpRetPisCofins></piscofins></tribFed>` +
    `<totTrib><vTotTrib><vTotTribFed>0</vTotTribFed><vTotTribEst>0</vTotTribEst>` +
    `<vTotTribMun>${dec(d.valorTotTribMun || 0)}</vTotTribMun></vTotTrib></totTrib></trib></valores>` +
    `</infDPS></DPS>`

  return { xml, id }
}

/** Data/hora atual no fuso de São Paulo, com offset (-03:00) */
export function agoraSaoPaulo() {
  const p = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).formatToParts(new Date())
  const g = (t: string) => p.find((x) => x.type === t)?.value || ""
  const data = `${g("year")}-${g("month")}-${g("day")}`
  // recua 1 min: a Sefin rejeita dhEmi posterior ao horário do servidor
  const d = new Date(`${data}T${g("hour")}:${g("minute")}:${g("second")}-03:00`)
  d.setMinutes(d.getMinutes() - 1)
  const q = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).formatToParts(d)
  const h = (t: string) => q.find((x) => x.type === t)?.value || ""
  return { dhEmi: `${h("year")}-${h("month")}-${h("day")}T${h("hour")}:${h("minute")}:${h("second")}-03:00`, data }
}
