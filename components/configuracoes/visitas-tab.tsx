"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResizableTable } from "@/components/ui/resizable-table"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Plus, Edit, Trash2, Save, ChevronRight } from "lucide-react"
import { toast } from "sonner"

interface VisitaConfig {
  quantidade_visitas: number
  percentual_desconto: number
}

export function VisitasTab() {
  const [configs, setConfigs] = useState<VisitaConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [expandedVisitaIndex, setExpandedVisitaIndex] = useState<number | null>(null)
  const [novaConfig, setNovaConfig] = useState({
    quantidade_visitas: 1,
    percentual_desconto: 0,
  })

  useEffect(() => {
    carregarConfigs()
  }, [])

  const carregarConfigs = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/configuracoes/visitas-tecnicas")
      const data = await response.json()

      console.log("Dados carregados:", data)

      if (data.success) {
        setConfigs(data.data || [])
      } else {
        console.error("Erro na resposta:", data)
        toast.error("Erro ao carregar configurações")
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error)
      toast.error("Erro ao carregar configurações")
    } finally {
      setLoading(false)
    }
  }

  const salvarConfigs = async (novasConfigs: VisitaConfig[]) => {
    try {
      setSaving(true)

      console.log("Salvando configurações:", novasConfigs)

      const response = await fetch("/api/configuracoes/visitas-tecnicas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configs: novasConfigs }),
      })

      const data = await response.json()
      console.log("Resposta do servidor:", data)

      if (data.success) {
        toast.success("Configurações salvas com sucesso!")
        await carregarConfigs() // Recarregar dados do servidor
        return true
      } else {
        console.error("Erro na resposta:", data)
        toast.error(data.error || "Erro ao salvar configurações")
        return false
      }
    } catch (error) {
      console.error("Erro ao salvar:", error)
      toast.error("Erro ao salvar configurações")
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleAdicionar = async () => {
    // Validações
    if (novaConfig.quantidade_visitas < 1) {
      toast.error("Quantidade de visitas deve ser maior que zero")
      return
    }

    if (novaConfig.percentual_desconto < 0 || novaConfig.percentual_desconto > 100) {
      toast.error("Percentual de desconto deve estar entre 0 e 100")
      return
    }

    // Verificar se já existe configuração para esta quantidade
    if (configs.some((config) => config.quantidade_visitas === novaConfig.quantidade_visitas)) {
      toast.error("Já existe uma configuração para esta quantidade de visitas")
      return
    }

    const novasConfigs = [...configs, novaConfig].sort((a, b) => a.quantidade_visitas - b.quantidade_visitas)

    const sucesso = await salvarConfigs(novasConfigs)
    if (sucesso) {
      setDialogOpen(false)
      setNovaConfig({ quantidade_visitas: getProximaQuantidade(), percentual_desconto: 0 })
    }
  }

  const getProximaQuantidade = () => {
    if (configs.length === 0) return 1
    const maxQuantidade = Math.max(...configs.map((c) => c.quantidade_visitas))
    return maxQuantidade + 1
  }

  const handleEditar = (index: number) => {
    setEditingIndex(index)
    setNovaConfig(configs[index])
    setDialogOpen(true)
  }

  const handleSalvarEdicao = async () => {
    if (editingIndex === null) return

    // Validações
    if (novaConfig.quantidade_visitas < 1) {
      toast.error("Quantidade de visitas deve ser maior que zero")
      return
    }

    if (novaConfig.percentual_desconto < 0 || novaConfig.percentual_desconto > 100) {
      toast.error("Percentual de desconto deve estar entre 0 e 100")
      return
    }

    // Verificar se já existe outra configuração com a mesma quantidade (exceto a atual)
    const existeOutra = configs.some(
      (config, index) => index !== editingIndex && config.quantidade_visitas === novaConfig.quantidade_visitas,
    )

    if (existeOutra) {
      toast.error("Já existe uma configuração para esta quantidade de visitas")
      return
    }

    const novasConfigs = [...configs]
    novasConfigs[editingIndex] = novaConfig
    novasConfigs.sort((a, b) => a.quantidade_visitas - b.quantidade_visitas)

    const sucesso = await salvarConfigs(novasConfigs)
    if (sucesso) {
      setDialogOpen(false)
      setEditingIndex(null)
      setNovaConfig({ quantidade_visitas: getProximaQuantidade(), percentual_desconto: 0 })
    }
  }

  const handleRemover = async (index: number) => {
    const novasConfigs = configs.filter((_, i) => i !== index)
    const sucesso = await salvarConfigs(novasConfigs)
    if (sucesso) {
      toast.success("Configuração removida com sucesso!")
    }
  }

  const fecharDialog = () => {
    setDialogOpen(false)
    setEditingIndex(null)
    setNovaConfig({ quantidade_visitas: getProximaQuantidade(), percentual_desconto: 0 })
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">📋 Visitas Técnicas</h2>
          <p className="text-muted-foreground">Configure os percentuais de desconto por quantidade de visitas</p>
        </div>
        <Sheet open={dialogOpen} onOpenChange={setDialogOpen}>
          <SheetTrigger asChild>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => {
                setEditingIndex(null)
                setNovaConfig({ quantidade_visitas: getProximaQuantidade(), percentual_desconto: 0 })
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </SheetTrigger>
          <SheetContent className="bg-card text-foreground border-l border-border shadow-2xl w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle className="text-foreground">{editingIndex !== null ? "Editar Configuração" : "Adicionar Configuração"}</SheetTitle>
              <SheetDescription className="text-muted-foreground">
                {editingIndex !== null
                  ? "Edite os dados da configuração de visita técnica."
                  : "Adicione uma nova configuração de desconto por quantidade de visitas."}
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="quantidade" className="text-muted-foreground">Quantidade de Visitas</Label>
                <Input
                  id="quantidade"
                  type="number"
                  min="1"
                  value={novaConfig.quantidade_visitas}
                  onChange={(e) =>
                    setNovaConfig({
                      ...novaConfig,
                      quantidade_visitas: Number(e.target.value),
                    })
                  }
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="percentual" className="text-muted-foreground">Percentual de Desconto (%)</Label>
                <Input
                  id="percentual"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={novaConfig.percentual_desconto}
                  onChange={(e) =>
                    setNovaConfig({
                      ...novaConfig,
                      percentual_desconto: Number(e.target.value),
                    })
                  }
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" className="border-border text-foreground hover:bg-muted bg-transparent" onClick={fecharDialog}>
                  Cancelar
                </Button>
                <Button onClick={editingIndex !== null ? handleSalvarEdicao : handleAdicionar} disabled={saving} className="bg-purple-600 hover:bg-purple-700 text-white">
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingIndex !== null ? "Salvar" : "Adicionar"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Card className="border border-border bg-card text-foreground">
        <CardContent className="p-0">
          {/* DESKTOP VIEW */}
          <div className="hidden md:block">
            <ResizableTable<VisitaConfig>
              storageKey="config-visitas"
              columns={[
                { key: "quantidade_visitas",  label: "Quantidade de Visitas",   width: 200, sortable: true },
                { key: "percentual_desconto", label: "Percentual de Desconto",  width: 180, sortable: true },
                { key: "acoes",              label: "Ações",                  width: 100, sortable: false, noResize: true, align: "center" },
              ]}
              data={configs}
              rowKey={(row, idx) => `${row.quantidade_visitas}-${idx}`}
              emptyState={
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma configuração encontrada<br />
                  <span className="text-sm">Clique em "Adicionar" para criar sua primeira configuração</span>
                </div>
              }
              renderCell={(config, col, idx) => {
                switch (col) {
                  case "quantidade_visitas":
                    return <span className="font-medium text-foreground">{config.quantidade_visitas} {config.quantidade_visitas === 1 ? "visita" : "visitas"}</span>
                  case "percentual_desconto":
                    return <span className="text-purple-400 font-medium">{config.percentual_desconto}%</span>
                  case "acoes":
                    return (
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="sm" className="border border-border text-foreground hover:bg-muted bg-transparent" onClick={() => handleEditar(idx)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="border border-border text-foreground hover:bg-muted bg-transparent"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-card text-foreground border border-border shadow-2xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-foreground">Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription className="text-muted-foreground">
                                Tem certeza que deseja remover a configuração para {config.quantidade_visitas} {config.quantidade_visitas === 1 ? "visita" : "visitas"}?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-border text-foreground hover:bg-muted bg-transparent">Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleRemover(idx)} className="bg-red-600 hover:bg-red-700 text-white">Remover</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )
                  default: return null
                }
              }}
            />
          </div>

          {/* MOBILE VIEW */}
          <div className="md:hidden space-y-3 p-4">
            {configs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma configuração encontrada<br />
                <span className="text-sm">Clique em "Adicionar" para criar sua primeira configuração</span>
              </div>
            ) : (
              configs.map((config, idx) => {
                const isExpanded = expandedVisitaIndex === idx
                return (
                  <div
                    key={`${config.quantidade_visitas}-${idx}`}
                    className={`rounded-xl border transition-all duration-200 overflow-hidden bg-card border-border ${
                      isExpanded ? "shadow-lg ring-1 ring-purple-500/20 bg-muted/20" : "shadow-sm hover:shadow-md"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedVisitaIndex(prev => prev === idx ? null : idx)}
                      className="w-full text-left p-3.5 flex items-center gap-3"
                    >
                      <div className="h-10 w-10 flex-shrink-0 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center font-bold text-sm">
                        V{config.quantidade_visitas}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-sm text-foreground truncate block">
                          {config.quantidade_visitas} {config.quantidade_visitas === 1 ? "visita" : "visitas"}
                        </span>
                        <span className="text-[11px] text-muted-foreground block">
                          Desconto aplicado
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0 mr-1">
                        <span className="text-sm font-bold text-purple-400">{config.percentual_desconto}%</span>
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
                              <span className="text-[10px] font-medium text-muted-foreground uppercase block mb-0.5">Visitas</span>
                              <p className="text-xs font-semibold text-foreground">{config.quantidade_visitas}</p>
                            </div>
                            <div className="bg-background border border-border rounded-lg p-2.5">
                              <span className="text-[10px] font-medium text-muted-foreground uppercase block mb-0.5">Desconto</span>
                              <p className="text-xs font-semibold text-purple-400">{config.percentual_desconto}%</p>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button variant="outline" size="sm" className="flex-1 text-xs border-border text-foreground hover:bg-muted bg-transparent" onClick={() => handleEditar(idx)}>
                              <Edit className="w-4 h-4 mr-2" />Editar
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="flex-1 text-xs border-border hover:bg-red-500/10 text-red-400 bg-transparent">
                                  <Trash2 className="h-4 w-4 mr-2" />Remover
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-card text-foreground border border-border shadow-2xl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-foreground">Confirmar exclusão</AlertDialogTitle>
                                  <AlertDialogDescription className="text-muted-foreground">
                                    Tem certeza que deseja remover a configuração para {config.quantidade_visitas} {config.quantidade_visitas === 1 ? "visita" : "visitas"}?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="border-border text-foreground hover:bg-muted bg-transparent">Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleRemover(idx)} className="bg-red-600 hover:bg-red-700 text-white">Remover</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {configs.length > 0 && (
        <Card className="border border-border bg-card">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2 text-foreground">Como funciona:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• O desconto é aplicado automaticamente nos orçamentos</li>
              <li>• Baseado na quantidade de visitas técnicas necessárias</li>
              <li>• Percentual aplicado sobre o valor total dos equipamentos</li>
              <li>• Cada quantidade de visitas pode ter apenas um percentual</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
