"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ResizableTable } from "@/components/ui/resizable-table"
import { Plus, Edit, Trash2, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Equipamento {
  id: number
  nome: string
  categoria: string
  valor_hora: number
  descricao?: string
  ativo: boolean
}

const CATEGORIAS = [
  { value: "basicos", label: "Básicos" },
  { value: "portoes_veiculos", label: "Portões de Veículos" },
  { value: "portoes_pedestre", label: "Portões de Pedestre" },
  { value: "software_redes", label: "Software e Redes" },
]

export function EquipamentosTab() {
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [loading, setLoading] = useState(true)
  const [salarioMinimo, setSalarioMinimo] = useState<string>("1412.00")
  const [salvandoSalario, setSalvandoSalario] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEquipamento, setEditingEquipamento] = useState<Equipamento | null>(null)
  const [expandedEquipamentoId, setExpandedEquipamentoId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    categoria: "basicos",
    valor_hora: "",
    descricao: "",
  })

  useEffect(() => {
    carregarEquipamentos()
  }, [])

  const carregarSalarioMinimo = async () => {
    try {
      const response = await fetch("/api/configuracoes/equipamentos/salario-minimo")
      if (response.ok) {
        const res = await response.json()
        if (res.success) {
          setSalarioMinimo(String(res.salario_minimo))
        }
      }
    } catch (error) {
      console.error("Erro ao carregar salário mínimo:", error)
    }
  }

  const carregarEquipamentos = async () => {
    try {
      const response = await fetch("/api/configuracoes/equipamentos")
      if (response.ok) {
        const data = await response.json()
        setEquipamentos(Array.isArray(data) ? data : [])
      }
      await carregarSalarioMinimo()
    } catch (error) {
      console.error("Erro ao carregar equipamentos:", error)
      toast.error("Erro ao carregar equipamentos")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSalarioMinimo = async () => {
    if (!salarioMinimo || isNaN(Number(salarioMinimo))) {
      toast.error("Insira um valor numérico válido para o salário mínimo")
      return
    }
    setSalvandoSalario(true)
    try {
      const response = await fetch("/api/configuracoes/equipamentos/salario-minimo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salario_minimo: Number(salarioMinimo) }),
      })
      if (response.ok) {
        toast.success("Salário mínimo atualizado!")
      } else {
        toast.error("Erro ao salvar salário mínimo")
      }
    } catch (error) {
      console.error("Erro ao salvar salário mínimo:", error)
      toast.error("Erro ao salvar salário mínimo")
    } finally {
      setSalvandoSalario(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nome || !formData.categoria || !formData.valor_hora) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }

    try {
      const url = editingEquipamento
        ? `/api/configuracoes/equipamentos/${editingEquipamento.id}`
        : "/api/configuracoes/equipamentos"

      const method = editingEquipamento ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: formData.nome,
          categoria: formData.categoria,
          valor_hora: Number.parseFloat(formData.valor_hora),
          descricao: formData.descricao || null,
        }),
      })

      if (response.ok) {
        toast.success(editingEquipamento ? "Equipamento atualizado!" : "Equipamento criado!")
        setDialogOpen(false)
        resetForm()
        carregarEquipamentos()
      } else {
        toast.error("Erro ao salvar equipamento")
      }
    } catch (error) {
      console.error("Erro ao salvar equipamento:", error)
      toast.error("Erro ao salvar equipamento")
    }
  }

  const handleEdit = (equipamento: Equipamento) => {
    setEditingEquipamento(equipamento)
    setFormData({
      nome: equipamento.nome,
      categoria: equipamento.categoria,
      valor_hora: equipamento.valor_hora.toString(),
      descricao: equipamento.descricao || "",
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este equipamento?")) {
      return
    }

    try {
      const response = await fetch(`/api/configuracoes/equipamentos/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Equipamento excluído!")
        carregarEquipamentos()
      } else {
        toast.error("Erro ao excluir equipamento")
      }
    } catch (error) {
      console.error("Erro ao excluir equipamento:", error)
      toast.error("Erro ao excluir equipamento")
    }
  }

  const resetForm = () => {
    setFormData({ nome: "", categoria: "basicos", valor_hora: "", descricao: "" })
    setEditingEquipamento(null)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const getCategoriaLabel = (categoria: string) => {
    const cat = CATEGORIAS.find((c) => c.value === categoria)
    return cat ? cat.label : categoria
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando equipamentos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Seção do Salário Mínimo */}
      <Card className="border border-border bg-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="salario_minimo_config" className="text-sm font-semibold text-foreground">Salário Mínimo Vigente</Label>
              <p className="text-xs text-muted-foreground">Define o salário base utilizado para cálculo de propostas de contratos.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative max-w-[200px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">R$</span>
                <Input
                  id="salario_minimo_config"
                  type="number"
                  step="0.01"
                  min="0"
                  value={salarioMinimo}
                  onChange={(e) => setSalarioMinimo(e.target.value)}
                  className="pl-8 h-9 text-sm border-border bg-background text-foreground"
                />
              </div>
              <Button
                onClick={handleSaveSalarioMinimo}
                disabled={salvandoSalario}
                className="bg-purple-600 hover:bg-purple-700 text-white h-9 px-4 text-xs font-semibold"
              >
                {salvandoSalario ? "Salvando..." : "Salvar Salário"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-foreground">Equipamentos</h3>
        <Sheet open={dialogOpen} onOpenChange={setDialogOpen}>
          <SheetTrigger asChild>
            <Button onClick={resetForm} className="bg-purple-600 hover:bg-purple-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Novo Equipamento
            </Button>
          </SheetTrigger>
          <SheetContent className="bg-card text-foreground border-l border-border shadow-2xl w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle className="text-foreground">{editingEquipamento ? "Editar Equipamento" : "Novo Equipamento"}</SheetTitle>
              <SheetDescription className="text-muted-foreground">
                {editingEquipamento
                  ? "Altere as informações do equipamento abaixo."
                  : "Preencha as informações para criar um novo equipamento."}
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-muted-foreground">Nome do Equipamento *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Sistema de Interfones"
                  required
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoria" className="text-muted-foreground">Categoria *</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    {CATEGORIAS.map((categoria) => (
                      <SelectItem key={categoria.value} value={categoria.value}>
                        {categoria.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="valor_hora" className="text-muted-foreground">Valor por Hora (R$) *</Label>
                <Input
                  id="valor_hora"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor_hora}
                  onChange={(e) => setFormData({ ...formData, valor_hora: e.target.value })}
                  placeholder="0.00"
                  required
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao" className="text-muted-foreground">Descrição</Label>
                <Input
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição opcional do equipamento"
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" className="border-border text-foreground hover:bg-muted bg-transparent" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">{editingEquipamento ? "Atualizar" : "Criar"}</Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Lista de Equipamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {equipamentos.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">Nenhum equipamento cadastrado</p>
          ) : (
            <>
              {/* DESKTOP VIEW */}
              <div className="hidden md:block">
                <ResizableTable<Equipamento>
                  storageKey="config-equipamentos"
                  columns={[
                    { key: "nome",       label: "Nome",           width: 200, sortable: true },
                    { key: "categoria",  label: "Categoria",       width: 160, sortable: true },
                    { key: "valor_hora", label: "Valor por Hora",  width: 130, sortable: true },
                    { key: "descricao",  label: "Descrição",        width: 220, sortable: false },
                    { key: "acoes",      label: "Ações",           width: 90,  sortable: false, noResize: true, align: "right" },
                  ]}
                  data={equipamentos.filter((eq) => eq.ativo)}
                  rowKey={(row) => row.id}
                  renderCell={(equipamento, col) => {
                    switch (col) {
                      case "nome": return <span className="font-medium text-foreground">{equipamento.nome}</span>
                      case "categoria": return <span className="text-muted-foreground">{getCategoriaLabel(equipamento.categoria)}</span>
                      case "valor_hora": return <span className="text-foreground">{formatCurrency(equipamento.valor_hora)}</span>
                      case "descricao": return <span className="truncate max-w-xs text-muted-foreground">{equipamento.descricao || "-"}</span>
                      case "acoes":
                        return (
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-muted bg-transparent" onClick={() => handleEdit(equipamento)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-muted bg-transparent" onClick={() => handleDelete(equipamento.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )
                      default: return null
                    }
                  }}
                />
              </div>

              {/* MOBILE VIEW */}
              <div className="md:hidden space-y-3">
                {equipamentos.filter((eq) => eq.ativo).map((equipamento) => {
                  const isExpanded = expandedEquipamentoId === equipamento.id
                  return (
                    <div
                      key={equipamento.id}
                      className={`rounded-xl border transition-all duration-200 overflow-hidden bg-card border-border ${
                        isExpanded ? "shadow-lg ring-1 ring-purple-500/20 bg-muted/20" : "shadow-sm hover:shadow-md"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedEquipamentoId(prev => prev === equipamento.id ? null : equipamento.id)}
                        className="w-full text-left p-3.5 flex items-center gap-3"
                      >
                        <div className="h-10 w-10 flex-shrink-0 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center text-sm font-bold">
                          {equipamento.nome.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-sm text-foreground truncate block">
                            {equipamento.nome}
                          </span>
                          <span className="text-[11px] text-muted-foreground block">
                            {getCategoriaLabel(equipamento.categoria)}
                          </span>
                        </div>
                        <div className="text-right flex-shrink-0 mr-1">
                          <div className="text-sm font-bold text-purple-400">{formatCurrency(equipamento.valor_hora)}/h</div>
                        </div>
                        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 flex-shrink-0 ${
                          isExpanded ? "rotate-90" : ""
                        }`} />
                      </button>

                      {isExpanded && (
                        <div className="px-3.5 pb-3.5 pt-0 animate-in slide-in-from-top-2 duration-200">
                          <div className="border-t border-border pt-3 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-background border border-border rounded-lg p-2.5">
                                <span className="text-[10px] font-medium text-muted-foreground uppercase block mb-0.5">Valor por Hora</span>
                                <p className="text-xs font-semibold text-purple-400">{formatCurrency(equipamento.valor_hora)}</p>
                              </div>
                              <div className="bg-background border border-border rounded-lg p-2.5">
                                <span className="text-[10px] font-medium text-muted-foreground uppercase block mb-0.5">Categoria</span>
                                <p className="text-xs text-foreground">{getCategoriaLabel(equipamento.categoria)}</p>
                              </div>
                              {equipamento.descricao && (
                                <div className="bg-background border border-border rounded-lg p-2.5 col-span-2">
                                  <span className="text-[10px] font-medium text-muted-foreground uppercase block mb-0.5">Descrição</span>
                                  <p className="text-xs text-foreground">{equipamento.descricao}</p>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2 pt-2">
                              <Button variant="outline" size="sm" className="flex-1 text-xs border-border text-foreground hover:bg-muted bg-transparent" onClick={() => handleEdit(equipamento)}>
                                <Edit className="w-4 h-4 mr-2" />Editar
                              </Button>
                              <Button variant="outline" size="sm" className="flex-1 text-xs border-border hover:bg-red-500/10 text-red-400 bg-transparent" onClick={() => handleDelete(equipamento.id)}>
                                <Trash2 className="w-4 h-4 mr-2" />Excluir
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
