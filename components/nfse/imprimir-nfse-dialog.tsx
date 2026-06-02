"use client"

import { useState, useEffect, useRef } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Loader2, Printer, ExternalLink } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface ImprimirNfseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  notaId: number | null
}

function formatDateBR(dateStr: string | null): string {
  if (!dateStr) return "-"
  try {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

function formatDateTimeBR(dateStr: string | null): string {
  if (!dateStr) return "-"
  try {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  } catch {
    return dateStr
  }
}

function formatCpfCnpj(value: string): string {
  if (!value) return "-"
  const clean = value.replace(/\D/g, "")
  if (clean.length === 11) {
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  }
  if (clean.length === 14) {
    return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
  }
  return value
}

function formatCep(value: string): string {
  if (!value) return ""
  const clean = value.replace(/\D/g, "")
  if (clean.length === 8) {
    return clean.replace(/(\d{5})(\d{3})/, "$1-$2")
  }
  return value
}

export function ImprimirNfseDialog({ open, onOpenChange, notaId }: ImprimirNfseDialogProps) {
  const [loading, setLoading] = useState(false)
  const [dados, setDados] = useState<any>(null)
  const [brasaoBase64, setBrasaoBase64] = useState<string | null>(null)
  
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  
  const hiddenDivRef = useRef<HTMLDivElement>(null)

  // Convert brasao image to base64 so it works consistently in both modal and print window
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(img, 0, 0)
        setBrasaoBase64(canvas.toDataURL("image/png"))
      }
    }
    img.src = "/images/brasao-sp.png"
  }, [])

  useEffect(() => {
    if (open && notaId) {
      fetchDados()
    }
  }, [open, notaId])

  const fetchDados = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/nfse/${notaId}/imprimir`)
      const result = await response.json()
      if (result.success) {
        setDados(result.data)
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error)
    } finally {
      setLoading(false)
    }
  }

  // Clear PDF on close or change
  useEffect(() => {
    if (!open) {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
        setPdfUrl(null)
      }
      setDados(null)
    }
  }, [open, pdfUrl])

  useEffect(() => {
    if (dados && !generatingPdf && !pdfUrl) {
      setGeneratingPdf(true)
      // Aguardar renderização no DOM off-screen
      setTimeout(async () => {
        try {
          const element = hiddenDivRef.current
          if (!element) return

          const html2canvas = (await import("html2canvas")).default
          const { jsPDF } = await import("jspdf")

          const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
          })

          const imgData = canvas.toDataURL("image/png")
          const pdf = new jsPDF("p", "mm", "a4")
          const imgWidth = 210
          const pageHeight = 295
          const imgHeight = (canvas.height * imgWidth) / canvas.width
          let heightLeft = imgHeight
          let position = 0

          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
          heightLeft -= pageHeight

          while (heightLeft >= 0) {
            position = heightLeft - imgHeight
            pdf.addPage()
            pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
            heightLeft -= pageHeight
          }

          const pdfBlob = pdf.output("blob")
          const url = URL.createObjectURL(pdfBlob)
          setPdfUrl(url)
        } catch (error) {
          console.error("Erro ao gerar PDF:", error)
        } finally {
          setGeneratingPdf(false)
        }
      }, 600)
    }
  }, [dados, generatingPdf, pdfUrl])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-4xl h-full flex flex-col p-0 gap-0 overflow-hidden border-l border-border shadow-2xl bg-card text-foreground animate-in slide-in-from-right duration-300">
        <SheetHeader className="border-b border-border p-6 flex-shrink-0 bg-muted/30">
          <SheetTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-foreground">
              <Printer className="h-5 w-5 text-emerald-500" />
              Imprimir NFS-e
            </span>
            <div className="flex gap-2 mr-6">
              {pdfUrl && (
                <Button
                  size="sm"
                  onClick={() => window.open(pdfUrl, "_blank")}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir em Nova Aba
                </Button>
              )}
            </div>
          </SheetTitle>
        </SheetHeader>

        {loading || generatingPdf ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto mb-4" />
              <p className="text-muted-foreground text-sm">Gerando visualização em PDF...</p>
            </div>
          </div>
        ) : pdfUrl ? (
          <div className="flex-1 bg-white">
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title="NFS-e PDF Preview"
            />
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">Nota fiscal não encontrada</div>
        )}

        {/* Container invisivel para geracao do PDF */}
        {dados && !pdfUrl && (
          <div style={{ position: "absolute", left: "-9999px", top: "-9999px", width: "800px" }}>
            <div ref={hiddenDivRef} className="p-6 bg-white">
              <NfsePrefeituraSP
                nota={dados.nota}
                prestador={dados.prestador}
                logo={dados.logo}
                brasaoBase64={brasaoBase64}
              />
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

// ============================================================
// Componente que renderiza o layout oficial da Prefeitura de SP
// ============================================================
export function NfsePrefeituraSP({ nota, prestador, logo, brasaoBase64 }: { nota: any; prestador: any; logo: string | null; brasaoBase64: string | null }) {
  const isCancelada = nota.status === "cancelada"

  const enderecoTomador = [
    nota.tomador_endereco,
    nota.tomador_numero,
    nota.tomador_complemento,
  ].filter(Boolean).join(", ")

  const enderecoPrestador = [
    prestador?.endereco,
    prestador?.numero_endereco,
    prestador?.complemento,
  ].filter(Boolean).join(", ")

  const valorServicos = nota.valor_servicos || 0
  const valorDeducoes = nota.valor_deducoes || 0
  const baseCalculo = valorServicos - valorDeducoes
  const aliquotaIss = (nota.aliquota_iss || 0) * 100
  const valorIss = nota.valor_iss || 0
  const valorCredito = 0 // Credito nao disponivel no sistema
  const isOptanteSimples = prestador?.optante_simples === 1 || prestador?.optante_simples === "1"

  return (
    <div style={{
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "10px",
      color: "#000",
      maxWidth: "100%",
      margin: "0 auto",
      lineHeight: 1.3,
    }}>
      {/* ===== CABECALHO PREFEITURA ===== */}
      <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #1a3a6e" }}>
        <tbody>
          <tr>
            <td style={{ width: "80px", padding: "8px 10px", verticalAlign: "middle", borderRight: "1px solid #1a3a6e", textAlign: "center" }}>
              {/* Brasao oficial da Prefeitura de Sao Paulo */}
              <img
                src={brasaoBase64 || "/images/brasao-sp.png"}
                alt="Brasao da Prefeitura de Sao Paulo"
                style={{ display: "block", margin: "0 auto", width: "60px", height: "auto" }}
                crossOrigin="anonymous"
              />
            </td>
            <td style={{ padding: "8px 16px", verticalAlign: "middle" }}>
              <div style={{ fontSize: "11px", fontWeight: "bold", color: "#1a3a6e", marginBottom: 1 }}>
                PREFEITURA DO MUNICIPIO DE SAO PAULO
              </div>
              <div style={{ fontSize: "10px", color: "#1a3a6e", marginBottom: 4 }}>
                SECRETARIA MUNICIPAL DA FAZENDA
              </div>
              <div style={{ fontSize: "14px", fontWeight: "bold", color: "#1a3a6e", letterSpacing: "0.3px" }}>
                NOTA FISCAL ELETRONICA DE SERVICOS - NFS-e
              </div>
              {nota.numero_rps && (
                <div style={{ fontSize: "9px", color: "#444", marginTop: 4 }}>
                  RPS N.{" "}{nota.numero_rps}{nota.serie_rps ? ` Serie ${nota.serie_rps}` : ""}, emitido em {formatDateBR(nota.data_emissao || nota.created_at)}
                </div>
              )}
            </td>
            <td style={{ width: "200px", padding: "8px 12px", verticalAlign: "top", borderLeft: "1px solid #1a3a6e" }}>
              {isCancelada && (
                <div style={{
                  background: "#dc2626",
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: "11px",
                  padding: "3px 10px",
                  marginBottom: 6,
                  textAlign: "center",
                }}>
                  CANCELADA
                </div>
              )}
              <div style={{ marginBottom: 6 }}>
                <div style={{ fontSize: "8px", color: "#555", textTransform: "uppercase" }}>Numero da Nota</div>
                <div style={{ fontSize: "18px", fontWeight: "bold", color: "#1a3a6e" }}>
                  {nota.numero_nfse ? String(nota.numero_nfse).padStart(8, "0") : "-"}
                </div>
              </div>
              <div style={{ marginBottom: 4 }}>
                <div style={{ fontSize: "8px", color: "#555", textTransform: "uppercase" }}>Data e Hora de Emissao</div>
                <div style={{ fontSize: "10px", fontWeight: "bold", color: "#000" }}>
                  {formatDateTimeBR(nota.data_emissao || nota.created_at)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "8px", color: "#555", textTransform: "uppercase" }}>Codigo de Verificacao</div>
                <div style={{ fontSize: "10px", fontWeight: "bold", color: "#000" }}>
                  {nota.codigo_verificacao || "-"}
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Dados ja exibidos no cabecalho - sem duplicacao */}

      {/* ===== PRESTADOR DE SERVICOS ===== */}
      <SectionHeader>PRESTADOR DE SERVICOS</SectionHeader>
      <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", borderTop: "none" }}>
        <tbody>
          <tr>
            {/* Logo da empresa ao lado esquerdo do prestador (vem do sistema - Configuracoes > Logos) */}
            {logo && (
              <td rowSpan={3} style={{ width: "70px", padding: "6px 8px", verticalAlign: "middle", borderRight: "1px solid #999", textAlign: "center" }}>
                <img
                  src={logo}
                  alt="Logo da empresa"
                  style={{ display: "block", margin: "0 auto", maxWidth: "55px", maxHeight: "55px", objectFit: "contain" }}
                  crossOrigin="anonymous"
                />
              </td>
            )}
            <td style={{ ...cellStyle, borderRight: "1px solid #999", width: "auto" }}>
              <FieldLabel>Nome/Razao Social</FieldLabel>
              <FieldValue bold>{prestador?.razao_social || "-"}</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", width: "22%" }}>
              <FieldLabel>CPF/CNPJ</FieldLabel>
              <FieldValue>{formatCpfCnpj(prestador?.cnpj || "")}</FieldValue>
            </td>
            <td style={{ ...cellStyle, width: "22%" }}>
              <FieldLabel>Inscricao Municipal</FieldLabel>
              <FieldValue>{prestador?.inscricao_municipal || "-"}</FieldValue>
            </td>
          </tr>
          <tr>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", borderTop: "1px solid #999" }}>
              <FieldLabel>Endereco</FieldLabel>
              <FieldValue>{enderecoPrestador || "-"}</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", borderTop: "1px solid #999" }}>
              <FieldLabel>Municipio</FieldLabel>
              <FieldValue>{prestador?.cidade || "SAO PAULO"} - {prestador?.uf || "SP"}</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderTop: "1px solid #999" }}>
              <FieldLabel>CEP</FieldLabel>
              <FieldValue>{formatCep(prestador?.cep || "")}</FieldValue>
            </td>
          </tr>
          {(prestador?.email || prestador?.telefone) && (
            <tr>
              <td style={{ ...cellStyle, borderRight: "1px solid #999", borderTop: "1px solid #999" }}>
                <FieldLabel>E-mail</FieldLabel>
                <FieldValue>{prestador?.email || "-"}</FieldValue>
              </td>
              <td colSpan={2} style={{ ...cellStyle, borderTop: "1px solid #999" }}>
                <FieldLabel>Telefone</FieldLabel>
                <FieldValue>{prestador?.telefone || "-"}</FieldValue>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ===== TOMADOR DE SERVICOS ===== */}
      <SectionHeader>TOMADOR DE SERVICOS</SectionHeader>
      <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", borderTop: "none" }}>
        <tbody>
          <tr>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", width: "50%" }}>
              <FieldLabel>Nome/Razao Social</FieldLabel>
              <FieldValue bold>{nota.tomador_razao_social || "-"}</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", width: "25%" }}>
              <FieldLabel>CPF/CNPJ</FieldLabel>
              <FieldValue>{formatCpfCnpj(nota.tomador_cpf_cnpj || "")}</FieldValue>
            </td>
            <td style={{ ...cellStyle, width: "25%" }}>
              <FieldLabel>Inscricao Municipal</FieldLabel>
              <FieldValue>{nota.tomador_inscricao_municipal || "-"}</FieldValue>
            </td>
          </tr>
          <tr>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", borderTop: "1px solid #999" }}>
              <FieldLabel>Endereco</FieldLabel>
              <FieldValue>{enderecoTomador || "-"}</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", borderTop: "1px solid #999" }}>
              <FieldLabel>Municipio</FieldLabel>
              <FieldValue>{nota.tomador_cidade || "-"}{nota.tomador_uf ? ` - ${nota.tomador_uf}` : ""}</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderTop: "1px solid #999" }}>
              <FieldLabel>CEP</FieldLabel>
              <FieldValue>{formatCep(nota.tomador_cep || "")}</FieldValue>
            </td>
          </tr>
          <tr>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", borderTop: "1px solid #999" }}>
              <FieldLabel>E-mail</FieldLabel>
              <FieldValue>{nota.tomador_email || "-"}</FieldValue>
            </td>
            <td colSpan={2} style={{ ...cellStyle, borderTop: "1px solid #999" }}>
              <FieldLabel>Bairro</FieldLabel>
              <FieldValue>{nota.tomador_bairro || "-"}</FieldValue>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ===== DISCRIMINACAO DOS SERVICOS ===== */}
      <SectionHeader>DISCRIMINACAO DOS SERVICOS</SectionHeader>
      <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", borderTop: "none" }}>
        <tbody>
          <tr>
            <td style={{ padding: "10px 12px", minHeight: "80px", whiteSpace: "pre-wrap", lineHeight: 1.5, fontSize: "10px", verticalAlign: "top" }}>
              {nota.descricao_servico || "-"}
              {nota.observacoes_tributos ? (
                <div style={{ marginTop: 8, fontSize: "9px", color: "#444" }}>
                  {nota.observacoes_tributos}
                </div>
              ) : (
                <div style={{ marginTop: 8, fontSize: "9px" }}>
                  {`\n- Conforme Lei 12.741/2012, o percentual total de impostos incidentes neste serviço prestado é de aproximadamente ${aliquotaIss.toFixed(2)}%`}
                </div>
              )}
            </td>
          </tr>
          {/* Retencoes federais na linha de discriminacao, como no modelo oficial */}
          <tr>
            <td style={{ padding: "4px 12px", borderTop: "1px solid #999" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", fontSize: "9px" }}>
                <span><strong>INSS (R$)</strong> {formatCurrency(nota.valor_inss || 0)}</span>
                <span><strong>IRRF (R$)</strong> {formatCurrency(nota.valor_ir || 0)}</span>
                <span><strong>CSLL (R$)</strong> {formatCurrency(nota.valor_csll || 0)}</span>
                <span><strong>COFINS (R$)</strong> {formatCurrency(nota.valor_cofins || 0)}</span>
                <span><strong>PIS/PASEP (R$)</strong> {formatCurrency(nota.valor_pis || 0)}</span>
              </div>
            </td>
          </tr>
          {/* Valor total em destaque */}
          <tr>
            <td style={{
              padding: "8px 12px",
              borderTop: "2px solid #1a3a6e",
              background: "#e8edf5",
              textAlign: "right",
            }}>
              <span style={{ fontSize: "14px", fontWeight: "bold", color: "#1a3a6e" }}>
                VALOR TOTAL DO SERVICO = {formatCurrency(nota.valor_total || valorServicos)}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ===== CODIGO DO SERVICO + TRIBUTOS (layout oficial) ===== */}
      <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", borderTop: "none" }}>
        <tbody>
          {/* Codigo do servico - linha inteira com descricao (ex: 07498 - Conserto, restauracao...) */}
          <tr>
            <td colSpan={6} style={{ ...cellStyle, borderBottom: "1px solid #999" }}>
              <FieldLabel>Codigo do Servico</FieldLabel>
              <FieldValue bold>{(() => {
                const codigoNota = nota.codigo_servico
                const codigoConfig = prestador?.codigo_servico
                const descConfig = prestador?.descricao_servico
                const codigo = codigoNota || codigoConfig
                if (!codigo) return "-"
                // Se o codigo ja contem descricao (ex: "07498 - Conserto..."), usar direto
                if (codigo.includes(" - ")) return codigo
                // Senao, montar codigo + descricao do config
                return descConfig ? `${codigo} - ${descConfig}` : codigo
              })()}</FieldValue>
            </td>
          </tr>
          {/* Linha de tributos: Deducoes, Base Calculo, Municipio, Aliquota, ISS, Credito */}
          <tr>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", textAlign: "right" }}>
              <FieldLabel>Valor Total das Deducoes (R$)</FieldLabel>
              <FieldValue>{formatCurrency(valorDeducoes)}</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", textAlign: "right" }}>
              <FieldLabel>Base de Calculo (R$)</FieldLabel>
              <FieldValue bold>{isOptanteSimples ? "*" : formatCurrency(baseCalculo)}</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderRight: "1px solid #999" }}>
              <FieldLabel>Municipio da Prestacao</FieldLabel>
              <FieldValue>{prestador?.cidade || "SAO PAULO"}</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", textAlign: "center" }}>
              <FieldLabel>Aliquota (%)</FieldLabel>
              <FieldValue>{isOptanteSimples ? "*" : aliquotaIss.toFixed(2)}</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", textAlign: "right" }}>
              <FieldLabel>Valor do ISS (R$)</FieldLabel>
              <FieldValue bold>{isOptanteSimples ? "*" : formatCurrency(valorIss)}</FieldValue>
            </td>
            <td style={{ ...cellStyle, textAlign: "right" }}>
              <FieldLabel>Credito (R$)</FieldLabel>
              <FieldValue>{formatCurrency(valorCredito)}</FieldValue>
            </td>
          </tr>
          {/* Numero inscricao da obra + ISS retido */}
          <tr>
            <td colSpan={3} style={{ ...cellStyle, borderTop: "1px solid #999", borderRight: "1px solid #999" }}>
              <FieldLabel>Numero Inscricao da Obra</FieldLabel>
              <FieldValue>{nota.numero_inscricao_obra || "-"}</FieldValue>
            </td>
            <td colSpan={3} style={{ ...cellStyle, borderTop: "1px solid #999" }}>
              <FieldLabel>Valor Aproximado dos Tributos / Fonte</FieldLabel>
              <FieldValue>{nota.iss_retido ? "ISS Retido na Fonte" : "-"}</FieldValue>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ===== OUTRAS INFORMACOES ===== */}
      <SectionHeader>OUTRAS INFORMACOES</SectionHeader>
      <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", borderTop: "none" }}>
        <tbody>
          <tr>
            <td style={{ padding: "8px 12px", fontSize: "9px", lineHeight: 1.5, whiteSpace: "pre-wrap", verticalAlign: "top", minHeight: "40px" }}>
              {nota.informacoes_complementares || nota.observacoes || (
                <>
                  (1) Esta NFS-e foi emitida com respaldo na Lei n. 14.097/2005;{" "}
                  (2) Documento emitido por ME ou EPP optante pelo Simples Nacional;{" "}
                  {nota.numero_rps && `(3) Esta NFS-e substitui o RPS N. ${nota.numero_rps}${nota.serie_rps ? ` Serie ${nota.serie_rps}` : ""}, emitido em ${formatDateBR(nota.data_emissao || nota.created_at)};`}
                </>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ===== CANCELAMENTO ===== */}
      {isCancelada && (
        <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #dc2626", marginTop: 4 }}>
          <tbody>
            <tr>
              <td style={{ padding: "8px 16px", background: "#fef2f2", textAlign: "center" }}>
                <div style={{ fontSize: "14px", fontWeight: "bold", color: "#dc2626", marginBottom: 2 }}>
                  NOTA FISCAL CANCELADA
                </div>
                {nota.data_cancelamento && (
                  <div style={{ fontSize: "10px", color: "#991b1b" }}>
                    Data do cancelamento: {formatDateTimeBR(nota.data_cancelamento)}
                  </div>
                )}
                {nota.motivo_cancelamento && (
                  <div style={{ fontSize: "10px", color: "#991b1b", marginTop: 2 }}>
                    Motivo: {nota.motivo_cancelamento}
                  </div>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      )}

      {/* ===== RODAPE ===== */}
      <div style={{
        marginTop: 10,
        padding: "6px 12px",
        textAlign: "center",
        fontSize: "8px",
        color: "#555",
        lineHeight: 1.5,
        borderTop: "1px solid #1a3a6e",
      }}>
        <div>Consulte a autenticidade desta NFS-e em: <strong>nfe.prefeitura.sp.gov.br</strong></div>
        <div style={{ marginTop: 2 }}>
          Inscricao Municipal: {prestador?.inscricao_municipal || "-"} | Numero da Nota: {nota.numero_nfse ? String(nota.numero_nfse).padStart(8, "0") : "-"} | Codigo de Verificacao: {nota.codigo_verificacao || "-"}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Sub-componentes auxiliares para o layout oficial
// ============================================================

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "#1a3a6e",
      color: "#fff",
      fontSize: "9px",
      fontWeight: "bold",
      padding: "4px 12px",
      letterSpacing: "0.5px",
      textTransform: "uppercase",
      border: "1px solid #1a3a6e",
      borderBottom: "none",
    }}>
      {children}
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: "8px", color: "#666", marginBottom: 1, textTransform: "uppercase" }}>
      {children}
    </div>
  )
}

function FieldValue({ children, bold }: { children: React.ReactNode; bold?: boolean }) {
  return (
    <div style={{ fontSize: "10px", fontWeight: bold ? "bold" : "normal", color: "#000" }}>
      {children}
    </div>
  )
}

// Estilos compartilhados
const cellStyle: React.CSSProperties = {
  padding: "5px 12px",
  verticalAlign: "top",
}

// ============================================================
// CSS para impressao
// ============================================================
export function getPrintStyles(): string {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10px;
      color: #000;
      padding: 10px;
      line-height: 1.3;
    }
    table { border-collapse: collapse; }
    div[style*="background"] { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
    td[style*="background"] { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
  `
}
