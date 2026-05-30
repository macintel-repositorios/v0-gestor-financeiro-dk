"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  Minus,
  Save,
  Calculator,
  Package,
  User,
  MapPin,
  Calendar,
  Edit2,
  Hash,
  Building2,
  Plus,
  GripVertical,
  Loader2,
  FileText
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency, cn } from "@/lib/utils"
import { ClienteCombobox, type Cliente } from "@/components/cliente-combobox"
import { ProdutoCombobox } from "@/components/produto-combobox"
import { ProdutoFormDialog } from "@/components/produto-form-dialog"
import { ClienteFormDialog } from "@/components/cliente-form-dialog"
import { EditarServicoDialog } from "@/components/editar-servico-dialog"

interface OrcamentoItem {
  produto_id: string
  produto: any
  quantidade: number
  valor_unitario: number
  valor_mao_obra: number
  valor_total: number
  marca_nome?: string
  produto_ncm?: string
  valor_unitario_ajustado?: number
  valor_total_ajustado?: number
}

interface NovoOrcamentoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function NovoOrcamentoDialog({ open, onOpenChange, onSuccess }: NovoOrcamentoDialogProps) {
  const { toast } = useToast()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [itens, setItens] = useState<OrcamentoItem[]>([])
  const [tipoServico, setTipoServico] = useState("")
  const [detalhesServico, setDetalhesServico] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [validade, setValidade] = useState(30)
  const [desconto, setDesconto] = useState(0)
  const [situacao, setSituacao] = useState("pendente")
  const [saving, setSaving] = useState(false)
  const [proximoNumero, setProximoNumero] = useState<string>("")

  const [produtoEditDialog, setProdutoEditDialog] = useState(false)
  const [produtoParaEditar, setProdutoParaEditar] = useState<any | null>(null)

  const [servicoEditDialog, setServicoEditDialog] = useState(false)
  const [servicoParaEditar, setServicoParaEditar] = useState<any | null>(null)

  const [showNewClientDialog, setShowNewClientDialog] = useState(false)
  const [showNewProductDialog, setShowNewProductDialog] = useState(false)
  const [produtoComboboxKey, setProdutoComboboxKey] = useState(0)

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const [distanciaKm, setDistanciaKm] = useState(0)
  const [valorBoleto, setValorBoleto] = useState(3.5)
  const [prazoDias, setPrazoDias] = useState(5)
  const [dataInicio, setDataInicio] = useState("")
  const [jurosAm, setJurosAm] = useState(2.0)
  const [impostoServico, setImpostoServico] = useState(10.9)
  const [impostoMaterial, setImpostoMaterial] = useState(12.7)
  const [descontoMdoPercent, setDescontoMdoPercent] = useState(0)

  const [parcelamentoMdo, setParcelamentoMdo] = useState(1)
  const [parcelamentoMaterial, setParcelamentoMaterial] = useState(1)
  const [materialAVista, setMaterialAVista] = useState(false)

  const [valorPorKm, setValorPorKm] = useState(1.5)
  const [dataOrcamento, setDataOrcamento] = useState(new Date().toISOString().split("T")[0])

  // Reset form when open changes
  useEffect(() => {
    if (open) {
      setCliente(null)
      setItens([])
      setTipoServico("")
      setDetalhesServico("")
      setObservacoes("")
      setValidade(30)
      setDesconto(0)
      setSituacao("pendente")
      setDistanciaKm(0)
      setValorBoleto(3.5)
      setPrazoDias(5)
      setDataInicio("")
      setJurosAm(2.0)
      setImpostoServico(10.9)
      setImpostoMaterial(12.7)
      setDescontoMdoPercent(0)
      setParcelamentoMdo(1)
      setParcelamentoMaterial(1)
      setMaterialAVista(false)
      setDataOrcamento(new Date().toISOString().split("T")[0])
      
      loadValorPorKm()
      loadProximoNumero()
    }
  }, [open])

  useEffect(() => {
    if (cliente?.distancia_km) {
      setDistanciaKm(cliente.distancia_km)
    }
  }, [cliente])

  useEffect(() => {
    if (open) {
      loadProximoNumero()
    }
  }, [dataOrcamento])

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

  const loadProximoNumero = async () => {
    try {
      const response = await fetch(`/api/orcamentos/proximo-numero?data=${dataOrcamento}`)
      const result = await response.json()
      if (result.success && result.data) {
        setProximoNumero(result.data.numero)
      }
    } catch (error) {
      console.error("Erro ao carregar próximo número:", error)
    }
  }

  const handleClienteCreated = (novoCliente: any) => {
    setShowNewClientDialog(false)
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
    setCliente(clienteFormatado)
    if (clienteFormatado.distancia_km) {
      setDistanciaKm(clienteFormatado.distancia_km)
    }
    toast({
      title: "Cliente criado!",
      description: "O cliente foi criado e selecionado automaticamente.",
    })
  }

  const handleProdutoCreated = async (produtoCriado?: any) => {
    setShowNewProductDialog(false)
    setProdutoComboboxKey((prev) => prev + 1)

    if (produtoCriado) {
      try {
        const response = await fetch(`/api/produtos/${produtoCriado.id}`)
        const result = await response.json()
        if (result.success && result.data) {
          const produtoCompleto = result.data
          await adicionarItem(produtoCompleto)
          toast({
            title: "Produto criado e adicionado",
            description: `${produtoCompleto.descricao} foi criado e adicionado ao orçamento automaticamente.`,
          })
        }
      } catch (error) {
        console.error("Erro ao buscar produto criado:", error)
      }
    }
  }

  const adicionarItem = async (produto: any) => {
    try {
      const response = await fetch(`/api/produtos/${produto.id}`)
      const result = await response.json()
      let marcaNome = null
      let produtoNcm = null
      if (result.success && result.data) {
        marcaNome = result.data.marca || null
        produtoNcm = result.data.ncm || null
      }
      const novoItem: OrcamentoItem = {
        produto_id: produto.id,
        produto: {
          ...produto,
          ncm: produtoNcm,
        },
        quantidade: 1,
        valor_unitario: produto.valor_unitario,
        valor_mao_obra: produto.valor_mao_obra || 0,
        valor_total: 1 * (produto.valor_unitario + (produto.valor_mao_obra || 0)),
        marca_nome: marcaNome,
        produto_ncm: produtoNcm,
      }
      setItens([...itens, novoItem])
      toast({
        title: "Produto adicionado",
        description: `${produto.descricao} foi adicionado ao orçamento`,
      })
    } catch (error) {
      console.error("Erro ao buscar dados do produto:", error)
    }
  }

  const removerItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index))
  }

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverIndex(index)
  }

  const handleDrop = (e: React.DragEvent<HTMLTableRowElement>, targetIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }
    const novosItens = [...itens]
    const [removido] = novosItens.splice(draggedIndex, 1)
    novosItens.splice(targetIndex, 0, removido)
    setItens(novosItens)
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const atualizarItem = (index: number, campo: keyof OrcamentoItem, valor: any) => {
    const novosItens = [...itens]
    novosItens[index] = { ...novosItens[index], [campo]: valor }

    if (campo === "quantidade" || campo === "valor_unitario" || campo === "valor_mao_obra") {
      const item = novosItens[index]
      novosItens[index].valor_total = item.quantidade * (item.valor_unitario + item.valor_mao_obra)
    }
    setItens(novosItens)
  }

  const editarProduto = async (produto: any) => {
    try {
      const response = await fetch(`/api/produtos/${produto.id}`)
      const result = await response.json()
      if (result.success && result.data) {
        const produtoCompleto = result.data
        if (produtoCompleto.codigo && produtoCompleto.codigo.startsWith("015")) {
          setServicoParaEditar({
            id: produtoCompleto.id.toString(),
            codigo: produtoCompleto.codigo,
            descricao: produtoCompleto.descricao,
            valor_mao_obra: produtoCompleto.valor_mao_obra || 180,
            observacoes: produtoCompleto.observacoes || "",
            ativo: produtoCompleto.ativo !== false,
          })
          setServicoEditDialog(true)
        } else {
          setProdutoParaEditar(produtoCompleto)
          setProdutoEditDialog(true)
        }
      }
    } catch (error) {
      console.error("Erro ao carregar produto:", error)
    }
  }

  const handleProdutoEditSuccess = async () => {
    if (produtoParaEditar) {
      try {
        const response = await fetch(`/api/produtos/${produtoParaEditar.id}`)
        const result = await response.json()

        if (result.success && result.data) {
          const produtoAtualizado = result.data
          const marcaNome = produtoAtualizado.marca || null
          const produtoNcm = produtoAtualizado.ncm || null

          const novosItens = itens.map((item) => {
            if (item.produto_id === produtoParaEditar.id.toString()) {
              const novoValorUnitario = produtoAtualizado.preco_venda || produtoAtualizado.valor_unitario
              const novoValorMaoObra = produtoAtualizado.valor_mao_obra || 0
              return {
                ...item,
                produto: {
                  ...item.produto,
                  descricao: produtoAtualizado.nome || produtoAtualizado.descricao,
                  valor_unitario: novoValorUnitario,
                  valor_mao_obra: novoValorMaoObra,
                },
                valor_unitario: novoValorUnitario,
                valor_mao_obra: novoValorMaoObra,
                valor_total: item.quantidade * (novoValorUnitario + novoValorMaoObra),
                marca_nome: marcaNome,
                produto_ncm: produtoNcm,
              }
            }
            return item
          })
          setItens(novosItens)
        }
      } catch (error) {
        console.error("Erro ao recarregar produto:", error)
      }
    }
    setProdutoEditDialog(false)
    setProdutoParaEditar(null)
  }

  const handleProdutoEditCancel = (open: boolean) => {
    if (!open) {
      setProdutoEditDialog(false)
      setProdutoParaEditar(null)
    }
  }

  const handleServicoEditSuccess = async () => {
    if (servicoParaEditar) {
      try {
        const response = await fetch(`/api/produtos/${servicoParaEditar.id}`)
        const result = await response.json()
        if (result.success && result.data) {
          const servicoAtualizado = result.data
          const novosItens = itens.map((item) => {
            if (item.produto_id === servicoParaEditar.id.toString()) {
              const novoValorMaoObra = servicoAtualizado.valor_mao_obra || 180
              return {
                ...item,
                produto: {
                  ...item.produto,
                  descricao: servicoAtualizado.descricao,
                  valor_mao_obra: novoValorMaoObra,
                },
                valor_mao_obra: novoValorMaoObra,
                valor_total: item.quantidade * (item.valor_unitario + novoValorMaoObra),
              }
            }
            return item
          })
          setItens(novosItens)
        }
      } catch (error) {
        console.error("Erro ao recarregar servico:", error)
      }
    }
    setServicoEditDialog(false)
    setServicoParaEditar(null)
  }

  const handleServicoEditCancel = (open: boolean) => {
    if (!open) {
      setServicoEditDialog(false)
      setServicoParaEditar(null)
    }
  }

  const safeNumberCalc = (value: any): number => {
    const num = Number(value)
    return isNaN(num) ? 0 : num
  }

  const calcularValorMaterial = () => {
    return itens.reduce((acc, item) => acc + item.quantidade * item.valor_unitario, 0)
  }

  const calcularValorMaoObra = () => {
    return itens.reduce((acc, item) => acc + item.quantidade * item.valor_mao_obra, 0)
  }

  const calcularCustoDeslocamento = () => {
    return distanciaKm * 2 * valorPorKm * prazoDias
  }

  const calcularSubtotalMdo = () => {
    if (parcelamentoMdo === 0) return 0
    return (
      calcularValorMaoObra() -
      calcularDescontoMdoValor() +
      calcularCustoDeslocamento() +
      calcularTaxaBoletoMdo() +
      calcularImpostoServicoValor()
    )
  }

  const calcularSubtotalMaterial = () => {
    if (parcelamentoMaterial === 0 && !materialAVista) return 0
    const custoDeslocamentoExtra = parcelamentoMdo === 0 ? calcularCustoDeslocamento() : 0
    return (
      calcularValorMaterial() +
      calcularValorJuros() +
      calcularTaxaBoletoMaterial() +
      calcularImpostoMaterialValor() +
      custoDeslocamentoExtra
    )
  }

  const calcularValorJuros = () => {
    if (materialAVista || parcelamentoMaterial === 0) return 0
    return ((parcelamentoMdo + parcelamentoMaterial - 1) * jurosAm * calcularValorMaterial()) / 100
  }

  const calcularTaxaBoletoMdo = () => {
    return parcelamentoMdo * valorBoleto
  }

  const calcularTaxaBoletoMaterial = () => {
    if (materialAVista) return valorBoleto
    if (parcelamentoMaterial === 0) return 0
    return parcelamentoMaterial * valorBoleto
  }

  const calcularDescontoMdoValor = () => {
    return (calcularValorMaoObra() * descontoMdoPercent) / 100
  }

  const calcularImpostoServicoValor = () => {
    const base =
      calcularValorMaoObra() - calcularDescontoMdoValor() + calcularCustoDeslocamento() + calcularTaxaBoletoMdo()
    return (base * impostoServico) / 100
  }

  const calcularImpostoMaterialValor = () => {
    if (parcelamentoMaterial === 0 && !materialAVista) return 0
    const base = calcularValorMaterial() + calcularValorJuros() + calcularTaxaBoletoMaterial()
    return (base * impostoMaterial) / 100
  }

  const calcularTotal = () => {
    return calcularSubtotalMdo() + calcularSubtotalMaterial() - desconto
  }

  const obterValoresAjustados = () => {
    const valorMaterialBruto = calcularValorMaterial()
    const subtotalMaterial = calcularSubtotalMaterial()
    if (valorMaterialBruto === 0 || subtotalMaterial === 0) {
      return itens
    }
    const fatorAjuste = subtotalMaterial / valorMaterialBruto
    return itens.map((item) => {
      const valorUnitarioAjustado = item.valor_unitario * fatorAjuste
      const valorTotalAjustado = item.quantidade * valorUnitarioAjustado
      return {
        ...item,
        valor_unitario_ajustado: valorUnitarioAjustado,
        valor_total_ajustado: valorTotalAjustado,
      }
    })
  }

  const salvarOrcamento = async () => {
    if (!cliente) {
      toast({
        title: "Erro",
        description: "Selecione um cliente",
        variant: "destructive",
      })
      return
    }

    if (!tipoServico.trim()) {
      toast({
        title: "Erro",
        description: "Informe o tipo de serviço",
        variant: "destructive",
      })
      return
    }

    if (itens.length === 0 && parcelamentoMaterial > 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um item ao orçamento",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)
      const itensComValoresAjustados = obterValoresAjustados()
      const orcamentoData = {
        cliente_id: cliente.id,
        tipo_servico: tipoServico,
        detalhes_servico: detalhesServico,
        valor_material: calcularValorMaterial(),
        valor_mao_obra: calcularValorMaoObra(),
        desconto,
        valor_total: calcularTotal(),
        validade,
        observacoes,
        situacao,
        data_orcamento: dataOrcamento,
        data_inicio: dataInicio || null,
        distancia_km: distanciaKm,
        valor_boleto: valorBoleto,
        prazo_dias: prazoDias,
        juros_am: jurosAm,
        imposto_servico: impostoServico,
        imposto_material: impostoMaterial,
        desconto_mdo_percent: descontoMdoPercent,
        desconto_mdo_valor: calcularDescontoMdoValor(),
        parcelamento_mdo: parcelamentoMdo,
        parcelamento_material: materialAVista ? 1 : parcelamentoMaterial,
        material_a_vista: materialAVista,
        custo_deslocamento: calcularCustoDeslocamento(),
        valor_juros: calcularValorJuros(),
        taxa_boleto_mdo: calcularTaxaBoletoMdo(),
        taxa_boleto_material: calcularTaxaBoletoMaterial(),
        valor_imposto_servico: calcularImpostoServicoValor(),
        valor_imposto_material: calcularImpostoMaterialValor(),
        subtotal_mdo: calcularSubtotalMdo(),
        subtotal_material: calcularSubtotalMaterial(),
        itens: itensComValoresAjustados.map((item) => ({
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario,
          valor_mao_obra: item.valor_mao_obra,
          valor_total: item.valor_total,
          marca_nome: item.marca_nome,
          produto_ncm: item.produto_ncm,
          valor_unitario_ajustado: item.valor_unitario_ajustado,
          valor_total_ajustado: item.valor_total_ajustado,
        })),
      }

      const response = await fetch("/api/orcamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orcamentoData),
      })
      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sucesso!",
          description: `Orçamento ${result.data.numero} criado com sucesso`,
        })
        onOpenChange(false)
        if (onSuccess) onSuccess()
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao criar orçamento",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao salvar orçamento:", error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-5xl h-full flex flex-col p-6 overflow-y-auto border-l border-border shadow-2xl bg-card text-foreground">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Novo Orçamento
          </SheetTitle>
          <SheetDescription>Crie um novo orçamento no sistema</SheetDescription>
        </SheetHeader>

        {proximoNumero && (
          <div className="flex items-center gap-2 mb-4">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <Badge variant="outline" className="font-mono text-xs">
              Número Sugerido: {proximoNumero}
            </Badge>
          </div>
        )}

        <div className="space-y-6 pt-2 flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Cliente */}
              <Card className="border border-border bg-card">
                <CardHeader className="bg-muted/40 border-b border-border p-4">
                  <CardTitle className="text-foreground text-sm flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Dados do Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1">
                      <Label className="text-xs">Cliente *</Label>
                      <ClienteCombobox
                        value={cliente}
                        onValueChange={setCliente}
                        placeholder="Selecione um cliente..."
                        showNewClientButton={false}
                      />
                    </div>
                    {!cliente && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowNewClientDialog(true)}
                        className="sm:self-end h-9 border-border text-xs"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Novo Cliente
                      </Button>
                    )}
                  </div>

                  {cliente && (
                    <div className="p-3 bg-muted/40 rounded-lg border border-border text-xs space-y-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        {cliente.codigo && <Badge variant="outline" className="font-mono text-[10px]">{cliente.codigo}</Badge>}
                        <span className="font-semibold text-foreground">{cliente.nome}</span>
                      </div>
                      <div>CNPJ/CPF: {cliente.cnpj || cliente.cpf || "Não informado"}</div>
                      <div>Endereço: {cliente.endereco || "Não informado"}</div>
                      <div>Cidade: {cliente.cidade || "Não informado"}</div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Tipo de Serviço *</Label>
                      <Input
                        value={tipoServico}
                        onChange={(e) => setTipoServico(e.target.value)}
                        placeholder="Ex: Manutenção..."
                        className="h-9 border-border text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Validade (dias)</Label>
                      <Input
                        type="number"
                        value={validade}
                        onChange={(e) => setValidade(Number.parseInt(e.target.value) || 30)}
                        className="h-9 border-border text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Data do Orçamento</Label>
                    <Input
                      type="date"
                      value={dataOrcamento}
                      onChange={(e) => setDataOrcamento(e.target.value)}
                      className="h-9 border-border text-xs"
                    />
                  </div>

                  {/* Parâmetros */}
                  <div className="border-t border-border pt-4 space-y-4">
                    <h4 className="font-semibold text-xs text-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      Parâmetros e Taxas
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Distância (Km)</Label>
                        <Input
                          type="number"
                          value={distanciaKm}
                          onChange={(e) => setDistanciaKm(Number.parseFloat(e.target.value) || 0)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Taxa Boleto (R$)</Label>
                        <Input
                          type="number"
                          value={valorBoleto}
                          onChange={(e) => setValorBoleto(Number.parseFloat(e.target.value) || 3.5)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Prazo (dias)</Label>
                        <Input
                          type="number"
                          value={prazoDias}
                          onChange={(e) => setPrazoDias(Number.parseInt(e.target.value) || 5)}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Data Início</Label>
                        <Input
                          type="date"
                          value={dataInicio}
                          onChange={(e) => setDataInicio(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Juros (a.m.) %</Label>
                        <Input
                          type="number"
                          value={jurosAm}
                          onChange={(e) => setJurosAm(Number.parseFloat(e.target.value) || 2.0)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Desconto MDO %</Label>
                        <Input
                          type="number"
                          value={descontoMdoPercent}
                          onChange={(e) => setDescontoMdoPercent(Number.parseFloat(e.target.value) || 0)}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Imp. Serviço %</Label>
                        <Input
                          type="number"
                          value={impostoServico}
                          onChange={(e) => setImpostoServico(Number.parseFloat(e.target.value) || 10.9)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Imp. Material %</Label>
                        <Input
                          type="number"
                          value={impostoMaterial}
                          onChange={(e) => setImpostoMaterial(Number.parseFloat(e.target.value) || 12.7)}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Detalhes do Serviço</Label>
                    <Textarea
                      value={detalhesServico}
                      onChange={(e) => setDetalhesServico(e.target.value)}
                      placeholder="Descreva o escopo do serviço..."
                      rows={2}
                      className="text-xs border-border bg-background"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Itens */}
              <Card className="border border-border bg-card">
                <CardHeader className="bg-muted/40 border-b border-border p-4">
                  <CardTitle className="text-foreground text-sm flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    Itens do Orçamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <ProdutoCombobox
                        key={produtoComboboxKey}
                        onSelect={adicionarItem}
                        placeholder="Busque e selecione um produto/serviço..."
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowNewProductDialog(true)}
                      className="h-9 border-border text-xs shrink-0"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Novo
                    </Button>
                  </div>

                  {itens.length > 0 ? (
                    <div className="border border-border rounded-lg overflow-x-auto">
                      <Table className="text-xs">
                        <TableHeader>
                          <TableRow className="bg-muted/40">
                            <TableHead className="font-semibold w-10"></TableHead>
                            <TableHead className="font-semibold">Item</TableHead>
                            <TableHead className="font-semibold w-20 text-center">Quant.</TableHead>
                            <TableHead className="font-semibold w-24">Vlr Unit</TableHead>
                            <TableHead className="font-semibold w-24">Mão Obra</TableHead>
                            <TableHead className="font-semibold w-24">Total</TableHead>
                            <TableHead className="w-10"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {itens.map((item, index) => (
                            <TableRow key={index} className="hover:bg-muted/20 border-b border-border">
                              <TableCell className="py-2 text-center">
                                <GripVertical className="h-3.5 w-3.5 text-muted-foreground opacity-60 cursor-grab" />
                              </TableCell>
                              <TableCell>
                                <div className="font-medium text-foreground">{item.produto.descricao}</div>
                                <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">{item.produto.codigo}</div>
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantidade}
                                  onChange={(e) =>
                                    atualizarItem(index, "quantidade", Number.parseInt(e.target.value) || 1)
                                  }
                                  className="h-7 text-center text-xs"
                                />
                              </TableCell>
                              <TableCell className="font-medium">{formatCurrency(item.valor_unitario)}</TableCell>
                              <TableCell className="font-medium">{formatCurrency(item.valor_mao_obra)}</TableCell>
                              <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(item.valor_total)}</TableCell>
                              <TableCell className="py-2 text-center">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removerItem(index)}
                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-6 border border-dashed border-border rounded-lg">
                      <Package className="mx-auto h-8 w-8 text-muted-foreground opacity-50 mb-2" />
                      <p className="text-xs text-muted-foreground">Nenhum item adicionado</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Observações */}
              <Card className="border border-border bg-card">
                <CardHeader className="bg-muted/40 border-b border-border p-4">
                  <CardTitle className="text-foreground text-sm">Observações</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <Textarea
                    placeholder="Digite observações sobre o orçamento..."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    rows={2}
                    className="text-xs border-border bg-background"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Resumo */}
            <div className="space-y-6">
              <Card className="border border-border bg-muted/40 overflow-hidden sticky top-0">
                <CardHeader className="bg-muted border-b border-border p-4">
                  <CardTitle className="text-foreground text-sm flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-indigo-500" />
                    Resumo do Orçamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4 text-xs">
                  <div>
                    <Label className="text-[10px] text-muted-foreground uppercase font-semibold">Parcelas</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div>
                        <Label className="text-[9px]">MDO</Label>
                        <Input
                          type="number"
                          min="0"
                          value={parcelamentoMdo}
                          onChange={(e) => setParcelamentoMdo(Number.parseInt(e.target.value) || 0)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[9px]">Material</Label>
                        <Input
                          type="number"
                          min="0"
                          value={parcelamentoMaterial}
                          onChange={(e) => setParcelamentoMaterial(Number.parseInt(e.target.value) || 0)}
                          className="h-8 text-xs"
                          disabled={materialAVista}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        id="material_a_vista_dialog"
                        checked={materialAVista}
                        onChange={(e) => {
                          setMaterialAVista(e.target.checked)
                          if (e.target.checked) {
                            setParcelamentoMaterial(1)
                          }
                        }}
                        className="h-3 w-3 rounded border-border"
                      />
                      <Label htmlFor="material_a_vista_dialog" className="text-[10px] cursor-pointer">
                        Material à vista
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-border pt-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor Material:</span>
                      <span className="font-medium text-foreground">{formatCurrency(calcularValorMaterial())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mão de Obra:</span>
                      <span className="font-medium text-foreground">{formatCurrency(calcularValorMaoObra())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Custo Deslocamento:</span>
                      <span className="font-medium text-foreground">{formatCurrency(calcularCustoDeslocamento())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Juros Material:</span>
                      <span className="font-medium text-foreground">{formatCurrency(calcularValorJuros())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Imposto Serviço:</span>
                      <span className="font-medium text-foreground">{formatCurrency(calcularImpostoServicoValor())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Imposto Material:</span>
                      <span className="font-medium text-foreground">{formatCurrency(calcularImpostoMaterialValor())}</span>
                    </div>

                    <div className="border-t border-border pt-2 font-semibold">
                      <div className="flex justify-between text-indigo-600 dark:text-indigo-400">
                        <span>Subtotal MDO:</span>
                        <span>{formatCurrency(calcularSubtotalMdo())}</span>
                      </div>
                      <div className="flex justify-between text-indigo-600 dark:text-indigo-400">
                        <span>Subtotal Mat:</span>
                        <span>{formatCurrency(calcularSubtotalMaterial())}</span>
                      </div>
                    </div>

                    <div className="border-t border-border pt-2 text-sm font-bold flex justify-between text-foreground">
                      <span>Total Geral:</span>
                      <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(calcularTotal())}</span>
                    </div>
                  </div>

                  <Button
                    onClick={salvarOrcamento}
                    disabled={saving || !cliente || (itens.length === 0 && parcelamentoMaterial > 0) || !tipoServico.trim()}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium h-9 mt-4 text-xs"
                  >
                    {saving ? "Salvando..." : "Salvar Orçamento"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <ProdutoFormDialog
          open={produtoEditDialog}
          onOpenChange={handleProdutoEditCancel}
          produto={produtoParaEditar}
          onSuccess={handleProdutoEditSuccess}
        />
        <ClienteFormDialog
          open={showNewClientDialog}
          onOpenChange={setShowNewClientDialog}
          onSuccess={handleClienteCreated}
          asDrawer={true}
        />
        <ProdutoFormDialog
          open={showNewProductDialog}
          onOpenChange={setShowNewProductDialog}
          onSuccess={handleProdutoCreated}
        />
        <EditarServicoDialog
          open={servicoEditDialog}
          onOpenChange={handleServicoEditCancel}
          servico={servicoParaEditar}
          onSuccess={handleServicoEditSuccess}
        />
      </SheetContent>
    </Sheet>
  )
}
