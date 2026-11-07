"use client"

// DANFSe (Documento Auxiliar da NFS-e) gerado pelo sistema a partir do XML autorizado pela Sefin Nacional.
// Segue a organização do DANFSe oficial (v1.0); a validade jurídica é do XML — o QR Code leva à consulta pública.
import { useEffect, useState } from "react"
import { formatCurrency } from "@/lib/utils"

const URL_CONSULTA = "https://www.nfse.gov.br/ConsultaPublica/?tpc=1&chave="

function lerXml(xml?: string | null) {
  const vazio = (_: string) => ""
  if (!xml || typeof window === "undefined") return vazio
  try {
    const doc = new DOMParser().parseFromString(xml, "text/xml")
    return (tag: string) => doc.getElementsByTagNameNS("*", tag)[0]?.textContent?.trim() || ""
  } catch {
    return vazio
  }
}

const doc = (v?: string | null) => {
  const c = String(v || "").replace(/[^0-9]/g, "")
  if (c.length === 14) return c.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
  if (c.length === 11) return c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  return v || "-"
}
const cep = (v?: string | null) => {
  const c = String(v || "").replace(/[^0-9]/g, "").padStart(8, "0")
  return c === "00000000" ? "-" : c.replace(/(\d{5})(\d{3})/, "$1-$2")
}
const dataBR = (v?: string | null) => (v ? v.slice(0, 10).split("-").reverse().join("/") : "-")
// XML traz horário local com offset (-03:00); datas do banco chegam em UTC ("Z") e são convertidas para Brasília
const dataHoraBR = (v?: string | Date | null) => {
  if (!v) return "-"
  const t = String(v instanceof Date ? v.toISOString() : v)
  if (/[+-]\d{2}:\d{2}$/.test(t)) return `${dataBR(t)} ${t.slice(11, 19)}`
  const d = new Date(t)
  return isNaN(d.getTime()) ? t : d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }).replace(",", "")
}
const codTrib = (c?: string | null) => {
  const s = String(c || "").replace(/[^0-9]/g, "")
  return s.length === 6 ? `${s.slice(0, 2)}.${s.slice(2, 4)}.${s.slice(4)}` : c || "-"
}
const nbsFmt = (c?: string | null) => {
  const s = String(c || "").replace(/[^0-9]/g, "")
  return s.length === 9 ? `${s[0]}.${s.slice(1, 5)}.${s.slice(5, 7)}.${s.slice(7)}` : c || "-"
}

export function DanfseNacional({ nota, logo }: { nota: any; logo?: string | null }) {
  const x = lerXml(nota.xml_retorno)
  const chave = nota.chave_acesso || x("chNFSe")
  const [qr, setQr] = useState<string | null>(null)

  useEffect(() => {
    if (!chave) return
    import("qrcode").then((Q) => Q.toDataURL(URL_CONSULTA + chave, { margin: 0, width: 220 }).then(setQr)).catch(() => {})
  }, [chave])

  // Ambiente vem do tpAmb da DPS (1 = produção, 2 = homologação).
  // Atenção: ambGer NÃO é ambiente — é quem gerou a nota (2 = Sefin Nacional), vale 2 em notas reais.
  const homologacao = nota.status === "homologacao" || x("tpAmb") === "2"
  const cancelada = nota.status === "cancelada"
  const valor = Number(nota.valor_servicos || x("vServ") || 0)
  const aliquota = Number(nota.aliquota_iss || 0) * 100
  const numero = x("nNFSe") || String(nota.numero_nfse || "").replace(/[^0-9]/g, "")

  return (
    <div style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "9px", color: "#000", lineHeight: 1.3, position: "relative" }}>
      {(cancelada || homologacao) && (
        <div style={{
          position: "absolute", top: "38%", left: 0, right: 0, textAlign: "center", transform: "rotate(-35deg)",
          fontSize: homologacao ? "54px" : "80px", fontWeight: "bold", color: "rgba(200,0,0,0.18)", pointerEvents: "none", zIndex: 1,
        }}>
          {cancelada ? "CANCELADA" : "SEM VALOR FISCAL"}
        </div>
      )}

      {/* Cabeçalho */}
      <table style={{ ...tabela, borderTop: "1px solid #000" }}>
        <tbody>
          <tr>
            <td style={{ ...celula, width: "28%", verticalAlign: "middle" }}>
              <img src="/images/nfse-logo.png" alt="NFS-e Nota Fiscal de Serviço eletrônica" style={{ display: "block", width: 170, height: "auto" }} />
            </td>
            <td style={{ ...celula, textAlign: "center", verticalAlign: "middle" }}>
              <div style={{ fontSize: "12px", fontWeight: "bold" }}>DANFSe v1.0</div>
              <div style={{ fontSize: "10px", fontWeight: "bold" }}>Documento Auxiliar da NFS-e</div>
              {homologacao && <div style={{ color: "#c00", fontWeight: "bold" }}>AMBIENTE DE HOMOLOGAÇÃO — SEM VALOR FISCAL</div>}
            </td>
            <td style={{ ...celula, width: "28%", textAlign: "right", verticalAlign: "middle" }}>
              {logo ? <img src={logo} alt="" crossOrigin="anonymous" style={{ maxHeight: 40, maxWidth: 120, objectFit: "contain" }} /> : null}
              <div style={{ fontWeight: "bold" }}>{x("xLocEmi") || "São Paulo"} / SP</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Identificação */}
      <table style={tabela}>
        <tbody>
          <tr>
            <td style={celula} colSpan={3}>
              <Rot>Chave de acesso da NFS-e</Rot>
              <Val negrito>{chave || "-"}</Val>
            </td>
            <td style={{ ...celula, width: 110, textAlign: "center" }} rowSpan={3}>
              {qr && <img src={qr} alt="QR Code" style={{ width: 90, height: 90 }} />}
              <div style={{ fontSize: "6.5px", color: "#555", marginTop: 2 }}>
                Consulte a autenticidade em nfse.gov.br/ConsultaPublica
              </div>
            </td>
          </tr>
          <tr>
            <td style={celula}><Rot>Número da NFS-e</Rot><Val negrito>{numero || "-"}</Val></td>
            <td style={celula}><Rot>Competência da NFS-e</Rot><Val>{dataBR(x("dCompet"))}</Val></td>
            <td style={celula}><Rot>Data e hora da emissão da NFS-e</Rot><Val>{dataHoraBR(x("dhProc") || nota.data_emissao)}</Val></td>
          </tr>
          <tr>
            <td style={celula}><Rot>Número da DPS</Rot><Val>{x("nDPS") || nota.numero_dps || "-"}</Val></td>
            <td style={celula}><Rot>Série da DPS</Rot><Val>{x("serie") || nota.serie_dps || "-"}</Val></td>
            <td style={celula}><Rot>Data e hora da emissão da DPS</Rot><Val>{dataHoraBR(x("dhEmi"))}</Val></td>
          </tr>
          <tr>
            <td style={celula}><Rot>Emitente da NFS-e</Rot><Val>Prestador do serviço</Val></td>
            <td style={celula}><Rot>Situação da NFS-e</Rot><Val negrito>{cancelada ? "Cancelada" : "Regular"}</Val></td>
            <td style={celula} colSpan={2}><Rot>Finalidade</Rot><Val>NFS-e regular</Val></td>
          </tr>
        </tbody>
      </table>

      <Secao>Prestador / Fornecedor</Secao>
      <table style={tabela}>
        <tbody>
          <tr>
            <td style={celula} colSpan={2}><Rot>Nome / Nome empresarial</Rot><Val negrito>{x("xNome") || "-"}</Val></td>
            <td style={celula}><Rot>CNPJ / CPF</Rot><Val>{doc(nota.prestador_cnpj || x("CNPJ"))}</Val></td>
            <td style={celula}><Rot>Inscrição municipal</Rot><Val>{nota.prestador_inscricao_municipal || "-"}</Val></td>
          </tr>
          <tr>
            <td style={celula} colSpan={2}>
              <Rot>Endereço</Rot>
              <Val>{[x("xLgr"), x("nro"), x("xBairro")].filter(Boolean).join(", ") || "-"}</Val>
            </td>
            <td style={celula}><Rot>Município / CEP</Rot><Val>{x("xLocEmi") || "São Paulo"} - SP · {cep(x("CEP"))}</Val></td>
            <td style={celula}><Rot>Telefone / E-mail</Rot><Val>{[x("fone"), x("email").toLowerCase()].filter(Boolean).join(" · ") || "-"}</Val></td>
          </tr>
          <tr>
            <td style={celula} colSpan={4}>
              <Rot>Regime de tributação</Rot>
              <Val>Optante pelo Simples Nacional — ME/EPP · apuração dos tributos federais e municipal pelo Simples Nacional</Val>
            </td>
          </tr>
        </tbody>
      </table>

      <Secao>Tomador do serviço</Secao>
      <table style={tabela}>
        <tbody>
          <tr>
            <td style={celula} colSpan={2}><Rot>Nome / Nome empresarial</Rot><Val negrito>{nota.tomador_razao_social || "-"}</Val></td>
            <td style={celula}><Rot>CNPJ / CPF</Rot><Val>{doc(nota.tomador_cpf_cnpj)}</Val></td>
            <td style={celula}><Rot>Inscrição municipal</Rot><Val>{nota.tomador_inscricao_municipal || "-"}</Val></td>
          </tr>
          <tr>
            <td style={celula} colSpan={2}>
              <Rot>Endereço</Rot>
              <Val>{[nota.tomador_endereco, nota.tomador_numero, nota.tomador_complemento, nota.tomador_bairro].filter(Boolean).join(", ") || "-"}</Val>
            </td>
            <td style={celula}><Rot>Município / CEP</Rot><Val>{nota.tomador_cidade || "-"}{nota.tomador_uf ? ` - ${nota.tomador_uf}` : ""} · {cep(nota.tomador_cep)}</Val></td>
            <td style={celula}><Rot>E-mail</Rot><Val>{nota.tomador_email || "-"}</Val></td>
          </tr>
        </tbody>
      </table>

      <Secao>Serviço prestado</Secao>
      <table style={tabela}>
        <tbody>
          <tr>
            <td style={celula}><Rot>Código de tributação nacional</Rot><Val negrito>{codTrib(nota.codigo_tributacao_nacional || x("cTribNac"))}</Val></td>
            <td style={celula}><Rot>Código de tributação municipal</Rot><Val>{nota.codigo_tributacao_municipal || x("cTribMun") || "-"}</Val></td>
            <td style={celula}><Rot>Código NBS</Rot><Val>{nbsFmt(nota.nbs || x("cNBS"))}</Val></td>
            <td style={celula}><Rot>Local da prestação</Rot><Val>{x("xLocPrestacao") || "São Paulo"} - SP</Val></td>
          </tr>
          {(x("xTribNac") || x("xTribMun")) && (
            <tr>
              <td style={celula} colSpan={4}>
                <Rot>Descrição do código de tributação</Rot>
                <Val>{x("xTribMun") || x("xTribNac")}</Val>
              </td>
            </tr>
          )}
          <tr>
            <td style={{ ...celula, whiteSpace: "pre-wrap", minHeight: 70 }} colSpan={4}>
              <Rot>Descrição do serviço</Rot>
              <Val>{x("xDescServ") || nota.descricao_servico || "-"}</Val>
            </td>
          </tr>
        </tbody>
      </table>

      <Secao>Tributação municipal (ISSQN)</Secao>
      <table style={tabela}>
        <tbody>
          <tr>
            <td style={celula}><Rot>Tributação do ISSQN</Rot><Val>Operação tributável</Val></td>
            <td style={celula}><Rot>Município de incidência</Rot><Val>{x("xLocIncid") || "São Paulo"} - SP</Val></td>
            <td style={celula}><Rot>Regime especial</Rot><Val>Nenhum</Val></td>
            <td style={celula}><Rot>Retenção do ISSQN</Rot><Val>Não retido</Val></td>
          </tr>
          <tr>
            <td style={celula} colSpan={4}>
              <Rot>Apuração</Rot>
              <Val>ISSQN apurado pelo Simples Nacional (DAS) — não destacado nesta NFS-e</Val>
            </td>
          </tr>
        </tbody>
      </table>

      <Secao>Valor total da NFS-e</Secao>
      <table style={tabela}>
        <tbody>
          <tr>
            <td style={celula}><Rot>Valor do serviço</Rot><Val>{formatCurrency(valor)}</Val></td>
            <td style={celula}><Rot>Descontos</Rot><Val>{formatCurrency(0)}</Val></td>
            <td style={celula}><Rot>Retenções</Rot><Val>{formatCurrency(0)}</Val></td>
            <td style={{ ...celula, background: "#e8eef8" }}>
              <Rot>Valor líquido da NFS-e</Rot>
              <Val negrito grande>{formatCurrency(Number(x("vLiq") || valor))}</Val>
            </td>
          </tr>
        </tbody>
      </table>

      <Secao>Informações complementares</Secao>
      <table style={tabela}>
        <tbody>
          <tr>
            <td style={celula}>
              Documento emitido por ME ou EPP optante pelo Simples Nacional. Não gera direito a crédito fiscal de IPI.
              {aliquota > 0 && ` Tributos aproximados (Lei 12.741/2012): ${aliquota.toFixed(2).replace(".", ",")}% — ${formatCurrency(valor * aliquota / 100)}.`}
            </td>
          </tr>
        </tbody>
      </table>

      {cancelada && (
        <table style={{ ...tabela, border: "2px solid #c00" }}>
          <tbody>
            <tr>
              <td style={{ ...celula, textAlign: "center", color: "#c00", fontWeight: "bold" }}>
                NFS-e CANCELADA{nota.data_cancelamento ? ` em ${dataHoraBR(nota.data_cancelamento)}` : ""}
                {nota.motivo_cancelamento ? ` — Motivo: ${nota.motivo_cancelamento}` : ""}
              </td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  )
}

const tabela: React.CSSProperties = { width: "100%", borderCollapse: "collapse", border: "1px solid #000", borderTop: "none", position: "relative", zIndex: 2 }
// padding inferior maior: o html2canvas desenha o texto um pouco abaixo e ele encostava na linha
const celula: React.CSSProperties = { padding: "4px 8px 8px", verticalAlign: "top", border: "1px solid #999" }

function Secao({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#1b4f9c", color: "#fff", fontWeight: "bold", fontSize: "8.5px", lineHeight: 1, padding: "3px 8px 7px", textTransform: "uppercase", border: "1px solid #1b4f9c", marginTop: 4 }}>
      {children}
    </div>
  )
}
function Rot({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: "7px", color: "#555", textTransform: "uppercase", marginBottom: 1 }}>{children}</div>
}
function Val({ children, negrito, grande }: { children: React.ReactNode; negrito?: boolean; grande?: boolean }) {
  return <div style={{ fontSize: grande ? "12px" : "9.5px", fontWeight: negrito ? "bold" : "normal" }}>{children}</div>
}
