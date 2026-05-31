"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Save, Loader2, Calculator, Lock, Package } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { MarcaCombobox } from "@/components/marca-combobox"

interface Categoria {
  id: string
  codigo: string
  nome: string
}

interface EditarProdutoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  produto: any
}

export function EditarProdutoDialog({ open, onOpenChange, onSuccess, produto }: EditarProdutoDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [formData, setFormData] = useState({
    descricao: "",
    tipo: "",
    marca: "Nenhuma marca",
    ncm: "",
    unidade: "UN",
    valor_unitario: "0.00",
    valor_mao_obra: "180.00",
    valor_custo: "0.00",
    margem_lucro: "30",
    estoque: "0",
    estoque_minimo: "1",
    observacoes: "",
    ativo: true,
  })

  // Load product details when dialog opens
  useEffect(() => {
    if (open && produto) {
      setFormData({
        descricao: produto.descricao || "",
        tipo: produto.tipo || produto.categoria_nome || "Nenhuma categoria",
        marca: produto.marca || produto.marca_nome || "Nenhuma marca",
        ncm: produto.ncm || "",
        unidade: produto.unidade || "UN",
        valor_unitario: (produto.valor_unitario || 0).toFixed(2),
        valor_mao_obra: (produto.valor_mao_obra || 0).toFixed(2),
        valor_custo: (produto.valor_custo || 0).toFixed(2),
        margem_lucro: (produto.margem_lucro || 0).toString(),
        estoque: (produto.estoque || 0).toString(),
        estoque_minimo: (produto.estoque_minimo || 0).toString(),
        observacoes: produto.observacoes || "",
        ativo: produto.ativo !== false,
      })
      fetchCategorias()
    }
  }, [open, produto])

  // Automatic calculation of unit value
  const calcularValorUnitario = (valorCusto: string, margemLucro: string): string => {
    const custo = Number.parseFloat(valorCusto) || 0
    const margem = Number.parseFloat(margemLucro) || 0
    if (custo === 0) return "0.00"
    const valorComMargem = custo * (1 + margem / 100)
    return valorComMargem.toFixed(2)
  }

  useEffect(() => {
    const novoValorUnitario = calcularValorUnitario(formData.valor_custo, formData.margem_lucro)
    setFormData((prev) => ({ ...prev, valor_unitario: novoValorUnitario }))
  }, [formData.valor_custo, formData.margem_lucro])

  const isServicoCategory =
    categorias.find((c) => c.nome === formData.tipo)?.codigo?.toLowerCase() === "serv" ||
    categorias.find((c) => c.nome === formData.tipo)?.codigo?.toLowerCase() === "servicos"

  const fetchCategorias = async () => {
    try {
      const response = await fetch("/api/categorias?limit=100")
      const result = await response.json()
      if (result.success) {
        const categoriasValidas = (result.data || []).filter(
          (cat: Categoria) => cat && cat.nome && cat.nome.trim() !== "" && cat.nome !== "0" && cat.nome.toLowerCase() !== "serviços" && cat.nome.toLowerCase() !== "servicos",
        )
        setCategorias(categoriasValidas)
      }
    } catch (error) {
      console.error("Erro ao buscar categorias:", error)
      setCategorias([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.descricao.trim()) {
      toast({
        title: "Erro",
        description: "Descrição é obrigatória",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const dadosParaEnvio = {
        descricao: formData.descricao.trim(),
        tipo: formData.tipo,
        marca: isServicoCategory ? null : formData.marca !== "Nenhuma marca" ? formData.marca : null,
        ncm: formData.ncm.trim(),
        unidade: formData.unidade,
        valor_unitario: Number.parseFloat(formData.valor_unitario) || 0,
        valor_mao_obra: Number.parseFloat(formData.valor_mao_obra) || 0,
        valor_custo: Number.parseFloat(formData.valor_custo) || 0,
        margem_lucro: Number.parseFloat(formData.margem_lucro) || 0,
        estoque: Number.parseFloat(formData.estoque) || 0,
        estoque_minimo: Number.parseFloat(formData.estoque_minimo) || 0,
        observacoes: formData.observacoes.trim(),
        ativo: formData.ativo,
      }

      const response = await fetch(`/api/produtos/${produto.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dadosParaEnvio),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Produto atualizado com sucesso!",
        })
        onOpenChange(false)
        if (onSuccess) onSuccess()
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao atualizar produto",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao atualizar produto:", error)
      toast({
        title: "Erro",
        description: "Erro interno do servidor",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl h-full flex flex-col p-6 overflow-y-auto border-l border-border shadow-2xl bg-card text-foreground">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Editar Produto
          </SheetTitle>
          <SheetDescription>Atualize as informações do produto no sistema</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2 flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            {produto && (
              <div className="flex items-center gap-2 p-3 bg-muted/40 rounded-lg border border-border">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Código fixo:</span>
                <span className="font-mono font-bold text-foreground text-sm">{produto.codigo}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="descricao" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descrição *</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição do produto"
                required
                rows={2}
                className="resize-none border-border bg-background"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="categoria" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Categoria *</Label>
                <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                  <SelectTrigger className="h-9 border-border bg-background text-xs">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((categoria) => (
                      <SelectItem key={`categoria-${categoria.id}`} value={categoria.nome}>
                        {categoria.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="marca" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Marca</Label>
                <MarcaCombobox
                  value={formData.marca}
                  onValueChange={(value) => setFormData({ ...formData, marca: value })}
                  placeholder="Selecione..."
                  disabled={isServicoCategory}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="unidade" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unidade</Label>
                <Select
                  value={formData.unidade}
                  onValueChange={(value) => setFormData({ ...formData, unidade: value })}
                >
                  <SelectTrigger className="h-9 border-border bg-background text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UN">Unidade</SelectItem>
                    <SelectItem value="MT">Metro</SelectItem>
                    <SelectItem value="PC">Peça</SelectItem>
                    <SelectItem value="PCT">Pacote</SelectItem>
                    <SelectItem value="CJ">Conjunto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ncm" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">NCM</Label>
                <Input
                  id="ncm"
                  value={formData.ncm}
                  onChange={(e) => setFormData({ ...formData, ncm: e.target.value })}
                  placeholder="Código NCM"
                  className="h-9 border-border bg-background text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="valor_custo" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Custo (R$) *</Label>
                <Input
                  id="valor_custo"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor_custo}
                  onChange={(e) => setFormData({ ...formData, valor_custo: e.target.value })}
                  placeholder="0,00"
                  required
                  className="h-9 border-border bg-background text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="margem_lucro" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Margem (%)</Label>
                <Input
                  id="margem_lucro"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.margem_lucro}
                  onChange={(e) => setFormData({ ...formData, margem_lucro: e.target.value })}
                  placeholder="30"
                  className="h-9 border-border bg-background text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="valor_unitario" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  Venda (R$) <Calculator className="h-3 w-3 opacity-60" />
                </Label>
                <Input
                  id="valor_unitario"
                  type="text"
                  value={`R$ ${formData.valor_unitario}`}
                  disabled
                  className="bg-muted text-muted-foreground cursor-not-allowed h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="valor_mao_obra" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mão de Obra (R$)</Label>
                <Input
                  id="valor_mao_obra"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor_mao_obra}
                  onChange={(e) => setFormData({ ...formData, valor_mao_obra: e.target.value })}
                  placeholder="180,00"
                  className="h-9 border-border bg-background text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="estoque" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estoque Atual</Label>
                <Input
                  id="estoque"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.estoque}
                  onChange={(e) => setFormData({ ...formData, estoque: e.target.value })}
                  placeholder="0"
                  className="h-9 border-border bg-background text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="estoque_minimo" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mínimo</Label>
                <Input
                  id="estoque_minimo"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.estoque_minimo}
                  onChange={(e) => setFormData({ ...formData, estoque_minimo: e.target.value })}
                  placeholder="1"
                  className="h-9 border-border bg-background text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="observacoes" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Detalhes..."
                rows={2}
                className="resize-none border-border bg-background text-xs"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
              />
              <Label htmlFor="ativo" className="text-xs font-semibold cursor-pointer">
                Produto ativo
              </Label>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4 mt-auto border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="flex-1 h-10">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white h-10"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
