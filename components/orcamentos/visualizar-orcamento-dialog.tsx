"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import {
  Edit,
  User,
  Package,
  Calendar,
  MapPin,
  Printer,
  Building2,
  FileCheck,
  Package as PackageIcon,
  Shield,
  Loader2,
} from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { OrcamentoPrintEditor } from "@/components/orcamento-print-editor"
import { LaudoTecnicoPrintEditor } from "@/components/laudo-tecnico-print-editor"
import { EmitirNfseDialog } from "@/components/nfse/emitir-nfse-dialog"
import { EmitirNfeDialog } from "@/components/nfe/emitir-nfe-dialog"

interface OrcamentoItem {
  id?: string
  produto_id: string
  produto: {
    codigo: string
    descricao: string
    unidade: string
    valor_unitario: number
    valor_mao_obra: number
    ncm?: string
  }
  quantidade: number
  valor_unitario: number
  valor_mao_obra: number
  valor_total: number
  marca_nome?: string
}

interface Orcamento {
  id: string
  numero: string
  cliente_id: string
  cliente_nome: string
  cliente_codigo?: string
  cliente_cnpj?: string
  cliente_cpf?: string
  cliente_email?: string
  cliente_telefone?: string
  cliente_endereco?: string
  cliente_bairro?: string
  cliente_cep?: string
  cliente_cidade?: string
  cliente_estado?: string
  nome_adm?: string
  contato_adm?: string
  telefone_adm?: string
  email_adm?: string
  tipo_servico: string
  detalhes_servico?: string
  valor_material: number
  valor_mao_obra: number
  desconto: number
  valor_total: number
  validade: number
  observacoes?: string
  situacao: string
  data_orcamento: string
  created_at: string
  itens: any[]
  distancia_km?: number
  valor_boleto?: number
  prazo_dias?: number
  data_inicio?: string
  juros_am?: number
  imposto_servico?: number
  imposto_material?: number
  desconto_mdo_percent?: number
  desconto_mdo_valor?: number
  parcelamento_mdo?: number
  parcelamento_material?: number
  material_a_vista?: boolean
  subtotal_mdo?: number
}

interface VisualizarOrcamentoDialogProps {
  numero: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEditClick: (numero: string) => void
  onSuccess: () => void
}

export function VisualizarOrcamentoDialog({
  numero,
  open,
  onOpenChange,
  onEditClick,
  onSuccess,
}: VisualizarOrcamentoDialogProps) {
  const [orcamento, setOrcamento] = useState<Orcamento | null>(null)
  const [itens, setItens] = useState<OrcamentoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [valorPorKm, setValorPorKm] = useState(1.5)
  const [showPrintEditor, setShowPrintEditor] = useState(false)
  const [showLaudoEditor, setShowLaudoEditor] = useState(false)
  const [nfseDialogOpen, setNfseDialogOpen] = useState(false)
  const [nfeDialogOpen, setNfeDialogOpen] = useState(false)
  const [nfseEmitida, setNfseEmitida] = useState(false)
  const [nfeEmitida, setNfeEmitida] = useState(false)
  const [nfeItens, setNfeItens] = useState<any[]>([])
  const { toast } = useToast()

  useEffect(() => {
    if (open && numero) {
      loadOrcamento()
      loadValorPorKm()
      loadNotasEmitidas()
    }
  }, [open, numero])

  const loadNotasEmitidas = async () => {
    if (!numero) return
    try {
      const [nfseRes, nfeRes] = await Promise.all([
        fetch("/api/nfse").catch(() => null),
        fetch("/api/nfe").catch(() => null),
      ])

      if (nfseRes?.ok) {
        const nfseData = await nfseRes.json()
        if (nfseData.success && nfseData.data) {
          const temNfse = nfseData.data.some(
            (nf: any) =>
              nf.origem === "orcamento" &&
              String(nf.origem_numero) === String(numero) &&
              (nf.status === "emitida" || nf.status === "processando")
          )
          setNfseEmitida(temNfse)
        }
      }

      if (nfeRes?.ok) {
        const nfeData = await nfeRes.json()
        if (nfeData.success && nfeData.data) {
          const temNfe = nfeData.data.some(
            (nf: any) =>
              nf.origem === "orcamento" &&
              String(nf.origem_numero) === String(numero) &&
              (nf.status === "autorizada" || nf.status === "processando")
          )
          setNfeEmitida(temNfe)
        }
      }
    } catch (error) {
      console.error("Erro ao buscar notas emitidas:", error)
    }
  }

  const loadValorPorKm = async () => {
    try {
      const response = await fetch("/api/configuracoes/valor-km")
      const result = await response.json()
      if (result.success && result.data) {
        setValorPorKm(result.data.valor_por_km || 1.5)
      }
    } catch (error) {
      console.error("Erro ao carregar valor por km:", error)
    }
  }

  const loadOrcamento = async () => {
    if (!numero) return
    try {
      setLoading(true)
      const response = await fetch(`/api/orcamentos/${numero}`)
      const result = await response.json()

      if (result.success) {
        const data = result.data
        setOrcamento(data)

        if (data.itens && data.itens.length > 0) {
          const itensFormatados = data.itens.map((item: any) => ({
            id: item.id,
            produto_id: item.produto_id,
            produto: {
              id: item.produto_id,
              codigo: item.produto_codigo,
              descricao: item.produto_descricao,
              unidade: item.produto_unidade,
              valor_unitario: Number(item.valor_unitario),
              valor_mao_obra: Number(item.valor_mao_obra),
              ncm: item.produto_ncm,
            },
            quantidade: Number(item.quantidade),
            valor_unitario: Number(item.valor_unitario),
            valor_mao_obra: Number(item.valor_mao_obra),
            valor_total: Number(item.valor_total),
            marca_nome: item.marca_nome,
          }))
          setItens(itensFormatados)
        } else {
          setItens([])
        }
      } else {
        toast({
          title: "Erro",
          description: "Erro ao carregar orçamento",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao buscar orçamento:", error)
    } finally {
      setLoading(false)
    }
  }

  const safeNumber = (value: any): number => {
    const num = Number(value)
    return isNaN(num) ? 0 : num
  }

  const calcularCustoDeslocamento = () => {
    if (!orcamento) return 0
    const distancia = safeNumber(orcamento.distancia_km)
    const prazo = safeNumber(orcamento.prazo_dias)
    const valorKm = safeNumber(valorPorKm)
    return distancia * 2 * valorKm * prazo
  }

  const calcularValorJuros = () => {
    if (!orcamento) return 0
    const parcelamentoMdo = safeNumber(orcamento.parcelamento_mdo) ?? 1
    const parcelamentoMaterial = safeNumber(orcamento.parcelamento_material) ?? 1
    if (parcelamentoMaterial === 0) return 0
    const jurosAm = safeNumber(orcamento.juros_am)
    const valorMaterial = safeNumber(orcamento.valor_material)
    return ((parcelamentoMdo + parcelamentoMaterial - 1) * jurosAm * valorMaterial) / 100
  }

  const calcularTaxaBoletoMdo = () => {
    if (!orcamento) return 0
    const parcelamento = safeNumber(orcamento.parcelamento_mdo)
    const valorBoleto = safeNumber(orcamento.valor_boleto)
    return parcelamento * valorBoleto
  }

  const calcularTaxaBoletoMaterial = () => {
    if (!orcamento) return 0
    const parcelamento = safeNumber(orcamento.parcelamento_material)
    if (parcelamento === 0) return 0
    const valorBoleto = safeNumber(orcamento.valor_boleto)
    return parcelamento * valorBoleto
  }

  const calcularImpostoServicoValor = () => {
    if (!orcamento) return 0
    const parcelamentoMdo = safeNumber(orcamento.parcelamento_mdo)
    if (parcelamentoMdo === 0) return 0
    const valorMaoObra = safeNumber(orcamento.valor_mao_obra)
    const descontoMdoValor = safeNumber(orcamento.desconto_mdo_valor)
    const custoDeslocamento = calcularCustoDeslocamento()
    const taxaBoletoMdo = calcularTaxaBoletoMdo()
    const impostoServico = safeNumber(orcamento.imposto_servico)

    const base = valorMaoObra - descontoMdoValor + custoDeslocamento + taxaBoletoMdo
    return (base * impostoServico) / 100
  }

  const calcularImpostoMaterialValor = () => {
    if (!orcamento) return 0
    const parcelamentoMaterial = safeNumber(orcamento.parcelamento_material)
    if (parcelamentoMaterial === 0) return 0
    const valorMaterial = safeNumber(orcamento.valor_material)
    const valorJuros = calcularValorJuros()
    const taxaBoletoMaterial = calcularTaxaBoletoMaterial()
    const impostoMaterial = safeNumber(orcamento.imposto_material)

    const base = valorMaterial + valorJuros + taxaBoletoMaterial
    return (base * impostoMaterial) / 100
  }

  const calcularSubtotalMdo = () => {
    if (!orcamento) return 0
    const parcelamentoMdo = safeNumber(orcamento.parcelamento_mdo)
    if (parcelamentoMdo === 0) return 0

    const valorMaoObra = safeNumber(orcamento.valor_mao_obra)
    const descontoMdoValor = safeNumber(orcamento.desconto_mdo_valor)
    const custoDeslocamento = calcularCustoDeslocamento()
    const taxaBoletoMdo = calcularTaxaBoletoMdo()
    const impostoServicoValor = calcularImpostoServicoValor()

    return valorMaoObra - descontoMdoValor + custoDeslocamento + taxaBoletoMdo + impostoServicoValor
  }

  const calcularSubtotalMaterial = () => {
    if (!orcamento) return 0
    const parcelamentoMaterial = safeNumber(orcamento.parcelamento_material)
    if (parcelamentoMaterial === 0) return 0

    const valorMaterial = safeNumber(orcamento.valor_material)
    const valorJuros = calcularValorJuros()
    const taxaBoletoMaterial = calcularTaxaBoletoMaterial()
    const impostoMaterialValor = calcularImpostoMaterialValor()

    const parcelamentoMdo = safeNumber(orcamento.parcelamento_mdo)
    const custoDeslocamentoExtra = parcelamentoMdo === 0 ? calcularCustoDeslocamento() : 0

    return valorMaterial + valorJuros + taxaBoletoMaterial + impostoMaterialValor + custoDeslocamentoExtra
  }

  const calcularDataValidade = () => {
    if (!orcamento) return ""
    const dataOrcamentoStr = orcamento.data_orcamento.split("T")[0]
    const [year, month, day] = dataOrcamentoStr.split("-").map(Number)
    const dataOrc = new Date(year, month - 1, day)
    dataOrc.setDate(dataOrc.getDate() + 30)
    return formatDate(dataOrc.toISOString())
  }

  const getTipoServicoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      manutencao: "Manutenção",
      orcamento: "Orçamento",
      vistoria_contrato: "Vistoria Contrato",
      preventiva: "Preventiva",
      instalacao: "Instalação",
      outros: "Outros",
    }
    return tipos[tipo] || tipo
  }

  const getStatusBadge = (status: string) => {
    const config = {
      pendente: "bg-yellow-500/10 text-yellow-500 border-0",
      aprovado: "bg-emerald-500/10 text-emerald-500 border-0",
      "enviado por email": "bg-blue-500/10 text-blue-500 border-0",
      "nota fiscal emitida": "bg-purple-500/10 text-purple-500 border-0",
      concluido: "bg-emerald-500/10 text-emerald-500 border-0",
    }
    const label = {
      pendente: "Pendente",
      aprovado: "Aprovado",
      "enviado por email": "Enviado",
      "nota fiscal emitida": "NF Emitida",
      concluido: "Concluído",
    }
    return (
      <Badge className={config[status as keyof typeof config] || "bg-muted text-muted-foreground"}>
        {label[status as keyof typeof label] || status}
      </Badge>
    )
  }

  const handleNfseSuccess = async () => {
    if (!orcamento) return
    try {
      const parcelamentoMaterial = safeNumber(orcamento.parcelamento_material)
      const subtotalMaterial = calcularSubtotalMaterial()
      const precisaNfe = parcelamentoMaterial !== 0 && subtotalMaterial > 0

      if (!precisaNfe || nfeEmitida) {
        await fetch(`/api/orcamentos/${orcamento.numero}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ situacao: "concluido" }),
        })
        toast({
          title: "Sucesso",
          description: "NFS-e emitida e orçamento concluído!",
        })
      } else {
        await fetch(`/api/orcamentos/${orcamento.numero}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ situacao: "nota fiscal emitida" }),
        })
        toast({
          title: "Sucesso",
          description: "NFS-e emitida. Ainda falta emitir NF-e de material.",
        })
      }
      loadOrcamento()
      loadNotasEmitidas()
      onSuccess()
    } catch (error) {
      console.error(error)
    }
  }

  const handleNfeSuccess = async () => {
    if (!orcamento) return
    try {
      const parcelamentoMdo = safeNumber(orcamento.parcelamento_mdo)
      const subtotalMdo = calcularSubtotalMdo()
      const precisaNfse = parcelamentoMdo !== 0 && subtotalMdo > 0

      if (!precisaNfse || nfseEmitida) {
        await fetch(`/api/orcamentos/${orcamento.numero}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ situacao: "concluido" }),
        })
        toast({
          title: "Sucesso",
          description: "NF-e emitida e orçamento concluído!",
        })
      } else {
        await fetch(`/api/orcamentos/${orcamento.numero}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ situacao: "nota fiscal emitida" }),
        })
        toast({
          title: "Sucesso",
          description: "NF-e de material emitida. Ainda falta emitir NFS-e de serviço.",
        })
      }
      loadOrcamento()
      loadNotasEmitidas()
      onSuccess()
    } catch (error) {
      console.error(error)
    }
  }

  const handleEmitirNfe = async () => {
    if (!orcamento) return
    try {
      const response = await fetch(`/api/orcamentos/${orcamento.numero}`)
      const result = await response.json()

      if (result.success && result.data.itens) {
        const valorMaterialBruto = result.data.itens.reduce(
          (acc: number, item: any) => acc + safeNumber(item.quantidade) * safeNumber(item.valor_unitario),
          0
        )
        const subtotalMaterial = calcularSubtotalMaterial()
        const fatorAjuste = valorMaterialBruto > 0 ? subtotalMaterial / valorMaterialBruto : 1

        const itensFormatados = result.data.itens
          .filter((item: any) => safeNumber(item.valor_unitario) > 0)
          .map((item: any) => {
            const valorUnitarioAjustado = safeNumber(item.valor_unitario) * fatorAjuste
            return {
              produto_id: Number(item.produto_id),
              codigo_produto: item.produto_codigo || "",
              descricao: item.produto_descricao || "",
              ncm: item.produto_ncm || "00000000",
              unidade: item.produto_unidade || "UN",
              quantidade: safeNumber(item.quantidade),
              valor_unitario: valorUnitarioAjustado,
              valor_total: safeNumber(item.quantidade) * valorUnitarioAjustado,
            }
          })

        setNfeItens(itensFormatados)
        setNfeDialogOpen(true)
      }
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl h-full flex flex-col p-6 overflow-y-auto border-l border-border shadow-2xl bg-card text-foreground">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Detalhes do Orçamento
          </SheetTitle>
          <SheetDescription>Visualize e gerencie as informações do orçamento no sistema.</SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="text-xs text-muted-foreground mt-2">Carregando detalhes do orçamento...</p>
          </div>
        ) : !orcamento ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <p className="text-muted-foreground text-sm">Orçamento não encontrado.</p>
          </div>
        ) : (
          <div className="flex-1 space-y-6 pt-2">
            {/* Header com ações */}
            <div className="flex items-center justify-between flex-wrap gap-3 p-4 bg-muted/30 border border-border rounded-lg">
              <div>
                <h3 className="font-bold text-sm text-foreground">Orçamento #{orcamento.numero}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{getTipoServicoLabel(orcamento.tipo_servico)}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs font-semibold"
                  onClick={() => {
                    onOpenChange(false)
                    onEditClick(orcamento.numero)
                  }}
                >
                  <Edit className="h-3.5 w-3.5 mr-1" /> Editar
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setShowPrintEditor(true)}>
                  <Printer className="h-3.5 w-3.5 mr-1" /> Imprimir
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setShowLaudoEditor(true)}>
                  <Shield className="h-3.5 w-3.5 mr-1" /> Laudo
                </Button>
              </div>
            </div>

            {/* Status e Datas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border border-border rounded-lg bg-card">
              <div>
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Situação</span>
                <div className="mt-1">{getStatusBadge(orcamento.situacao)}</div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Data</span>
                <span className="text-xs font-medium text-foreground block mt-1">
                  {formatDate(orcamento.data_orcamento)}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Validade</span>
                <span className="text-xs font-medium text-foreground block mt-1">{calcularDataValidade()}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Início Previsto</span>
                <span className="text-xs font-medium text-foreground block mt-1">
                  {orcamento.data_inicio ? formatDate(orcamento.data_inicio) : "Não definida"}
                </span>
              </div>
            </div>

            {/* Dados do Cliente */}
            <Card className="border border-border bg-card">
              <CardHeader className="p-4 border-b border-border/40">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <User className="h-4 w-4" /> Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  {orcamento.cliente_codigo && <Badge variant="outline">{orcamento.cliente_codigo}</Badge>}
                  <span className="font-semibold text-foreground">{orcamento.cliente_nome}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-muted-foreground">
                  {orcamento.cliente_cnpj && (
                    <div>
                      <strong>CNPJ:</strong> {orcamento.cliente_cnpj}
                    </div>
                  )}
                  {orcamento.cliente_cpf && (
                    <div>
                      <strong>CPF:</strong> {orcamento.cliente_cpf}
                    </div>
                  )}
                  {orcamento.cliente_email && (
                    <div>
                      <strong>Email:</strong> {orcamento.cliente_email}
                    </div>
                  )}
                  {orcamento.cliente_telefone && (
                    <div>
                      <strong>Telefone:</strong> {orcamento.cliente_telefone}
                    </div>
                  )}
                  {orcamento.cliente_endereco && (
                    <div className="col-span-1 md:col-span-2">
                      <strong>Endereço:</strong> {orcamento.cliente_endereco}
                      {orcamento.cliente_bairro && `, ${orcamento.cliente_bairro}`}
                      {orcamento.cliente_cidade && `, ${orcamento.cliente_cidade} - ${orcamento.cliente_estado}`}
                    </div>
                  )}
                </div>

                {orcamento.nome_adm && (
                  <div className="pt-2 border-t border-border mt-2 space-y-1">
                    <span className="font-semibold text-foreground flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" /> Administradora
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-muted-foreground">
                      <div>
                        <strong>Nome:</strong> {orcamento.nome_adm}
                      </div>
                      {orcamento.contato_adm && (
                        <div>
                          <strong>Contato:</strong> {orcamento.contato_adm}
                        </div>
                      )}
                      {orcamento.telefone_adm && (
                        <div>
                          <strong>Telefone:</strong> {orcamento.telefone_adm}
                        </div>
                      )}
                      {orcamento.email_adm && (
                        <div>
                          <strong>Email:</strong> {orcamento.email_adm}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabela de Itens */}
            <Card className="border border-border bg-card">
              <CardHeader className="p-4 border-b border-border/40">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Package className="h-4 w-4" /> Itens do Orçamento
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-xs">Cód</TableHead>
                      <TableHead className="text-xs">Descrição</TableHead>
                      <TableHead className="text-right text-xs">Qtd</TableHead>
                      <TableHead className="text-right text-xs">Preço</TableHead>
                      <TableHead className="text-right text-xs">M.Obra</TableHead>
                      <TableHead className="text-right text-xs font-semibold">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itens.map((item, idx) => (
                      <TableRow key={idx} className="border-border text-xs">
                        <TableCell className="font-mono text-[10px] text-muted-foreground">
                          {item.produto.codigo}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {item.produto.descricao}
                          {item.marca_nome && <span className="text-[10px] text-muted-foreground block">{item.marca_nome}</span>}
                        </TableCell>
                        <TableCell className="text-right">{item.quantidade}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.valor_unitario)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.valor_mao_obra)}</TableCell>
                        <TableCell className="text-right font-semibold text-foreground">
                          {formatCurrency(item.valor_total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Resumo de Valores */}
            <Card className="border border-border bg-card">
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Material Bruto</span>
                  <span className="font-semibold text-foreground">{formatCurrency(orcamento.valor_material)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mão de Obra Bruta</span>
                  <span className="font-semibold text-foreground">{formatCurrency(orcamento.valor_mao_obra)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Custo Deslocamento ({orcamento.distancia_km}km)</span>
                  <span className="font-semibold text-foreground">{formatCurrency(calcularCustoDeslocamento())}</span>
                </div>
                {safeNumber(orcamento.juros_am) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Juros de Financiamento ({orcamento.juros_am}%)</span>
                    <span className="font-semibold text-foreground">{formatCurrency(calcularValorJuros())}</span>
                  </div>
                )}
                {calcularImpostoServicoValor() > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Imposto sobre Serviço ({orcamento.imposto_servico}%)</span>
                    <span className="font-semibold text-foreground">{formatCurrency(calcularImpostoServicoValor())}</span>
                  </div>
                )}
                {calcularImpostoMaterialValor() > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Imposto sobre Material ({orcamento.imposto_material}%)</span>
                    <span className="font-semibold text-foreground">{formatCurrency(calcularImpostoMaterialValor())}</span>
                  </div>
                )}
                <Separator className="bg-border" />
                <div className="flex justify-between font-bold text-sm">
                  <span className="text-foreground">Total Líquido</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(orcamento.valor_total)}</span>
                </div>
              </CardContent>
            </Card>

            {/* NF-e / NFS-e Ações */}
            {(orcamento.situacao === "aprovado" || orcamento.situacao === "nota fiscal emitida") && (
              <div className="p-4 border border-indigo-200/50 dark:border-indigo-900/50 bg-indigo-500/5 rounded-lg flex flex-col gap-3">
                <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                  Faturamento e Notas Fiscais
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!orcamento.parcelamento_mdo || nfseEmitida}
                    onClick={() => setNfseDialogOpen(true)}
                    className="flex-1 bg-white dark:bg-background border-indigo-200 dark:border-indigo-900"
                  >
                    <FileCheck className="h-3.5 w-3.5 mr-1" />
                    {nfseEmitida ? "NFS-e Emitida" : "Emitir NFS-e"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!orcamento.parcelamento_material || nfeEmitida}
                    onClick={handleEmitirNfe}
                    className="flex-1 bg-white dark:bg-background border-indigo-200 dark:border-indigo-900"
                  >
                    <PackageIcon className="h-3.5 w-3.5 mr-1" />
                    {nfeEmitida ? "NF-e Emitida" : "Emitir NF-e"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </SheetContent>

      {/* Impressão modal */}
      {showPrintEditor && orcamento && (
        <OrcamentoPrintEditor
          open={showPrintEditor}
          onOpenChange={setShowPrintEditor}
          orcamento={orcamento}
          itens={itens}
        />
      )}

      {/* Laudo modal */}
      {showLaudoEditor && orcamento && (
        <LaudoTecnicoPrintEditor
          open={showLaudoEditor}
          onOpenChange={setShowLaudoEditor}
          orcamento={orcamento}
          itens={itens}
        />
      )}

      {/* NFS-e modal */}
      {nfseDialogOpen && orcamento && (
        <EmitirNfseDialog
          open={nfseDialogOpen}
          onOpenChange={setNfseDialogOpen}
          onSuccess={handleNfseSuccess}
          dadosOrigem={{
            origem: "orcamento",
            origem_numero: orcamento.numero,
            cliente_id: Number(orcamento.cliente_id),
            cliente_nome: orcamento.cliente_nome,
            cliente_cnpj: orcamento.cliente_cnpj,
            cliente_cpf: orcamento.cliente_cpf,
            cliente_email: orcamento.cliente_email,
            cliente_telefone: orcamento.cliente_telefone,
            cliente_endereco: orcamento.cliente_endereco,
            cliente_bairro: orcamento.cliente_bairro,
            cliente_cidade: orcamento.cliente_cidade,
            cliente_uf: orcamento.cliente_estado,
            cliente_cep: orcamento.cliente_cep,
            descricao: orcamento.detalhes_servico || "",
            valor: calcularSubtotalMdo(),
            valor_material: safeNumber(orcamento.valor_material),
            valor_total_orcamento: safeNumber(orcamento.valor_total),
          }}
        />
      )}

      {/* NF-e modal */}
      {nfeDialogOpen && orcamento && (
        <EmitirNfeDialog
          open={nfeDialogOpen}
          onOpenChange={setNfeDialogOpen}
          onSuccess={handleNfeSuccess}
          dadosOrigem={{
            origem: "orcamento",
            origem_numero: orcamento.numero,
            cliente_id: Number(orcamento.cliente_id),
            cliente_nome: orcamento.cliente_nome,
            cliente_cnpj: orcamento.cliente_cnpj,
            cliente_cpf: orcamento.cliente_cpf,
            cliente_email: orcamento.cliente_email,
            cliente_telefone: orcamento.cliente_telefone,
            cliente_endereco: orcamento.cliente_endereco,
            cliente_numero: "",
            cliente_complemento: "",
            cliente_bairro: orcamento.cliente_bairro,
            cliente_cidade: orcamento.cliente_cidade,
            cliente_uf: orcamento.cliente_estado,
            cliente_cep: orcamento.cliente_cep,
            itens: nfeItens,
            valor_material: calcularSubtotalMaterial(),
          }}
        />
      )}
    </Sheet>
  )
}
