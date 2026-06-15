"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/ui/phone-input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ImageIcon, MapPin, Printer, Eye, Loader2, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { useCep } from "@/hooks/use-cep"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useRef } from "react"

interface LayoutConfig {
  id?: number
  empresa_nome?: string
  empresa_cnpj?: string
  empresa_endereco?: string
  empresa_cep?: string
  empresa_bairro?: string
  empresa_cidade?: string
  empresa_uf?: string
  empresa_telefone?: string
  empresa_email?: string
  empresa_site?: string
  empresa_representante_legal?: string
  representante_nacionalidade?: string
  representante_estado_civil?: string
  representante_rg?: string
  representante_cpf?: string
  empresa_latitude?: number | null
  empresa_longitude?: number | null
  tamanho_papel?: string
  orientacao?: string
  margem_superior?: number
  margem_inferior?: number
  margem_esquerda?: number
  margem_direita?: number
  cabecalho?: string
  rodape?: string
  rodape_texto?: string
  ativo?: boolean
}

interface Logo {
  id: number
  tipo: string
  nome: string
  dados?: string
  formato?: string
  tamanho?: number
  ativo: boolean
}

interface Coordenadas {
  lat: number
  lng: number
}

const estadosBrasil = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
]

const estadosCivis = ["Solteiro(a)", "Casado(a)", "Divorciado(a)", "Viúvo(a)", "União Estável"]

export function LayoutTab() {
  const [config, setConfig] = useState<LayoutConfig>({
    empresa_nome: "",
    empresa_cnpj: "",
    empresa_endereco: "",
    empresa_cep: "",
    empresa_bairro: "",
    empresa_cidade: "",
    empresa_uf: "",
    empresa_telefone: "",
    empresa_email: "",
    empresa_site: "",
    empresa_representante_legal: "",
    representante_nacionalidade: "",
    representante_estado_civil: "",
    representante_rg: "",
    representante_cpf: "",
    empresa_latitude: null,
    empresa_longitude: null,
    tamanho_papel: "A4",
    orientacao: "retrato",
    margem_superior: 10,
    margem_inferior: 10,
    margem_esquerda: 15,
    margem_direita: 15,
    cabecalho: "",
    rodape: "",
    rodape_texto: "",
  })
  const [logoImpressao, setLogoImpressao] = useState<Logo | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [coordenadas, setCoordenadas] = useState<Coordenadas | null>(null)
  const [buscandoCoordenadas, setBuscandoCoordenadas] = useState(false)
  const { buscarCep, buscarCoordenadas, loading: loadingCep } = useCep()

  // Preview States
  const [showPreview, setShowPreview] = useState(false)
  const [previewMode, setPreviewMode] = useState<"visualizar" | "imprimir">("visualizar")
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const hiddenPreviewRef = useRef<HTMLDivElement>(null)

  // Clear PDF on close
  useEffect(() => {
    if (!showPreview) {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
        setPdfUrl(null)
      }
    }
  }, [showPreview, pdfUrl])

  useEffect(() => {
    carregarConfig()
    carregarLogoImpressao()
  }, [])

  useEffect(() => {
    if (config.empresa_latitude && config.empresa_longitude) {
      setCoordenadas({
        lat: config.empresa_latitude,
        lng: config.empresa_longitude,
      })
    }
  }, [config.empresa_latitude, config.empresa_longitude])

  // PDF Generator for Papel Timbrado
  useEffect(() => {
    if (showPreview && previewMode === "imprimir" && config && !generatingPdf && !pdfUrl) {
      setGeneratingPdf(true)
      setTimeout(async () => {
        try {
          const element = hiddenPreviewRef.current
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
          const pageHeight = 297
          const imgHeight = (canvas.height * imgWidth) / canvas.width
          let heightLeft = imgHeight
          let position = 0

          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
          heightLeft -= pageHeight

          while (heightLeft > 10) {
            position = heightLeft - imgHeight
            pdf.addPage()
            pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
            heightLeft -= pageHeight
          }

          const pdfBlob = pdf.output("blob")
          const url = URL.createObjectURL(pdfBlob)
          setPdfUrl(url)
        } catch (error) {
          console.error("Erro ao gerar PDF do papel timbrado:", error)
          toast.error("Erro ao gerar PDF do papel timbrado")
        } finally {
          setGeneratingPdf(false)
        }
      }, 600)
    }
  }, [showPreview, previewMode, config, generatingPdf, pdfUrl])

  const carregarConfig = async () => {
    try {
      const response = await fetch("/api/configuracoes/layout")
      const data = await response.json()

      if (data.success && data.data) {
        setConfig({
          empresa_nome: data.data.empresa_nome || "",
          empresa_cnpj: data.data.empresa_cnpj || "",
          empresa_endereco: data.data.empresa_endereco || "",
          empresa_cep: data.data.empresa_cep || "",
          empresa_bairro: data.data.empresa_bairro || "",
          empresa_cidade: data.data.empresa_cidade || "",
          empresa_uf: data.data.empresa_uf || "",
          empresa_telefone: data.data.empresa_telefone || "",
          empresa_email: data.data.empresa_email || "",
          empresa_site: data.data.empresa_site || "",
          empresa_representante_legal: data.data.empresa_representante_legal || "",
          representante_nacionalidade: data.data.representante_nacionalidade || "",
          representante_estado_civil: data.data.representante_estado_civil || "",
          representante_rg: data.data.representante_rg || "",
          representante_cpf: data.data.representante_cpf || "",
          empresa_latitude: data.data.empresa_latitude || null,
          empresa_longitude: data.data.empresa_longitude || null,
          tamanho_papel: data.data.tamanho_papel || "A4",
          orientacao: data.data.orientacao || "retrato",
          margem_superior: data.data.margem_superior || 10,
          margem_inferior: data.data.margem_inferior || 10,
          margem_esquerda: data.data.margem_esquerda || 15,
          margem_direita: data.data.margem_direita || 15,
          cabecalho: data.data.cabecalho || "",
          rodape: data.data.rodape || "",
          rodape_texto: data.data.rodape_texto || "",
        })
      }
    } catch (error) {
      console.error("Erro ao carregar configuração:", error)
      toast.error("Erro ao carregar configuração de layout")
    }
  }

  const carregarLogoImpressao = async () => {
    try {
      const response = await fetch("/api/configuracoes/logos")
      const data = await response.json()

      if (data.success && data.data) {
        const logoImpressaoEncontrado = data.data.find(
          (logo: Logo) => logo.tipo === "impressao" && logo.ativo && logo.dados,
        )
        setLogoImpressao(logoImpressaoEncontrado || null)
      }
    } catch (error) {
      console.error("Erro ao carregar logo de impressão:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSalvar = async () => {
    try {
      setSaving(true)

      const response = await fetch("/api/configuracoes/layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message || "Configurações salvas com sucesso!")
        await carregarConfig()
      } else {
        toast.error(data.error || "Erro ao salvar configurações")
      }
    } catch (error) {
      console.error("Erro ao salvar:", error)
      toast.error("Erro ao salvar configurações")
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof LayoutConfig, value: string | number) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const formatarCEP = async (value: string) => {
    const numeros = value.replace(/\D/g, "")
    const cepFormatado = numeros.replace(/(\d{5})(\d{3})/, "$1-$2")

    handleInputChange("empresa_cep", cepFormatado)

    if (numeros.length === 8) {
      const endereco = await buscarCep(numeros)
      if (endereco) {
        setConfig((prev) => ({
          ...prev,
          empresa_endereco: endereco.logradouro || prev.empresa_endereco,
          empresa_bairro: endereco.bairro || prev.empresa_bairro,
          empresa_cidade: endereco.localidade || prev.empresa_cidade,
          empresa_uf: endereco.uf || prev.empresa_uf,
        }))

        if (endereco.logradouro && endereco.localidade && endereco.uf) {
          setBuscandoCoordenadas(true)
          const coords = await buscarCoordenadas(endereco.logradouro, endereco.localidade, endereco.uf)

          if (coords) {
            setCoordenadas(coords)
            setConfig((prev) => ({
              ...prev,
              empresa_latitude: coords.lat,
              empresa_longitude: coords.lng,
            }))
          }

          setBuscandoCoordenadas(false)
        }
      }
    } else {
      setCoordenadas(null)
      setConfig((prev) => ({
        ...prev,
        empresa_latitude: null,
        empresa_longitude: null,
      }))
    }

    return cepFormatado
  }

  const formatarCNPJ = (value: string) => {
    const numeros = value.replace(/\D/g, "")
    return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
  }

  const formatarCPF = (value: string) => {
    const numeros = value.replace(/\D/g, "")
    return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  }

  const formatarRG = (value: string) => {
    const numeros = value.replace(/\D/g, "")
    return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, "$1.$2.$3-$4")
  }

  const gerarHTMLPapelTimbrado = () => {
    const logoSrc = logoImpressao?.dados || ""

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Papel Timbrado - ${config.empresa_nome || "Empresa"}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            background: white;
            color: black;
        }
        
        .page {
            width: 21cm;
            height: 29.7cm;
            padding-top: ${config.margem_superior}mm;
            padding-bottom: ${config.margem_inferior}mm;
            padding-left: ${config.margem_esquerda}mm;
            padding-right: ${config.margem_direita}mm;
            margin: 0 auto;
            background: white;
            position: relative;
            display: flex;
            flex-direction: column;
        }
        
        .page-header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
        }
        
        .logo {
            margin-bottom: 10px;
        }
        
        .logo img {
            max-height: 80px;
            width: auto;
        }
        
        .cabecalho-personalizado {
            font-size: 10px;
            line-height: 1.4;
            color: #333;
        }
        
        .conteudo {
            flex: 1;
            padding: 20px 0;
        }
        
        .page-footer {
            text-align: center;
            font-size: 9px;
            border-top: 2px solid #333;
            padding-top: 10px;
            line-height: 1.3;
            color: #333;
            margin-top: auto;
        }
        
        @media print {
            body {
                margin: 0;
                padding: 0;
            }
            
            .page {
                margin: 0;
                box-shadow: none;
            }
            
            @page {
                margin: 0;
                size: A4 portrait;
            }
        }
        
        @media screen {
            .page {
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                margin: 20px auto;
            }
        }
    </style>
</head>
<body>
    <div class="page">
        <div class="page-header">
            ${
              logoSrc
                ? `
                <div class="logo">
                    <img src="${logoSrc}" alt="Logo da Empresa" />
                </div>
            `
                : ""
            }
            
            ${
              config.cabecalho
                ? `
                <div class="cabecalho-personalizado">
                    ${config.cabecalho}
                </div>
            `
                : ""
            }
        </div>
        
        <div class="conteudo">
            <!-- Área em branco para conteúdo -->
        </div>
        
        ${
          config.rodape
            ? `
            <div class="page-footer">
                ${config.rodape}
            </div>
        `
            : ""
        }
    </div>
</body>
</html>
    `
  }

  const handleVisualizarPapelTimbrado = () => {
    setPreviewMode("visualizar")
    setShowPreview(true)
  }

  const handleImprimirPapelTimbrado = () => {
    setPreviewMode("imprimir")
    setShowPreview(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando configurações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">📄 Layout de Impressão</h2>
        <p className="text-muted-foreground">Configure o layout para impressão de documentos</p>
      </div>

      <div className="grid gap-6">
        {/* Seção do Papel Timbrado */}
        <Card className="border border-purple-500/20 bg-purple-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              📋 Papel Timbrado
              <span className="text-sm font-normal text-muted-foreground">- Folha em branco com logo e cabeçalho</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Visualize ou imprima uma folha de papel timbrado em branco com o logo e cabeçalho da empresa no topo e o
                rodapé no fim da página.
              </p>

              <div className="flex gap-3">
                <Button onClick={handleVisualizarPapelTimbrado} variant="outline" className="flex-1 bg-transparent border-border text-foreground hover:bg-muted">
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar Papel Timbrado
                </Button>
                <Button onClick={handleImprimirPapelTimbrado} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir Papel Timbrado
                </Button>
              </div>

              {/* Preview Miniatura */}
              <div className="border border-border rounded-lg p-4 bg-muted/40">
                <p className="text-xs text-muted-foreground mb-3 text-center font-medium">Preview Miniatura</p>
                <div
                  className="border border-slate-300 shadow-sm mx-auto bg-white text-black"
                  style={{
                    width: "210px",
                    height: "297px",
                    display: "flex",
                    flexDirection: "column",
                    padding: "10px",
                  }}
                >
                  {/* Header */}
                  <div className="text-center border-b border-slate-200 pb-2 mb-2">
                    {logoImpressao?.dados && (
                      <img
                        src={logoImpressao.dados || "/placeholder.svg"}
                        alt="Logo"
                        className="mx-auto mb-1"
                        style={{ maxHeight: "25px", width: "auto" }}
                      />
                    )}
                    {config.cabecalho && (
                      <div
                        className="text-[4px] leading-tight text-slate-800"
                        dangerouslySetInnerHTML={{ __html: config.cabecalho }}
                      />
                    )}
                  </div>

                  {/* Área de conteúdo vazia */}
                  <div className="flex-1"></div>

                  {/* Footer */}
                  {config.rodape && (
                    <div
                      className="text-center border-t border-slate-200 pt-2 mt-2 text-[4px] leading-tight text-slate-800"
                      dangerouslySetInnerHTML={{ __html: config.rodape }}
                    />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logo para Documentos */}
        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Logo para Documentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-purple-400">📷 Logo de Impressão</div>
              <p className="text-sm text-muted-foreground">
                {logoImpressao
                  ? "O logo de impressão configurado na aba 'Logos do Sistema' será usado automaticamente nos documentos."
                  : "Nenhum logo de impressão configurado. Configure um logo na aba 'Logos do Sistema'."}
              </p>
            </div>
            <div className="mt-4 p-4 bg-muted/40 border border-border rounded-lg">
              <p className="text-sm font-medium mb-2 text-foreground">Preview do Logo Atual</p>
              {logoImpressao && logoImpressao.dados ? (
                <img
                  src={logoImpressao.dados || "/placeholder.svg"}
                  alt="Logo de Impressão"
                  className="max-h-16 object-contain"
                />
              ) : (
                <div className="w-16 h-16 bg-muted border border-border rounded-lg flex items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-8 w-8" />
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {logoImpressao
                  ? `Formato: ${logoImpressao.formato?.toUpperCase() || "N/A"} | Tamanho: ${logoImpressao.tamanho ? Math.round(logoImpressao.tamanho / 1024) + " KB" : "N/A"}`
                  : "Nenhum logo configurado"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Informações da Empresa */}
        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Informações da Empresa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="empresa-nome" className="text-muted-foreground">Nome da Empresa</Label>
                <Input
                  id="empresa-nome"
                  value={config.empresa_nome || ""}
                  onChange={(e) => handleInputChange("empresa_nome", e.target.value)}
                  placeholder="Nome da sua empresa"
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="empresa-cnpj" className="text-muted-foreground">CNPJ</Label>
                <Input
                  id="empresa-cnpj"
                  value={config.empresa_cnpj || ""}
                  onChange={(e) => handleInputChange("empresa_cnpj", formatarCNPJ(e.target.value))}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                  className="bg-background border-border text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Label htmlFor="empresa-cep" className="text-muted-foreground">CEP</Label>
                <Input
                  id="empresa-cep"
                  value={config.empresa_cep || ""}
                  onChange={(e) => formatarCEP(e.target.value)}
                  placeholder="00000-000"
                  maxLength={9}
                  className={`bg-background border-border text-foreground ${loadingCep ? "pr-10" : ""}`}
                />
                {loadingCep && (
                  <div className="absolute right-3 top-9">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500"></div>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="empresa-bairro" className="text-muted-foreground">Bairro</Label>
                <Input
                  id="empresa-bairro"
                  value={config.empresa_bairro || ""}
                  onChange={(e) => handleInputChange("empresa_bairro", e.target.value)}
                  placeholder="Nome do bairro"
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="empresa-cidade" className="text-muted-foreground">Cidade</Label>
                <Input
                  id="empresa-cidade"
                  value={config.empresa_cidade || ""}
                  onChange={(e) => handleInputChange("empresa_cidade", e.target.value)}
                  placeholder="Nome da cidade"
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="empresa-uf" className="text-muted-foreground">UF</Label>
                <Select value={config.empresa_uf} onValueChange={(value) => handleInputChange("empresa_uf", value)}>
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    {estadosBrasil.map((uf) => (
                      <SelectItem key={uf} value={uf}>
                        {uf}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="empresa-endereco" className="text-muted-foreground">Endereço</Label>
              <Input
                id="empresa-endereco"
                value={config.empresa_endereco || ""}
                onChange={(e) => handleInputChange("empresa_endereco", e.target.value)}
                placeholder="Rua, número, complemento"
                className="bg-background border-border text-foreground"
              />

              {buscandoCoordenadas && (
                <div className="mt-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-md flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                  <span className="text-sm text-purple-400">Buscando coordenadas...</span>
                </div>
              )}

              {coordenadas && !buscandoCoordenadas && (
                <div className="mt-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-md">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Coordenadas Geográficas</p>
                      <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div>
                          <span className="font-medium text-foreground">Latitude:</span> {Number(coordenadas.lat).toFixed(6)}
                        </div>
                        <div>
                          <span className="font-medium text-foreground">Longitude:</span> {Number(coordenadas.lng).toFixed(6)}
                        </div>
                      </div>
                      <a
                        href={`https://www.google.com/maps?q=${Number(coordenadas.lat)},${Number(coordenadas.lng)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-purple-400 hover:text-purple-300 underline mt-1 inline-block"
                      >
                        Ver no Google Maps →
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="empresa-telefone" className="text-muted-foreground">Telefone</Label>
                <PhoneInput
                  id="empresa-telefone"
                  value={config.empresa_telefone || ""}
                  onChange={(value) => handleInputChange("empresa_telefone", value)}
                  placeholder="(11) 99999-9999"
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="empresa-email" className="text-muted-foreground">E-mail</Label>
                <Input
                  id="empresa-email"
                  type="email"
                  value={config.empresa_email || ""}
                  onChange={(e) => handleInputChange("empresa_email", e.target.value)}
                  placeholder="contato@empresa.com"
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="empresa-site" className="text-muted-foreground">Site</Label>
                <Input
                  id="empresa-site"
                  value={config.empresa_site || ""}
                  onChange={(e) => handleInputChange("empresa_site", e.target.value)}
                  placeholder="www.empresa.com"
                  className="bg-background border-border text-foreground"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações do Representante Legal */}
        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Representante Legal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="representante-legal" className="text-muted-foreground">Nome do Representante</Label>
                <Input
                  id="representante-legal"
                  value={config.empresa_representante_legal || ""}
                  onChange={(e) => handleInputChange("empresa_representante_legal", e.target.value)}
                  placeholder="Nome completo do representante"
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="representante-nacionalidade" className="text-muted-foreground">Nacionalidade</Label>
                <Input
                  id="representante-nacionalidade"
                  value={config.representante_nacionalidade || ""}
                  onChange={(e) => handleInputChange("representante_nacionalidade", e.target.value)}
                  placeholder="Brasileiro(a)"
                  className="bg-background border-border text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="representante-estado-civil" className="text-muted-foreground">Estado Civil</Label>
                <Select
                  value={config.representante_estado_civil}
                  onValueChange={(value) => handleInputChange("representante_estado_civil", value)}
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    {estadosCivis.map((estado) => (
                      <SelectItem key={estado} value={estado}>
                        {estado}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="representante-rg" className="text-muted-foreground">RG</Label>
                <Input
                  id="representante-rg"
                  value={config.representante_rg || ""}
                  onChange={(e) => handleInputChange("representante_rg", formatarRG(e.target.value))}
                  placeholder="00.000.000-0"
                  maxLength={12}
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="representante-cpf" className="text-muted-foreground">CPF</Label>
                <Input
                  id="representante-cpf"
                  value={config.representante_cpf || ""}
                  onChange={(e) => handleInputChange("representante_cpf", formatarCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className="bg-background border-border text-foreground"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Página */}
        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Configurações de Página</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tamanho-papel" className="text-muted-foreground">Tamanho do Papel</Label>
                <Select
                  value={config.tamanho_papel}
                  onValueChange={(value) => handleInputChange("tamanho_papel", value)}
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    <SelectItem value="A4">A4 (210 x 297 mm)</SelectItem>
                    <SelectItem value="A3">A3 (297 x 420 mm)</SelectItem>
                    <SelectItem value="Letter">Letter (216 x 279 mm)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="orientacao" className="text-muted-foreground">Orientação</Label>
                <Select value={config.orientacao} onValueChange={(value) => handleInputChange("orientacao", value)}>
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    <SelectItem value="retrato">Retrato</SelectItem>
                    <SelectItem value="paisagem">Paisagem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Margens */}
        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Margens (em mm)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="margem-superior" className="text-muted-foreground">Superior</Label>
                <Input
                  id="margem-superior"
                  type="number"
                  value={config.margem_superior}
                  onChange={(e) => handleInputChange("margem_superior", Number(e.target.value))}
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="margem-inferior" className="text-muted-foreground">Inferior</Label>
                <Input
                  id="margem-inferior"
                  type="number"
                  value={config.margem_inferior}
                  onChange={(e) => handleInputChange("margem_inferior", Number(e.target.value))}
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="margem-esquerda" className="text-muted-foreground">Esquerda</Label>
                <Input
                  id="margem-esquerda"
                  type="number"
                  value={config.margem_esquerda}
                  onChange={(e) => handleInputChange("margem_esquerda", Number(e.target.value))}
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="margem-direita" className="text-muted-foreground">Direita</Label>
                <Input
                  id="margem-direita"
                  type="number"
                  value={config.margem_direita}
                  onChange={(e) => handleInputChange("margem_direita", Number(e.target.value))}
                  className="bg-background border-border text-foreground"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cabeçalho e Rodapé */}
        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Cabeçalho e Rodapé</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="cabecalho" className="text-muted-foreground">Texto do Cabeçalho</Label>
              <Textarea
                id="cabecalho"
                placeholder="Antenas Coletivas, Automatizadores de Portões de Veículos, Fechaduras elétricas e Eletrônica, CFTV e Alarmes, Controle de acesso, Bombas e Recondicionamento total de emergência e sensores."
                value={config.cabecalho || ""}
                onChange={(e) => handleInputChange("cabecalho", e.target.value)}
                rows={3}
                className="bg-background border-border text-foreground"
              />
            </div>
            <div>
              <Label htmlFor="rodape" className="text-muted-foreground">Texto do Rodapé</Label>
              <Textarea
                id="rodape"
                placeholder="Rua José Roberto Farte, 719 - WhatsApp 4 118 9814 - 18 Brotas - São Paulo/SP"
                value={config.rodape || ""}
                onChange={(e) => handleInputChange("rodape", e.target.value)}
                rows={2}
                className="bg-background border-border text-foreground"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSalvar} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {saving ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
      </div>

      {/* Papel Timbrado Preview Drawer */}
      <Sheet open={showPreview} onOpenChange={setShowPreview}>
        <SheetContent
          className="w-full sm:max-w-4xl h-full flex flex-col p-0 gap-0 overflow-hidden border-l border-border shadow-2xl bg-card text-foreground animate-in slide-in-from-right duration-300"
        >
          <SheetHeader className="px-6 py-4 border-b bg-gradient-to-r from-slate-900 to-zinc-950 text-white flex-shrink-0">
            <SheetTitle className="text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-purple-500" />
                {previewMode === "imprimir" ? "Imprimir Papel Timbrado" : "Visualizar Papel Timbrado"}
              </span>
              {previewMode === "imprimir" && pdfUrl && (
                <div className="flex gap-2 mr-6">
                  <Button
                    size="sm"
                    onClick={() => window.open(pdfUrl, "_blank")}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir em Nova Aba
                  </Button>
                </div>
              )}
            </SheetTitle>
          </SheetHeader>

          {previewMode === "imprimir" && (generatingPdf || !pdfUrl) ? (
            <div className="flex items-center justify-center flex-1">
              <div className="text-center">
                <Loader2 className="animate-spin rounded-full h-8 w-8 text-blue-600 mx-auto mb-4"></Loader2>
                <p className="text-muted-foreground">Gerando visualização em PDF...</p>
              </div>
            </div>
          ) : previewMode === "imprimir" && pdfUrl ? (
            <div className="flex-1 bg-white">
              <iframe src={pdfUrl} className="w-full h-full border-0" title="PDF Preview" />
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 bg-white overflow-hidden">
              <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-gray-100">
                <div
                  className="bg-white shadow-2xl text-black flex flex-col"
                  style={{
                    width: "210mm",
                    minHeight: "297mm",
                    paddingTop: `${config.margem_superior}mm`,
                    paddingBottom: `${config.margem_inferior}mm`,
                    paddingLeft: `${config.margem_esquerda}mm`,
                    paddingRight: `${config.margem_direita}mm`,
                  }}
                >
                  <div className="text-center border-b-2 border-black pb-4 mb-4 flex-shrink-0">
                    {logoImpressao?.dados && (
                      <div className="mb-3">
                        <img
                          src={logoImpressao.dados}
                          alt="Logo da empresa"
                          className="mx-auto max-h-16 object-contain"
                        />
                      </div>
                    )}
                    {config.cabecalho && (
                      <div className="text-xs text-gray-700 leading-relaxed font-medium">
                        {config.cabecalho}
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    {/* Área de conteúdo em branco */}
                  </div>

                  {config.rodape && (
                    <div className="border-t-2 border-black pt-4 mt-4 flex-shrink-0 text-center">
                      <div className="text-[10px] font-bold text-gray-800 leading-normal">
                        {config.rodape}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Hidden Papel Timbrado rendering div */}
      {showPreview && previewMode === "imprimir" && !pdfUrl && (
        <div style={{ position: "absolute", left: "-9999px", top: "-9999px", width: "800px" }}>
          <div
            ref={hiddenPreviewRef}
            className="bg-white text-black flex flex-col"
            style={{
              width: "210mm",
              minHeight: "297mm",
              paddingTop: `${config.margem_superior}mm`,
              paddingBottom: `${config.margem_inferior}mm`,
              paddingLeft: `${config.margem_esquerda}mm`,
              paddingRight: `${config.margem_direita}mm`,
            }}
          >
            <div className="text-center border-b-2 border-black pb-4 mb-4 flex-shrink-0">
              {logoImpressao?.dados && (
                <div className="mb-3">
                  <img
                    src={logoImpressao.dados}
                    alt="Logo da empresa"
                    className="mx-auto max-h-16 object-contain"
                  />
                </div>
              )}
              {config.cabecalho && (
                <div className="text-xs text-gray-700 leading-relaxed font-medium">
                  {config.cabecalho}
                </div>
              )}
            </div>

            <div className="flex-1"></div>

            {config.rodape && (
              <div className="border-t-2 border-black pt-4 mt-4 flex-shrink-0 text-center">
                <div className="text-[10px] font-bold text-gray-800 leading-normal">
                  {config.rodape}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
