"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import {
  Calendar,
  Clock,
  User,
  MapPin,
  Phone,
  Mail,
  FileText,
  Wrench,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlayCircle,
  Edit,
  Printer,
  Camera,
  PenTool,
  UserCheck,
  Loader2,
} from "lucide-react"
import { OrdemServicoPrint } from "@/components/ordem-servico-print"
import { formatCurrency } from "@/lib/utils"

interface Cliente {
  id: number
  nome: string
  codigo?: string
  cnpj?: string
  cpf?: string
  email?: string
  telefone?: string
  endereco?: string
  bairro?: string
  cidade?: string
  estado?: string
  cep?: string
  distancia_km?: number
}

interface OrdemServicoItem {
  id: number
  equipamento_id?: number
  equipamento_nome: string
  equipamento_nome_atual?: string
  categoria?: string
  valor_hora?: number
  quantidade: number
  observacoes?: string
  situacao: string
  created_at: string
  updated_at: string
}

interface OrdemServicoFoto {
  id: number
  nome_arquivo: string
  caminho: string
  caminho_arquivo?: string
  descricao?: string
  data_upload?: string
  created_at?: string
}

interface OrdemServicoAssinatura {
  id: number
  tipo: "cliente" | "tecnico" | "responsavel"
  tipo_assinatura?: "cliente" | "tecnico" | "responsavel"
  nome: string
  nome_assinante?: string
  caminho: string
  caminho_arquivo?: string
  assinatura_base64?: string
  data_assinatura: string
}

interface VisualizarOSDialogProps {
  id: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEditClick: (id: string) => void
  onSuccess: () => void
}

export function VisualizarOSDialog({
  id,
  open,
  onOpenChange,
  onEditClick,
  onSuccess,
}: VisualizarOSDialogProps) {
  const [loading, setLoading] = useState(true)
  const [ordemServico, setOrdemServico] = useState<any>(null)
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [itens, setItens] = useState<OrdemServicoItem[]>([])
  const [fotos, setFotos] = useState<OrdemServicoFoto[]>([])
  const [assinaturas, setAssinaturas] = useState<OrdemServicoAssinatura[]>([])
  const [showPrintModal, setShowPrintModal] = useState(false)

  useEffect(() => {
    if (open && id) {
      carregarDados()
    }
  }, [open, id])

  const carregarDados = async () => {
    if (!id) return
    try {
      setLoading(true)

      // Carregar ordem de serviço
      const osResponse = await fetch(`/api/ordens-servico/${id}`)
      const osData = await osResponse.json()

      if (osData.success) {
        setOrdemServico(osData.data)

        if (osData.data.cliente_id) {
          const clienteResponse = await fetch(`/api/clientes/${osData.data.cliente_id}`)
          const clienteData = await clienteResponse.json()
          if (clienteData.success) {
            setCliente(clienteData.data)
          }
        }
      }

      // Carregar itens
      const itensResponse = await fetch(`/api/ordens-servico/${id}/itens`)
      const itensData = await itensResponse.json()
      if (itensData.success) {
        setItens(itensData.data)
      }

      // Carregar fotos
      const fotosResponse = await fetch(`/api/ordens-servico/${id}/fotos`)
      const fotosData = await fotosResponse.json()
      if (fotosData.success) {
        setFotos(fotosData.data)
      }

      // Carregar assinaturas
      const assinaturasResponse = await fetch(`/api/ordens-servico/${id}/assinaturas`)
      const assinaturasData = await assinaturasResponse.json()
      if (assinaturasData.success) {
        setAssinaturas(assinaturasData.data)
      }
    } catch (error) {
      console.error("Erro ao carregar dados da OS:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (situacao: string) => {
    switch (situacao) {
      case "rascunho":
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">
            <AlertCircle className="w-3 h-3 mr-1" /> Rascunho
          </Badge>
        )
      case "aberta":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
            <Clock className="w-3 h-3 mr-1" /> Aberta
          </Badge>
        )
      case "agendada":
        return (
          <Badge className="bg-cyan-100 text-cyan-800 hover:bg-cyan-200">
            <Calendar className="w-3 h-3 mr-1" /> Agendada
          </Badge>
        )
      case "em_andamento":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
            <PlayCircle className="w-3 h-3 mr-1" /> Em Andamento
          </Badge>
        )
      case "concluida":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
            <CheckCircle className="w-3 h-3 mr-1" /> Concluída
          </Badge>
        )
      case "cancelada":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
            <XCircle className="w-3 h-3 mr-1" /> Cancelada
          </Badge>
        )
      default:
        return <Badge variant="secondary">Indefinido</Badge>
    }
  }

  const getTipoServicoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      manutencao: "Manutenção",
      orcamento: "Orçamento",
      vistoria_contrato: "Vistoria Contrato",
      preventiva: "Preventiva",
    }
    return tipos[tipo] || tipo
  }

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return "-"
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "-"
      return date.toLocaleString("pt-BR")
    } catch {
      return "-"
    }
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Não informada"
    try {
      const dateOnly = dateString.split("T")[0]
      const [year, month, day] = dateOnly.split("-")
      const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
      if (isNaN(date.getTime())) return "Data inválida"
      return date.toLocaleDateString("pt-BR")
    } catch {
      return "Data inválida"
    }
  }

  const getClienteNome = () => {
    return cliente?.nome || ordemServico?.cliente?.nome || ordemServico?.cliente_nome || "Cliente não informado"
  }

  const getClienteTelefone = () => {
    return cliente?.telefone || ordemServico?.cliente?.telefone || ordemServico?.cliente_telefone || null
  }

  const getClienteEmail = () => {
    return cliente?.email || ordemServico?.cliente?.email || ordemServico?.cliente_email || null
  }

  const getClienteEndereco = () => {
    return cliente?.endereco || ordemServico?.cliente?.endereco || ordemServico?.cliente_endereco || null
  }

  const getClienteBairro = () => {
    return cliente?.bairro || ordemServico?.cliente?.bairro || null
  }

  const getClienteCidade = () => {
    return cliente?.cidade || ordemServico?.cliente?.cidade || ordemServico?.cliente_cidade || null
  }

  const getClienteEstado = () => {
    return cliente?.estado || ordemServico?.cliente?.estado || ordemServico?.cliente_estado || null
  }

  const getClienteCep = () => {
    return cliente?.cep || ordemServico?.cliente?.cep || null
  }

  const getEnderecoCompleto = () => {
    const endereco = getClienteEndereco()
    const bairro = getClienteBairro()
    const cidade = getClienteCidade()
    const estado = getClienteEstado()
    const cep = getClienteCep()

    if (!endereco) return null
    let res = endereco
    if (bairro) res += `, ${bairro}`
    if (cidade || estado) res += ` - ${cidade || ""}${estado ? `/${estado}` : ""}`
    if (cep) res += ` - CEP: ${cep}`
    return res
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl h-full flex flex-col p-6 overflow-y-auto border-l border-border shadow-2xl bg-card text-foreground">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-orange-600" />
            Visualizar Ordem de Serviço
          </SheetTitle>
          <SheetDescription>Detalhes e status da Ordem de Serviço executada.</SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            <p className="text-xs text-muted-foreground mt-2">Carregando dados da OS...</p>
          </div>
        ) : !ordemServico ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <p className="text-muted-foreground text-sm">Ordem de Serviço não encontrada.</p>
          </div>
        ) : (
          <div className="flex-1 space-y-6 pt-2">
            {/* Header com ações */}
            <div className="flex items-center justify-between flex-wrap gap-3 p-4 bg-muted/30 border border-border rounded-lg">
              <div>
                <h3 className="font-bold text-sm text-foreground">OS #{ordemServico.numero}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{getTipoServicoLabel(ordemServico.tipo_servico)}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600 text-white h-8 text-xs font-semibold"
                  onClick={() => {
                    onOpenChange(false)
                    onEditClick(ordemServico.id.toString())
                  }}
                >
                  <Edit className="h-3.5 w-3.5 mr-1" /> Editar
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs bg-transparent" onClick={() => setShowPrintModal(true)}>
                  <Printer className="h-3.5 w-3.5 mr-1" /> Imprimir
                </Button>
              </div>
            </div>

            {/* Status e Datas */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 border border-border rounded-lg bg-card">
              <div>
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Situação</span>
                <div className="mt-1">{getStatusBadge(ordemServico.situacao)}</div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Data Criação</span>
                <span className="text-xs font-medium text-foreground block mt-1">
                  {ordemServico.data_atual ? formatDate(ordemServico.data_atual) : "Não informada"}
                </span>
              </div>
              {ordemServico.data_agendamento && (
                <div>
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Agendamento</span>
                  <span className="text-xs font-medium text-foreground block mt-1">
                    {formatDate(ordemServico.data_agendamento)}
                    {ordemServico.periodo_agendamento && ` (${ordemServico.periodo_agendamento === "manha" ? "Manhã" : "Tarde"})`}
                  </span>
                </div>
              )}
            </div>

            {/* Dados do Cliente */}
            <Card className="border border-border bg-card">
              <CardHeader className="p-4 border-b border-border/40">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <User className="h-4 w-4" /> Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2 text-xs">
                <div className="font-semibold text-foreground">{getClienteNome()}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-muted-foreground">
                  {getClienteTelefone() && (
                    <div>
                      <strong>Telefone:</strong> {getClienteTelefone()}
                    </div>
                  )}
                  {getClienteEmail() && (
                    <div>
                      <strong>Email:</strong> {getClienteEmail()}
                    </div>
                  )}
                  {getEnderecoCompleto() && (
                    <div className="col-span-1 md:col-span-2">
                      <strong>Endereço:</strong> {getEnderecoCompleto()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Descrições e Relatórios */}
            <div className="space-y-4">
              {ordemServico.descricao_defeito && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Defeito Reclamado</span>
                  <p className="text-xs text-foreground bg-muted/40 p-3 rounded-lg border border-border/60 whitespace-pre-wrap">
                    {ordemServico.descricao_defeito}
                  </p>
                </div>
              )}
              {ordemServico.servico_realizado && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Serviço Realizado</span>
                  <p className="text-xs text-foreground bg-muted/40 p-3 rounded-lg border border-border/60 whitespace-pre-wrap">
                    {ordemServico.servico_realizado}
                  </p>
                </div>
              )}
              {ordemServico.observacoes && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Observações</span>
                  <p className="text-xs text-foreground bg-muted/40 p-3 rounded-lg border border-border/60 whitespace-pre-wrap">
                    {ordemServico.observacoes}
                  </p>
                </div>
              )}
            </div>

            {/* Equipamentos */}
            {itens.length > 0 && (
              <Card className="border border-border bg-card">
                <CardHeader className="p-4 border-b border-border/40">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Wrench className="h-4 w-4" /> Equipamentos
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableBody>
                      {itens.map((item) => (
                        <TableRow key={item.id} className="border-border text-xs">
                          <TableCell className="font-medium text-foreground">
                            {item.equipamento_nome_atual || item.equipamento_nome}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Fotos */}
            {fotos.length > 0 && (
              <Card className="border border-border bg-card">
                <CardHeader className="p-4 border-b border-border/40">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Camera className="h-4 w-4" /> Fotos da Visita
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {fotos.map((foto) => (
                      <div key={foto.id} className="space-y-1">
                        <div className="aspect-square bg-muted rounded-lg overflow-hidden border border-border">
                          <img
                            src={foto.caminho || foto.caminho_arquivo || "/placeholder.svg"}
                            alt={foto.nome_arquivo}
                            className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                            onClick={() => window.open(foto.caminho || foto.caminho_arquivo, "_blank")}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Assinaturas */}
            {assinaturas.length > 0 && (
              <Card className="border border-border bg-card">
                <CardHeader className="p-4 border-b border-border/40">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <PenTool className="h-4 w-4" /> Assinaturas Coletadas
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    {assinaturas.map((assinatura) => (
                      <div key={assinatura.id} className="space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <Badge variant={(assinatura.tipo || assinatura.tipo_assinatura) === "tecnico" ? "secondary" : "default"}>
                            {(assinatura.tipo || assinatura.tipo_assinatura) === "tecnico" ? "Técnico" : "Responsável"}
                          </Badge>
                          <span className="font-medium text-foreground">{assinatura.nome || assinatura.nome_assinante}</span>
                        </div>
                        <div className="border border-border rounded-lg p-2 bg-white dark:bg-muted/40 h-24 flex items-center justify-center">
                          <img
                            src={assinatura.caminho || assinatura.caminho_arquivo || assinatura.assinatura_base64 || "/placeholder.svg"}
                            alt="Assinatura"
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </SheetContent>

      {/* Modal de Impressão */}
      {showPrintModal && ordemServico && (
        <OrdemServicoPrint
          ordemServico={ordemServico}
          itens={itens}
          fotos={fotos}
          assinaturas={assinaturas}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </Sheet>
  )
}
