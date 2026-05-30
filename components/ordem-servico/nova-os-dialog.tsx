"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Wrench,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Shield,
  DollarSign,
  Plus,
  Trash2,
  Package,
  FileText,
  User,
} from "lucide-react"
import { ClienteCombobox, type Cliente } from "@/components/cliente-combobox"
import { EquipamentoCombobox } from "@/components/equipamento-combobox"
import { useToast } from "@/hooks/use-toast"
import { ClienteFormDialog } from "@/components/cliente-form-dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"

interface Equipamento {
  id: number
  nome: string
  descricao?: string
  categoria?: string
  valor_hora?: number
  ativo: boolean
}

interface EquipamentoContrato {
  id: string | number
  nome: string
  descricao?: string
  categoria?: string
  valor_hora?: number
  observacoes?: string
  do_contrato?: boolean
}

interface ContratoConservacao {
  numero: string
  id: number
  data_inicio: string
  data_fim: string
  status: string
  cliente_id: number
  valor_mensal?: number
  observacoes?: string
  equipamentos_inclusos?: string
  equipamentos_inclusos_parsed?: EquipamentoContrato[]
  frequencia?: string
  quantidade_visitas?: number
  prazo_meses?: number
}

interface EquipamentoSelecionado extends Equipamento {
  observacoes: string
  do_contrato?: boolean
}

interface NovaOSDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function NovaOSDialog({ open, onOpenChange, onSuccess }: NovaOSDialogProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [loadingContrato, setLoadingContrato] = useState(false)
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [contratoConservacao, setContratoConservacao] = useState<ContratoConservacao | null>(null)
  const [equipamentosSelecionados, setEquipamentosSelecionados] = useState<EquipamentoSelecionado[]>([])
  const [numeroOS, setNumeroOS] = useState("")
  const [showNovoClienteDialog, setShowNovoClienteDialog] = useState(false)
  const [desejaAgendar, setDesejaAgendar] = useState(false)

  const [formData, setFormData] = useState({
    tipo_servico: "manutencao",
    data_atual: new Date().toISOString().split("T")[0],
    solicitado_por: "",
    descricao_defeito: "",
    contrato_numero: "Cliente sem contrato",
    data_agendamento: "",
    periodo_agendamento: "" as "" | "manha" | "tarde" | "integral",
  })

  // Reset form when opening/closing
  useEffect(() => {
    if (open) {
      setClienteSelecionado(null)
      setContratoConservacao(null)
      setEquipamentosSelecionados([])
      setNumeroOS("")
      setDesejaAgendar(false)
      setFormData({
        tipo_servico: "manutencao",
        data_atual: new Date().toISOString().split("T")[0],
        solicitado_por: "",
        descricao_defeito: "",
        contrato_numero: "Cliente sem contrato",
        data_agendamento: "",
        periodo_agendamento: "",
      })
    }
  }, [open])

  // Gerar número da OS quando cliente for selecionado
  useEffect(() => {
    if (clienteSelecionado) {
      gerarNumeroOS()
    }
  }, [clienteSelecionado, formData.data_atual])

  // Preencher "Solicitado Por" automaticamente quando for preventiva
  useEffect(() => {
    if (formData.tipo_servico === "preventiva") {
      setFormData((prev) => ({
        ...prev,
        solicitado_por: "Contrato de Manutenção",
      }))
    }
  }, [formData.tipo_servico])

  // Carregar equipamentos do contrato apenas para preventiva
  useEffect(() => {
    if (contratoConservacao && formData.tipo_servico === "preventiva") {
      if (
        contratoConservacao.equipamentos_inclusos_parsed &&
        contratoConservacao.equipamentos_inclusos_parsed.length > 0
      ) {
        const equipamentosDoContrato = contratoConservacao.equipamentos_inclusos_parsed.map(
          (eq: EquipamentoContrato, index: number) => ({
            id: typeof eq.id === "string" ? Number.parseInt(eq.id.replace("temp_", "")) || 1000 + index : eq.id,
            nome: eq.nome,
            descricao: eq.descricao || "",
            categoria: eq.categoria || "Contrato",
            valor_hora: eq.valor_hora || 0,
            ativo: true,
            observacoes: eq.observacoes || "Equipamento incluído no contrato de conservação",
            do_contrato: true,
          }),
        )
        setEquipamentosSelecionados(equipamentosDoContrato)
      }
    } else {
      // Limpar equipamentos do contrato se não for preventiva
      setEquipamentosSelecionados([])
    }
  }, [contratoConservacao, formData.tipo_servico])

  const gerarNumeroOS = async () => {
    if (!clienteSelecionado) return

    try {
      const dataAtual = formData.data_atual || new Date().toISOString().split("T")[0]
      const response = await fetch(
        `/api/ordens-servico/proximo-numero?cliente_id=${clienteSelecionado.id}&data=${dataAtual}`,
      )
      const result = await response.json()

      if (result.success) {
        setNumeroOS(result.numero)
      }
    } catch (error) {
      console.error("Erro ao gerar número:", error)
    }
  }

  const buscarContratoConservacao = async (clienteId: number) => {
    try {
      setLoadingContrato(true)
      const response = await fetch(`/api/contratos-conservacao/cliente/${clienteId}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.success && result.data) {
        const contrato = result.data
        setContratoConservacao(contrato)

        setFormData((prev) => ({
          ...prev,
          contrato_numero: contrato.numero,
        }))

        toast({
          title: "Contrato encontrado!",
          description: `Contrato ${contrato.numero} carregado.`,
        })
      } else {
        setContratoConservacao(null)
        setFormData((prev) => ({
          ...prev,
          contrato_numero: "Cliente sem contrato",
        }))
        setEquipamentosSelecionados([])
      }
    } catch (error) {
      setContratoConservacao(null)
      setFormData((prev) => ({
        ...prev,
        contrato_numero: "Cliente sem contrato",
      }))
      setEquipamentosSelecionados([])
    } finally {
      setLoadingContrato(false)
    }
  }

  const handleClienteChange = (cliente: Cliente | null) => {
    setClienteSelecionado(cliente)
    setContratoConservacao(null)
    setEquipamentosSelecionados([])

    if (cliente) {
      buscarContratoConservacao(cliente.id)
    } else {
      setFormData((prev) => ({
        ...prev,
        contrato_numero: "Cliente sem contrato",
        tipo_servico: "manutencao",
      }))
    }
  }

  const handleEquipamentoSelect = (equipamento: Equipamento) => {
    const jaAdicionado = equipamentosSelecionados.find((eq) => eq.id === equipamento.id)
    if (jaAdicionado) {
      toast({
        title: "Equipamento já adicionado",
        description: "Este equipamento já está na lista.",
        variant: "destructive",
      })
      return
    }

    const novoEquipamento: EquipamentoSelecionado = {
      ...equipamento,
      observacoes: "",
      do_contrato: false,
    }

    setEquipamentosSelecionados((prev) => [...prev, novoEquipamento])

    toast({
      title: "Equipamento adicionado",
      description: `${equipamento.nome} foi adicionado à ordem de serviço.`,
    })
  }

  const removerEquipamento = (equipamentoId: number) => {
    setEquipamentosSelecionados((prev) => prev.filter((eq) => eq.id !== equipamentoId))
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString("pt-BR")
  }

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor)
  }

  const getTipoServicoLabel = (tipo: string) => {
    switch (tipo) {
      case "manutencao":
        return "Manutenção"
      case "orcamento":
        return "Orçamento"
      case "vistoria_contrato":
        return "Vistoria para Contrato"
      case "preventiva":
        return "Preventiva"
      default:
        return tipo
    }
  }

  const handleSubmit = async () => {
    if (!clienteSelecionado) {
      toast({
        title: "Cliente obrigatório",
        description: "Selecione um cliente para continuar.",
        variant: "destructive",
      })
      return
    }

    if (
      !formData.tipo_servico ||
      !formData.data_atual ||
      !formData.solicitado_por ||
      (formData.tipo_servico !== "preventiva" && !formData.descricao_defeito)
    ) {
      toast({
        title: "Campos obrigatórios",
        description:
          formData.tipo_servico !== "preventiva"
            ? "Preencha todos os campos obrigatórios: Tipo de Serviço, Data, Solicitado Por e Descrição do Problema."
            : "Preencha todos os campos obrigatórios: Tipo de Serviço, Data e Solicitado Por.",
        variant: "destructive",
      })
      return
    }

    if (desejaAgendar && !formData.data_agendamento) {
      toast({
        title: "Data de agendamento obrigatória",
        description: "Informe a data de agendamento ou desmarque a opção 'Deseja agendar?'.",
        variant: "destructive",
      })
      return
    }

    if (desejaAgendar && !formData.periodo_agendamento) {
      toast({
        title: "Período obrigatório",
        description: "Selecione o período (Manhã, Tarde ou Integral) para o agendamento.",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      const ordemData = {
        numero: numeroOS,
        cliente_id: clienteSelecionado.id,
        contrato_id: contratoConservacao?.id || null,
        contrato_numero: formData.contrato_numero,
        tecnico_id: null,
        tecnico_name: "A definir",
        tecnico_email: null,
        solicitado_por: formData.solicitado_por,
        data_atual: formData.data_atual,
        data_agendamento: desejaAgendar ? formData.data_agendamento : null,
        periodo_agendamento: desejaAgendar ? formData.periodo_agendamento : null,
        data_execucao: null,
        horario_entrada: null,
        horario_saida: null,
        tipo_servico: formData.tipo_servico,
        relatorio_visita: null,
        descricao_defeito: formData.descricao_defeito,
        servico_realizado: null,
        observacoes: null,
        responsavel: null,
        nome_responsavel: null,
        situacao: desejaAgendar ? "agendada" : "aberta",
        equipamentos: equipamentosSelecionados.map((eq) => ({
          equipamento_id: eq.id,
          equipamento_nome: eq.nome,
          observacoes: eq.observacoes,
          situacao: "pendente",
        })),
      }

      const response = await fetch("/api/ordens-servico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ordemData),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Ordem de serviço criada!",
          description: `OS ${numeroOS} criada com sucesso e está ${desejaAgendar ? "AGENDADA" : "ABERTA"} para execução.`,
        })
        onOpenChange(false)
        if (onSuccess) {
          onSuccess()
        }
      } else {
        throw new Error(result.error || "Erro desconhecido")
      }
    } catch (error) {
      console.error("Erro ao criar OS:", error)
      toast({
        title: "Erro ao criar",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao criar a ordem de serviço.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleNovoClienteCriado = (novoCliente: any) => {
    const clienteFormatado: Cliente = {
      id: novoCliente.id.toString(),
      codigo: novoCliente.codigo,
      nome: novoCliente.nome,
      cnpj: novoCliente.cnpj,
      cpf: novoCliente.cpf,
      email: novoCliente.email,
      telefone: novoCliente.telefone,
      endereco: novoCliente.endereco,
      bairro: novoCliente.bairro,
      cidade: novoCliente.cidade,
      estado: novoCliente.estado,
      cep: novoCliente.cep,
      distancia_km: novoCliente.distancia_km,
      nome_adm: novoCliente.nome_adm,
      contato_adm: novoCliente.contato_adm,
      telefone_adm: novoCliente.telefone_adm,
      email_adm: novoCliente.email_adm,
    }

    handleClienteChange(clienteFormatado)

    toast({
      title: "Cliente criado!",
      description: "O cliente foi criado e selecionado automaticamente.",
    })
  }

  const clienteTemContrato = contratoConservacao !== null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-4xl h-full flex flex-col p-6 overflow-y-auto border-l border-border shadow-2xl bg-card text-foreground">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Nova Ordem de Serviço
          </SheetTitle>
          <SheetDescription>Crie uma nova ordem de serviço no sistema</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 pt-2">
          {numeroOS && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <Badge variant="outline" className="font-mono text-xs">
                  Número: {numeroOS}
                </Badge>
              </div>
              <Badge
                className={
                  desejaAgendar
                    ? "bg-cyan-100 dark:bg-cyan-950/50 text-cyan-800 dark:text-cyan-300 border-0"
                    : "bg-yellow-100 dark:bg-yellow-950/50 text-yellow-800 dark:text-yellow-300 border-0"
                }
              >
                <Clock className="h-3 w-3 mr-1" />
                {desejaAgendar ? "AGENDADA" : "ABERTA"}
              </Badge>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Fields */}
            <div className="lg:col-span-2 space-y-6">
              {/* Cliente */}
              <Card className="border border-border bg-card">
                <CardHeader className="bg-muted/40 border-b border-border p-4">
                  <CardTitle className="text-foreground flex items-center gap-2 text-sm sm:text-base">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    Dados do Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <Label className="text-xs">Cliente *</Label>
                    <div className="flex flex-col sm:flex-row gap-2 mt-1">
                      <div className="flex-1">
                        <ClienteCombobox
                          value={clienteSelecionado}
                          onValueChange={handleClienteChange}
                          placeholder="Selecione um cliente..."
                        />
                      </div>
                      {!clienteSelecionado && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowNovoClienteDialog(true)}
                          className="h-9 px-3 text-xs border-border bg-card"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Novo Cliente
                        </Button>
                      )}
                    </div>
                  </div>

                  {clienteSelecionado && (
                    <div className="p-3 bg-muted/40 rounded-lg border border-border">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {clienteSelecionado.codigo && (
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {clienteSelecionado.codigo}
                          </Badge>
                        )}
                        <span className="font-medium text-foreground text-xs break-all">{clienteSelecionado.nome}</span>
                        {clienteTemContrato ? (
                          <Badge variant="outline" className="text-green-600 border-green-200 dark:border-green-900/50 bg-green-500/10 text-[10px] shrink-0">
                            Com Contrato
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600 border-red-200 dark:border-red-900/50 bg-red-500/10 text-[10px] shrink-0">
                            Sem Contrato
                          </Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground space-y-1">
                        <div>ID: {clienteSelecionado.id}</div>
                        {clienteSelecionado.cnpj && <div>CNPJ: {clienteSelecionado.cnpj}</div>}
                        {clienteSelecionado.cpf && <div>CPF: {clienteSelecionado.cpf}</div>}
                        {clienteSelecionado.endereco && <div className="break-words">Endereço: {clienteSelecionado.endereco}</div>}
                        {clienteSelecionado.telefone && <div>Telefone: {clienteSelecionado.telefone}</div>}
                      </div>
                    </div>
                  )}

                  <div>
                    <Label className="text-xs">Número do Contrato</Label>
                    <Input
                      id="contrato_numero"
                      value={formData.contrato_numero}
                      readOnly
                      className={`h-9 text-xs border-border ${
                        formData.contrato_numero === "Cliente sem contrato"
                          ? "bg-red-500/10 text-red-600 border-red-200 dark:border-red-900/50"
                          : "bg-green-500/10 text-green-600 border-green-200 dark:border-green-900/50"
                      }`}
                    />
                  </div>

                  {contratoConservacao && (
                    <div className="p-3 bg-muted/40 rounded-lg border border-border text-xs space-y-2">
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        <Shield className="h-4 w-4 text-green-600" />
                        <span>Contrato: {contratoConservacao.numero}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                        <div>Frequência: {contratoConservacao.frequencia?.toUpperCase()}</div>
                        <div>Vencimento: {formatarData(contratoConservacao.data_inicio)}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Informações Básicas */}
              <Card className="border border-border bg-card">
                <CardHeader className="bg-muted/40 border-b border-border p-4">
                  <CardTitle className="text-foreground flex items-center gap-2 text-sm sm:text-base">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    Informações Básicas
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Tipo de Serviço *</Label>
                      <Select
                        value={formData.tipo_servico}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, tipo_servico: value }))}
                      >
                        <SelectTrigger className="h-9 text-xs border-border bg-background">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manutencao">Manutenção</SelectItem>
                          <SelectItem value="orcamento">Orçamento</SelectItem>
                          <SelectItem value="vistoria_contrato">Vistoria para Contrato</SelectItem>
                          <SelectItem value="preventiva">Preventiva</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">Data de Criação *</Label>
                      <Input
                        type="date"
                        value={formData.data_atual}
                        onChange={(e) => setFormData((prev) => ({ ...prev, data_atual: e.target.value }))}
                        className="h-9 text-xs border-border bg-background"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Solicitado Por *</Label>
                    <Input
                      value={formData.solicitado_por}
                      onChange={(e) => setFormData((prev) => ({ ...prev, solicitado_por: e.target.value }))}
                      placeholder="Nome de quem solicitou o serviço"
                      className="h-9 text-xs border-border bg-background"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="deseja_agendar_dialog"
                        checked={desejaAgendar}
                        onCheckedChange={(checked) => {
                          setDesejaAgendar(checked as boolean)
                          if (!checked) {
                            setFormData((prev) => ({ ...prev, data_agendamento: "", periodo_agendamento: "" }))
                          }
                        }}
                      />
                      <Label htmlFor="deseja_agendar_dialog" className="text-xs cursor-pointer">
                        Deseja agendar esta ordem de serviço?
                      </Label>
                    </div>

                    {desejaAgendar && (
                      <div className="pl-6 space-y-4">
                        <div>
                          <Label className="text-xs">Data de Agendamento *</Label>
                          <Input
                            type="date"
                            value={formData.data_agendamento}
                            onChange={(e) => setFormData((prev) => ({ ...prev, data_agendamento: e.target.value }))}
                            min={formData.data_atual}
                            className="h-9 text-xs border-border bg-background"
                          />
                        </div>

                        <div>
                          <Label className="text-xs">Período *</Label>
                          <Select
                            value={formData.periodo_agendamento}
                            onValueChange={(value: "manha" | "tarde" | "integral") =>
                              setFormData((prev) => ({ ...prev, periodo_agendamento: value }))
                            }
                          >
                            <SelectTrigger className="h-9 text-xs border-border bg-background">
                              <SelectValue placeholder="Selecione o período" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="manha">Manhã (9h-12h)</SelectItem>
                              <SelectItem value="tarde">Tarde (13h-17h)</SelectItem>
                              <SelectItem value="integral">Integral (9h-17h)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Equipamentos */}
              <Card className="border border-border bg-card">
                <CardHeader className="bg-muted/40 border-b border-border p-4">
                  <CardTitle className="text-foreground flex items-center gap-2 text-sm sm:text-base">
                    <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                    Equipamentos
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <Label className="text-xs">Adicionar Equipamento Adicional</Label>
                    <EquipamentoCombobox
                      onSelect={handleEquipamentoSelect}
                      placeholder="Selecione um equipamento..."
                      disabled={!clienteSelecionado}
                    />
                  </div>

                  {equipamentosSelecionados.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-foreground text-xs">Equipamentos Selecionados:</h4>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {equipamentosSelecionados.map((equipamento) => (
                          <div key={equipamento.id} className="flex items-center justify-between p-2 border border-border rounded bg-muted/20 text-xs">
                            <span className="font-medium">{equipamento.nome}</span>
                            <div className="flex items-center gap-2">
                              {equipamento.do_contrato ? (
                                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-500/10 text-[10px]">
                                  Contrato
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-500/10 text-[10px]">
                                  Adicional
                                </Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removerEquipamento(equipamento.id)}
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                disabled={equipamento.do_contrato}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Descrição Problema */}
              {formData.tipo_servico !== "preventiva" && (
                <Card className="border border-border bg-card">
                  <CardHeader className="bg-muted/40 border-b border-border p-4">
                    <CardTitle className="text-foreground flex items-center gap-2 text-sm sm:text-base">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      Descrição do Problema
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <Textarea
                      value={formData.descricao_defeito}
                      onChange={(e) => setFormData((prev) => ({ ...prev, descricao_defeito: e.target.value }))}
                      placeholder="Descreva o defeito apresentado ou serviço a ser realizado"
                      rows={4}
                      className="text-xs border-border bg-background"
                    />
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Resumo */}
            <div className="space-y-6 lg:self-start">
              <Card className="border border-border bg-card overflow-hidden">
                <CardHeader className="bg-muted/40 border-b border-border p-4">
                  <CardTitle className="text-foreground text-sm font-semibold">Resumo da Ordem</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Número:</span>
                      <Badge variant="outline" className="font-mono text-[10px]">{numeroOS || "A definir"}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cliente:</span>
                      <span className="font-medium text-foreground truncate max-w-[120px]">{clienteSelecionado ? clienteSelecionado.nome : "Não selecionado"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipo:</span>
                      <span className="font-medium text-foreground">{getTipoServicoLabel(formData.tipo_servico)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Data OS:</span>
                      <span className="font-medium text-foreground">{formatarData(formData.data_atual)}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleSubmit}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium h-9 text-xs"
                    disabled={
                      loading ||
                      !clienteSelecionado ||
                      !formData.tipo_servico ||
                      !formData.data_atual ||
                      !formData.solicitado_por ||
                      (formData.tipo_servico !== "preventiva" && !formData.descricao_defeito) ||
                      (desejaAgendar && !formData.data_agendamento) ||
                      (desejaAgendar && !formData.periodo_agendamento)
                    }
                  >
                    {loading ? "Criando..." : "Criar Ordem de Serviço"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <ClienteFormDialog
          open={showNovoClienteDialog}
          onOpenChange={setShowNovoClienteDialog}
          asDrawer={true}
          onSuccess={handleNovoClienteCriado}
        />
      </SheetContent>
    </Sheet>
  )
}
