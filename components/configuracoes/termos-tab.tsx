"use client"

import React, { useState, useEffect } from "react"
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
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RichTextEditor } from "@/components/rich-text-editor"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Edit, Trash2, Plus, Eye, Download, ChevronRight } from "lucide-react"
import { toast } from "sonner"

interface Termo {
  id: number
  tipo: "termo_uso" | "termo_privacidade" | "contrato_conservacao" | "contrato_servico" | "orcamento"
  titulo: string
  conteudo: string
  versao: string
  ativo: boolean
  obrigatorio: boolean
  created_at: string
  updated_at: string
}

const tiposTermos: Record<string, { label: string; icon: string; color: string }> = {
  termo_uso: { label: "Termos de Uso", icon: "📋", color: "blue" },
  termo_privacidade: { label: "Política de Privacidade", icon: "🔒", color: "green" },
  contrato_conservacao: { label: "Contrato de Conservação", icon: "🔧", color: "orange" },
  contrato_servico: { label: "Contrato de Serviços", icon: "⚙️", color: "purple" },
  orcamento: { label: "Orçamento", icon: "📝", color: "blue" },
}

const getTipoInfo = (tipo: string) => {
  return tiposTermos[tipo] || { label: "Desconhecido", icon: "❓", color: "gray" }
}

export function TermosTab() {
  const [termos, setTermos] = useState<Termo[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTermo, setEditingTermo] = useState<Termo | null>(null)
  const [viewingTermo, setViewingTermo] = useState<Termo | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [deletingTermo, setDeletingTermo] = useState<Termo | null>(null)

  useEffect(() => {
    carregarTermos()
  }, [])

  const carregarTermos = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/configuracoes/termos")
      const data = await response.json()

      if (data.success) {
        setTermos(data.data || [])
      } else {
        toast.error("Erro ao carregar termos e contratos")
      }
    } catch (error) {
      console.error("Erro ao carregar termos:", error)
      toast.error("Erro de conexão ao carregar termos")
    } finally {
      setLoading(false)
    }
  }

  const handleSalvar = async (termo: Partial<Termo>) => {
    try {
      const url = termo.id ? `/api/configuracoes/termos/${termo.id}` : "/api/configuracoes/termos"
      const method = termo.id ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(termo),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(termo.id ? "Termo atualizado com sucesso!" : "Termo criado com sucesso!")
        await carregarTermos()
        setEditingTermo(null)
        setIsDialogOpen(false)
      } else {
        toast.error(data.error || "Erro ao salvar termo")
      }
    } catch (error) {
      console.error("Erro ao salvar termo:", error)
      toast.error("Erro de conexão ao salvar termo")
    }
  }

  const handleRemover = async (id: number) => {
    try {
      const response = await fetch(`/api/configuracoes/termos/${id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Termo removido com sucesso!")
        await carregarTermos()
      } else {
        toast.error(data.error || "Erro ao remover termo")
      }
    } catch (error) {
      console.error("Erro ao remover termo:", error)
      toast.error("Erro de conexão ao remover termo")
    }
  }

  const handleExportar = (termo: Termo) => {
    const blob = new Blob([termo.conteudo], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${termo.titulo.replace(/[^a-zA-Z0-9]/g, "_")}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando termos e contratos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">📄 Termos e Contratos</h2>
          <p className="text-muted-foreground">Gerencie termos de uso, políticas e modelos de contratos</p>
        </div>
        <Sheet open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <SheetTrigger asChild>
            <Button onClick={() => setEditingTermo(null)} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Novo Termo/Contrato
            </Button>
          </SheetTrigger>
          <SheetContent className="bg-card text-foreground border-l border-border shadow-2xl w-full sm:max-w-3xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-foreground">{editingTermo ? "Editar Termo/Contrato" : "Novo Termo/Contrato"}</SheetTitle>
              <SheetDescription className="text-muted-foreground">
                {editingTermo ? "Edite as informações do termo ou contrato" : "Crie um novo termo ou contrato"}
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <TermoForm
                termo={editingTermo}
                onSalvar={handleSalvar}
                onCancelar={() => {
                  setEditingTermo(null)
                  setIsDialogOpen(false)
                }}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Tabs defaultValue="todos" className="w-full">
        <TabsList className="flex md:grid w-full md:grid-cols-6 overflow-x-auto whitespace-nowrap justify-start md:justify-center bg-muted/40 border border-border p-1 rounded-lg gap-1 md:gap-0 no-scrollbar">
          <TabsTrigger value="todos" className="flex-shrink-0 text-muted-foreground hover:text-foreground data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-400">Todos</TabsTrigger>
          <TabsTrigger value="termo_uso" className="flex-shrink-0 text-muted-foreground hover:text-foreground data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-400">Termos de Uso</TabsTrigger>
          <TabsTrigger value="termo_privacidade" className="flex-shrink-0 text-muted-foreground hover:text-foreground data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-400">Privacidade</TabsTrigger>
          <TabsTrigger value="contrato_conservacao" className="flex-shrink-0 text-muted-foreground hover:text-foreground data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-400">Conservação</TabsTrigger>
          <TabsTrigger value="contrato_servico" className="flex-shrink-0 text-muted-foreground hover:text-foreground data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-400">Serviços</TabsTrigger>
          <TabsTrigger value="orcamento" className="flex-shrink-0 text-muted-foreground hover:text-foreground data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-400">Orçamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="space-y-4">
          <TermosList
            termos={termos}
            onEditar={(termo) => {
              setEditingTermo(termo)
              setIsDialogOpen(true)
            }}
            onVisualizar={setViewingTermo}
            onRemover={setDeletingTermo}
            onExportar={handleExportar}
          />
        </TabsContent>

        {Object.keys(tiposTermos).map((tipo) => (
          <TabsContent key={tipo} value={tipo} className="space-y-4">
            <TermosList
              termos={termos.filter((t) => t.tipo === tipo)}
              onEditar={(termo) => {
                setEditingTermo(termo)
                setIsDialogOpen(true)
              }}
              onVisualizar={setViewingTermo}
              onRemover={setDeletingTermo}
              onExportar={handleExportar}
            />
          </TabsContent>
        ))}
      </Tabs>

      <Sheet open={!!viewingTermo} onOpenChange={() => setViewingTermo(null)}>
        <SheetContent className="bg-card text-foreground border-l border-border shadow-2xl w-full sm:max-w-3xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-foreground">
              {viewingTermo && getTipoInfo(viewingTermo.tipo).icon}
              {viewingTermo?.titulo}
            </SheetTitle>
            <SheetDescription className="text-muted-foreground">Visualização do termo ou contrato</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="flex gap-2">
              <Badge variant="outline" className="border-border text-muted-foreground">Versão {viewingTermo?.versao}</Badge>
              {viewingTermo?.obrigatorio && <Badge variant="destructive">Obrigatório</Badge>}
            </div>
            <div className="bg-background border border-border p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm text-foreground font-mono">{viewingTermo?.conteudo}</pre>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" className="border-border text-foreground hover:bg-muted bg-transparent" onClick={() => viewingTermo && handleExportar(viewingTermo)}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button onClick={() => setViewingTermo(null)} className="bg-purple-600 hover:bg-purple-700 text-white">Fechar</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deletingTermo} onOpenChange={(open) => !open && setDeletingTermo(null)}>
        <AlertDialogContent className="bg-card text-foreground border border-border shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Confirmar Remoção</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Tem certeza que deseja remover "{deletingTermo?.titulo}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-foreground hover:bg-muted bg-transparent">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingTermo) {
                  handleRemover(deletingTermo.id)
                  setDeletingTermo(null)
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function TermosList({
  termos,
  onEditar,
  onVisualizar,
  onRemover,
  onExportar,
}: {
  termos: Termo[]
  onEditar: (termo: Termo) => void
  onVisualizar: (termo: Termo) => void
  onRemover: (termo: Termo) => void
  onExportar: (termo: Termo) => void
}) {
  const [expandedTermoId, setExpandedTermoId] = useState<number | null>(null)

  if (termos.length === 0) {
    return (
      <Card className="border border-border bg-card">
        <CardContent className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Nenhum termo encontrado</h3>
          <p className="text-muted-foreground">Crie seu primeiro termo ou contrato</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* DESKTOP VIEW */}
      <div className="hidden md:grid gap-4">
        {termos.map((termo) => {
          const tipoInfo = getTipoInfo(termo.tipo)
          return (
            <Card key={termo.id} className="border border-border bg-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{tipoInfo.icon}</div>
                    <div>
                      <CardTitle className="text-lg text-foreground">{termo.titulo}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="border-border text-muted-foreground">{tipoInfo.label}</Badge>
                        <Badge variant="outline" className="border-border text-muted-foreground">v{termo.versao}</Badge>
                        {termo.obrigatorio && <Badge variant="destructive">Obrigatório</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-muted bg-transparent" onClick={() => onVisualizar(termo)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-muted bg-transparent" onClick={() => onExportar(termo)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-muted bg-transparent" onClick={() => onEditar(termo)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-400 hover:text-red-300 border-border bg-transparent hover:bg-red-500/10"
                      onClick={() => onRemover(termo)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">{termo.conteudo.substring(0, 200)}...</p>
                <p className="text-xs text-muted-foreground">
                  Atualizado em: {new Date(termo.updated_at).toLocaleDateString("pt-BR")}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* MOBILE VIEW */}
      <div className="md:hidden space-y-3">
        {termos.map((termo) => {
          const tipoInfo = getTipoInfo(termo.tipo)
          const isExpanded = expandedTermoId === termo.id
          return (
            <div
              key={termo.id}
              className={`rounded-xl border transition-all duration-200 overflow-hidden bg-card border-border ${
                isExpanded ? "shadow-lg ring-1 ring-purple-500/20 bg-muted/20" : "shadow-sm hover:shadow-md"
              }`}
            >
              <button
                type="button"
                onClick={() => setExpandedTermoId(prev => prev === termo.id ? null : termo.id)}
                className="w-full text-left p-3.5 flex items-center gap-3"
              >
                <div className="h-10 w-10 flex-shrink-0 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center text-lg">
                  {tipoInfo.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-sm text-foreground truncate block">
                    {termo.titulo}
                  </span>
                  <span className="text-[11px] text-muted-foreground block">
                    {tipoInfo.label} • v{termo.versao}
                  </span>
                </div>
                <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 flex-shrink-0 ${
                  isExpanded ? "rotate-90" : ""
                }`} />
              </button>

              {isExpanded && (
                <div className="px-3.5 pb-3.5 pt-0 animate-in slide-in-from-top-2 duration-200">
                  <div className="border-t border-border pt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-background border border-border rounded-lg p-2.5">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase block mb-0.5">Versão</span>
                        <p className="text-xs font-semibold text-foreground">v{termo.versao}</p>
                      </div>
                      <div className="bg-background border border-border rounded-lg p-2.5">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase block mb-0.5">Obrigatório</span>
                        <p className="text-xs font-semibold text-foreground">
                          {termo.obrigatorio ? "Sim" : "Não"}
                        </p>
                      </div>
                      <div className="bg-background border border-border rounded-lg p-2.5 col-span-2">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase block mb-0.5">Conteúdo (Prévia)</span>
                        <p className="text-xs text-muted-foreground line-clamp-3 break-all">
                          {termo.conteudo.replace(/<[^>]*>/g, "")}
                        </p>
                      </div>
                      <div className="bg-background border border-border rounded-lg p-2.5 col-span-2">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase block mb-0.5">Última Atualização</span>
                        <p className="text-xs text-muted-foreground">
                          {new Date(termo.updated_at).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Button variant="outline" size="sm" className="text-xs border-border text-foreground hover:bg-muted bg-transparent" onClick={() => onVisualizar(termo)}>
                        <Eye className="w-4 h-4 mr-2" />Visualizar
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs border-border text-foreground hover:bg-muted bg-transparent" onClick={() => onExportar(termo)}>
                        <Download className="w-4 h-4 mr-2" />Exportar
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs border-border text-foreground hover:bg-muted bg-transparent" onClick={() => onEditar(termo)}>
                        <Edit className="w-4 h-4 mr-2" />Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs hover:bg-red-500/10 text-red-400 border-border bg-transparent"
                        onClick={() => onRemover(termo)}
                      >
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
    </div>
  )
}

function TermoForm({
  termo,
  onSalvar,
  onCancelar,
}: {
  termo: Termo | null
  onSalvar: (termo: Partial<Termo>) => void
  onCancelar: () => void
}) {
  const [formData, setFormData] = useState({
    tipo: termo?.tipo || "termo_uso",
    titulo: termo?.titulo || "",
    conteudo: termo?.conteudo || "",
    versao: termo?.versao || "1.0",
    obrigatorio: termo?.obrigatorio || false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.titulo || !formData.conteudo) {
      toast.error("Título e conteúdo são obrigatórios")
      return
    }

    onSalvar({
      ...formData,
      id: termo?.id,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tipo" className="text-muted-foreground">Tipo</Label>
          <select
            id="tipo"
            value={formData.tipo}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, tipo: e.target.value as any })}
            className="w-full p-2 border rounded-md bg-background border-border text-foreground"
            disabled={!!termo}
          >
            {Object.entries(tiposTermos).map(([key, value]) => (
              <option key={key} value={key} className="bg-card text-foreground">
                {value.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="versao" className="text-muted-foreground">Versão</Label>
          <Input
            id="versao"
            value={formData.versao}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, versao: e.target.value })}
            placeholder="1.0"
            className="bg-background border-border text-foreground"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="titulo" className="text-muted-foreground">Título</Label>
        <Input
          id="titulo"
          value={formData.titulo}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, titulo: e.target.value })}
          placeholder="Digite o título do termo/contrato"
          required
          className="bg-background border-border text-foreground"
        />
      </div>

      <div className="flex items-center space-x-2 py-2">
        <Switch
          id="obrigatorio"
          checked={formData.obrigatorio}
          onCheckedChange={(checked: boolean) => setFormData({ ...formData, obrigatorio: checked })}
        />
        <Label htmlFor="obrigatorio" className="text-muted-foreground cursor-pointer">Obrigatório para criação de contas</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="conteudo" className="text-muted-foreground">Conteúdo</Label>
        <div className="border border-border rounded-md bg-background text-foreground overflow-hidden">
          <RichTextEditor
            value={formData.conteudo}
            onChange={(value: string) => setFormData({ ...formData, conteudo: value })}
            placeholder="Digite o conteúdo do termo/contrato. Use as variáveis disponíveis como [EMPRESA_NOME], [CLIENTE_NOME], etc."
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Você pode usar HTML e variáveis como [EMPRESA_NOME], [CLIENTE_NOME], [ORCAMENTO_NUMERO], etc.
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" className="border-border text-foreground hover:bg-muted bg-transparent" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">{termo ? "Atualizar" : "Criar"}</Button>
      </div>
    </form>
  )
}
