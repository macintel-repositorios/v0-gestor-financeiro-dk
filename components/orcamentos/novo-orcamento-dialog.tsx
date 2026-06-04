"use client"

import React, { useState, useEffect, useRef } from "react"
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
  FileText,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency, cn } from "@/lib/utils"
import { ClienteCombobox, type Cliente } from "@/components/cliente-combobox"
import { ProdutoCombobox } from "@/components/produto-combobox"
import { ProdutoFormDialog } from "@/components/produto-form-dialog"
import { ClienteFormDialog } from "@/components/cliente-form-dialog"
import { EditarServicoDialog } from "@/components/editar-servico-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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

  // Estado para controlar a expansão dos cards de itens
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  // Estados para expansão de seções do formulário
  const [expandCliente, setExpandCliente] = useState(false)
  const [expandParametros, setExpandParametros] = useState(false)
  const [expandDetalhes, setExpandDetalhes] = useState(false)
  const [expandObservacoes, setExpandObservacoes] = useState(false)
  const [expandItens, setExpandItens] = useState(false)
  const [expandResumo, setExpandResumo] = useState(false)

  const handleToggleCliente = () => {
    setExpandCliente((prev) => {
      const next = !prev
      if (next) {
        setExpandParametros(false)
        setExpandDetalhes(false)
        setExpandObservacoes(false)
        setExpandItens(false)
        setExpandResumo(false)
      }
      return next
    })
  }

  const handleToggleParametros = () => {
    setExpandParametros((prev) => {
      const next = !prev
      if (next) {
        setExpandCliente(false)
        setExpandDetalhes(false)
        setExpandObservacoes(false)
        setExpandItens(false)
        setExpandResumo(false)
      }
      return next
    })
  }

  const handleToggleDetalhes = () => {
    setExpandDetalhes((prev) => {
      const next = !prev
      if (next) {
        setExpandCliente(false)
        setExpandParametros(false)
        setExpandObservacoes(false)
        setExpandItens(false)
        setExpandResumo(false)
      }
      return next
    })
  }

  const handleToggleObservacoes = () => {
    setExpandObservacoes((prev) => {
      const next = !prev
      if (next) {
        setExpandCliente(false)
        setExpandParametros(false)
        setExpandDetalhes(false)
        setExpandItens(false)
        setExpandResumo(false)
      }
      return next
    })
  }

  const handleToggleItens = () => {
    setExpandItens((prev) => {
      const next = !prev
      if (next) {
        setExpandCliente(false)
        setExpandParametros(false)
        setExpandDetalhes(false)
        setExpandObservacoes(false)
        setExpandResumo(false)
      }
      return next
    })
  }

  const handleToggleResumo = () => {
    setExpandResumo((prev) => {
      const next = !prev
      if (next) {
        setExpandCliente(false)
        setExpandParametros(false)
        setExpandDetalhes(false)
        setExpandObservacoes(false)
        setExpandItens(false)
      }
      return next
    })
  }

  const detailsTextareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const textarea = detailsTextareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [detalhesServico, expandDetalhes])

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
      
      setExpandCliente(false)
      setExpandParametros(false)
      setExpandDetalhes(false)
      setExpandObservacoes(false)
      setExpandItens(false)
      setExpandResumo(false)
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
    setExpandCliente(false)
    setExpandParametros(true)
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

  const handleDragOver = (e: React.DragEvent<HTMLElement>, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverIndex(index)
  }

  const handleDrop = (e: React.DragEvent<HTMLElement>, targetIndex: number) => {
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
                <CardHeader 
                  onClick={handleToggleCliente}
                  className="bg-muted/40 border-b border-border p-4 cursor-pointer select-none hover:bg-muted/65 transition-colors"
                >
                  <div className="flex items-center justify-between w-full">
                    <CardTitle className="text-foreground text-sm flex items-center gap-2 flex-wrap">
                      <User className="h-4 w-4 text-muted-foreground" />
                      Dados do Cliente
                      {!expandCliente && cliente && (
                        <Badge variant="secondary" className="font-semibold text-[10px] sm:text-xs ml-2 py-0 px-2">
                          {cliente.nome}
                        </Badge>
                      )}
                    </CardTitle>
                    {expandCliente ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {expandCliente && (
                    <>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex-1">
                          <Label className="text-xs">Cliente *</Label>
                          <ClienteCombobox
                            value={cliente}
                            onValueChange={(val) => {
                              setCliente(val)
                              if (val) {
                                setExpandCliente(false)
                                setExpandParametros(true)
                              }
                            }}
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

                    </>
                  )}

                  {/* Parâmetros */}
                  <div className="border-t border-border pt-4">
                    <h4 
                      onClick={handleToggleParametros}
                      className="font-semibold text-xs text-foreground flex items-center justify-between gap-2 cursor-pointer select-none hover:text-indigo-500 transition-colors py-1"
                    >
                      <span className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        Parâmetros e Taxas
                      </span>
                      {expandParametros ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </h4>
                    {expandParametros && (
                      <div className="space-y-4 mt-3">
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
                        <div className="flex justify-end pt-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              setExpandParametros(false)
                              setExpandDetalhes(true)
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                          >
                            Avançar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-border pt-4">
                    <h4 
                      onClick={handleToggleDetalhes}
                      className="font-semibold text-xs text-foreground flex items-center justify-between gap-2 cursor-pointer select-none hover:text-indigo-500 transition-colors py-1"
                    >
                      <span className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        Detalhes do Serviço
                      </span>
                      {expandDetalhes ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </h4>
                    {expandDetalhes && (
                      <div className="space-y-4 mt-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs">Tipo de Serviço *</Label>
                            <Input
                              value={tipoServico}
                              onChange={(e) => setTipoServico(e.target.value)}
                              placeholder="Ex: Manutenção..."
                              className="h-9 border-border text-xs"
                              required
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

                        <div className="space-y-1.5 mt-2">
                          <Label className="text-xs">Descrição dos Detalhes</Label>
                          <Textarea
                            ref={detailsTextareaRef}
                            value={detalhesServico}
                            onChange={(e) => setDetalhesServico(e.target.value)}
                            placeholder="Descreva detalhadamente o escopo do serviço a ser executado..."
                            className="text-xs border-border bg-slate-50/50 dark:bg-slate-900/50 focus:bg-background transition-all focus-visible:ring-indigo-500 focus-visible:ring-offset-0 focus:border-indigo-500 min-h-[100px] resize-none overflow-hidden"
                          />
                        </div>
                        <div className="flex justify-end pt-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              setExpandDetalhes(false)
                              setExpandObservacoes(true)
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                          >
                            Avançar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Itens */}
              <Card className="border border-border bg-card">
                <CardHeader 
                  onClick={handleToggleItens}
                  className="bg-muted/40 border-b border-border p-4 cursor-pointer select-none hover:bg-muted/65 transition-colors"
                >
                  <div className="flex items-center justify-between w-full">
                    <CardTitle className="text-foreground text-sm flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      Itens do Orçamento
                      {!expandItens && itens.length > 0 && (
                        <Badge variant="secondary" className="font-semibold text-[10px] sm:text-xs ml-2 py-0 px-2">
                          {itens.length} {itens.length === 1 ? "item" : "itens"} ({formatCurrency(calcularValorMaterial() + calcularValorMaoObra())})
                        </Badge>
                      )}
                    </CardTitle>
                    {expandItens ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>
                {expandItens && (
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
                    <div className="space-y-2">
                      {itens.map((item, index) => (
                        <div
                          key={index}
                          draggable={false}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDrop={(e) => handleDrop(e, index)}
                          onClick={() => {
                            setExpandedIndex(expandedIndex === index ? null : index)
                          }}
                          className={cn(
                            "p-3 border rounded-xl bg-card text-foreground shadow-xs hover:shadow-sm transition-all cursor-pointer relative hover:border-indigo-400 dark:hover:border-indigo-500",
                            dragOverIndex === index && draggedIndex !== index ? "border-2 border-indigo-400" : "border-border",
                            draggedIndex === index ? "opacity-40" : "",
                            expandedIndex === index ? "border-indigo-400 dark:border-indigo-500 shadow-md bg-indigo-50/10 dark:bg-indigo-950/5" : ""
                          )}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div
                                draggable
                                onDragStart={(e) => {
                                  e.stopPropagation()
                                  handleDragStart(e, index)
                                }}
                                onDragEnd={(e) => {
                                  e.stopPropagation()
                                  handleDragEnd()
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="cursor-grab active:cursor-grabbing text-muted-foreground opacity-60 p-1 rounded hover:bg-muted shrink-0"
                                title="Arrastar para reordenar"
                              >
                                <GripVertical className="h-4 w-4" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                {expandedIndex === index ? (
                                  <span className="font-semibold text-xs text-foreground block break-words">{item.produto.descricao}</span>
                                ) : (
                                  <span className="font-medium text-xs text-foreground truncate block">{item.produto.descricao}</span>
                                )}
                                
                                {expandedIndex === index ? (
                                  <Badge variant="outline" className="text-[9px] py-0 px-1.5 font-mono mt-1 bg-muted/50 border-border text-muted-foreground">
                                    {item.produto.codigo}
                                  </Badge>
                                ) : (
                                  <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                                    <span className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-semibold text-foreground">
                                      Qtd: {item.quantidade}
                                    </span>
                                    <span>•</span>
                                    <span>Unit: {formatCurrency(item.valor_unitario)}</span>
                                    {item.valor_mao_obra > 0 && (
                                      <>
                                        <span>•</span>
                                        <span>MDO: {formatCurrency(item.valor_mao_obra)}</span>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <div className="text-right mr-1">
                                <span className="text-[9px] text-muted-foreground block uppercase tracking-wider">Subtotal</span>
                                <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400">{formatCurrency(item.valor_total)}</span>
                              </div>
                              
                              <div className="flex items-center gap-1.5">
                                <div className="text-muted-foreground opacity-60 p-1 hover:opacity-100" onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}>
                                  {expandedIndex === index ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                </div>

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removerItem(index)}
                                  className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 border border-transparent hover:border-red-200 dark:hover:border-red-900/30"
                                  title="Remover item"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Inputs editáveis exibidos ao expandir (Inline Edit) */}
                          {expandedIndex === index && (
                            <div
                              className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-border mt-2.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="space-y-0.5">
                                <Label className="text-[9px] text-muted-foreground">Quantidade</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={item.quantidade}
                                  onChange={(e) =>
                                    atualizarItem(index, "quantidade", Number.parseInt(e.target.value) || 1)
                                  }
                                  className="h-7 text-xs border-border"
                                />
                              </div>
                              <div className="space-y-0.5">
                                <Label className="text-[9px] text-muted-foreground">Valor Unitário (R$)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.valor_unitario}
                                  onChange={(e) =>
                                    atualizarItem(index, "valor_unitario", Number.parseFloat(e.target.value) || 0)
                                  }
                                  className="h-7 text-xs border-border"
                                />
                              </div>
                              <div className="space-y-0.5">
                                <Label className="text-[9px] text-muted-foreground">Mão de Obra (R$)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.valor_mao_obra}
                                  onChange={(e) =>
                                    atualizarItem(index, "valor_mao_obra", Number.parseFloat(e.target.value) || 0)
                                  }
                                  className="h-7 text-xs border-border"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 border border-dashed border-border rounded-lg">
                      <Package className="mx-auto h-8 w-8 text-muted-foreground opacity-50 mb-2" />
                      <p className="text-xs text-muted-foreground">Nenhum item adicionado</p>
                    </div>
                  )}
                </CardContent>
                )}
              </Card>

              {/* Observações */}
              <Card className="border border-border bg-card">
                <CardHeader 
                  onClick={handleToggleObservacoes}
                  className="bg-muted/40 border-b border-border p-4 cursor-pointer select-none hover:bg-muted/65 transition-colors"
                >
                  <div className="flex items-center justify-between w-full">
                    <CardTitle className="text-foreground text-sm">Observações</CardTitle>
                    {expandObservacoes ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>
                {expandObservacoes && (
                  <CardContent className="p-4">
                    <Textarea
                      placeholder="Digite observações sobre o orçamento..."
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      rows={2}
                      className="text-xs border-border bg-background"
                    />
                  </CardContent>
                )}
              </Card>
            </div>

            {/* Resumo */}
            <div className="space-y-6">
              <Card className="border border-border bg-muted/40 overflow-hidden sticky top-0">
                <CardHeader 
                  onClick={handleToggleResumo}
                  className="bg-muted border-b border-border p-4 cursor-pointer select-none hover:bg-muted/90 transition-colors"
                >
                  <div className="flex items-center justify-between w-full">
                    <CardTitle className="text-foreground text-sm flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-indigo-500" />
                      Resumo do Orçamento
                    </CardTitle>
                    {expandResumo ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  {!expandResumo && (
                    <div className="mt-4 pt-4 border-t border-border space-y-3 text-xs text-foreground font-normal">
                      <div className="flex items-center gap-2 font-semibold text-foreground mb-2">
                        <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span>Forma de Pagamento</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-muted-foreground">
                        <span>Mão de Obra:</span>
                        <span className="font-medium text-blue-600 dark:text-blue-400">
                          {parcelamentoMdo === 0
                            ? "Sem cobrança"
                            : parcelamentoMdo === 1
                              ? `À vista - ${formatCurrency(calcularSubtotalMdo())}`
                              : `${parcelamentoMdo}x de ${formatCurrency(calcularSubtotalMdo() / parcelamentoMdo)}`}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-muted-foreground">
                        <span>Material:</span>
                        <span className="font-medium text-blue-600 dark:text-blue-400">
                          {materialAVista
                            ? `À vista - ${formatCurrency(calcularSubtotalMaterial())}`
                            : parcelamentoMaterial === 0
                              ? "Sem cobrança"
                              : parcelamentoMaterial === 1
                                ? `1x - ${formatCurrency(calcularSubtotalMaterial())}`
                                : `${parcelamentoMaterial}x de ${formatCurrency(calcularSubtotalMaterial() / parcelamentoMaterial)}`}
                        </span>
                      </div>

                      <div className="border-t border-border my-2"></div>

                      <div className="flex justify-between items-center text-sm font-bold">
                        <span>Total:</span>
                        <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(calcularTotal())}</span>
                      </div>

                      <div className="border-t border-border my-2"></div>

                      <div className="space-y-2 pt-1 text-[11px] text-muted-foreground animate-in fade-in duration-200">
                        <div className="flex justify-between">
                          <span>Itens:</span>
                          <span className="text-foreground font-medium">{itens.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cliente:</span>
                          <span className="text-foreground font-medium truncate max-w-[200px]" title={cliente ? cliente.nome : ""}>
                            {cliente ? cliente.nome : "Não selecionado"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Validade:</span>
                          <span className="text-foreground font-medium">{validade} dias</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Situação:</span>
                          <Badge variant="outline" className="text-[10px] py-0 px-2 uppercase font-semibold">
                            {situacao === "pendente" && "Pendente"}
                            {situacao === "aprovado" && "Aprovado"}
                            {situacao === "enviado por email" && "Enviado por Email"}
                            {situacao === "nota fiscal emitida" && "Nota Fiscal Emitida"}
                            {situacao === "concluido" && "Concluído"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </CardHeader>
                {expandResumo && (
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
                )}
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
