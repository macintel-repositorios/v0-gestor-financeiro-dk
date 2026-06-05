"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ResizableTable } from "@/components/ui/resizable-table"
import {
  Search,
  Package,
  Tag,
  Award,
  Edit,
  Plus,
  AlertTriangle,
  CheckCircle,
  Wrench,
  X,
  ChevronRight,
  FileText,
  Check,
  ChevronsUpDown,
  MoreHorizontal,
  Trash2
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ProdutoDeleteDialog } from "@/components/produto-delete-dialog"
import { CategoriaDeleteDialog } from "@/components/categoria-delete-dialog"
import { MarcaDeleteDialog } from "@/components/marca-delete-dialog"
import { EditarServicoDialog } from "@/components/editar-servico-dialog"
import { formatCurrency, cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

// Side Sheets
import { NovoProdutoDialog } from "@/components/produtos/novo-produto-dialog"
import { NovoServicoDialog } from "@/components/produtos/novo-servico-dialog"
import { NovaCategoriaDialog } from "@/components/produtos/nova-categoria-dialog"
import { NovaMarcaDialog } from "@/components/produtos/nova-marca-dialog"
import { EditarProdutoDialog } from "@/components/produtos/editar-produto-dialog"
import { CategoriaEditDialog } from "@/components/categoria-edit-dialog"
import { MarcaEditDialog } from "@/components/marca-edit-dialog"

interface Produto {
  id: string
  codigo: string
  descricao: string
  categoria_nome?: string
  categoria_codigo?: string
  categoria_id: string
  marca_nome?: string
  marca_sigla?: string
  marca_id: string
  ncm?: string
  unidade: string
  valor_unitario: number
  valor_mao_obra: number
  valor_custo: number
  margem_lucro: number
  estoque: number
  estoque_minimo: number
  observacoes?: string
  ativo: boolean
}

interface Categoria {
  id: string
  codigo: string
  nome: string
  total_produtos: number
  ativo: boolean
}

interface Marca {
  id: string
  nome: string
  sigla: string
  contador: number
  total_produtos: number
  ativo: boolean
}

export default function ProdutosPage({
  searchParams,
}: {
  searchParams?: Promise<{
    tab?: string
    novo?: string
    novo_servico?: string
    nova_categoria?: string
    nova_marca?: string
  }>
}) {
  const router = useRouter()
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [servicos, setServicos] = useState<Produto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [loading, setLoading] = useState(true)
  const [searchProdutos, setSearchProdutos] = useState("")
  const [searchServicos, setSearchServicos] = useState("")
  const [searchCategorias, setSearchCategorias] = useState("")
  const [searchMarcas, setSearchMarcas] = useState("")
  const [logoMenu, setLogoMenu] = useState<string>("")
  const [editandoServico, setEditandoServico] = useState<any>(null)
  const [servicoDialogOpen, setServicoDialogOpen] = useState(false)
  const [produtoCardFilter, setProdutoCardFilter] = useState<string>("all")
  const [selectedCategoria, setSelectedCategoria] = useState<string>("all")
  const [selectedMarca, setSelectedMarca] = useState<string>("all")
  const [expandedProdutoId, setExpandedProdutoId] = useState<string | null>(null)
  const [expandedServicoId, setExpandedServicoId] = useState<string | null>(null)
  const [expandedCategoriaId, setExpandedCategoriaId] = useState<string | null>(null)
  const [expandedMarcaId, setExpandedMarcaId] = useState<string | null>(null)

  // Tab State
  const [currentTab, setCurrentTab] = useState("produtos")

  // Drawers Open State
  const [isNovoProdutoOpen, setIsNovoProdutoOpen] = useState(false)
  const [isNovoServicoOpen, setIsNovoServicoOpen] = useState(false)
  const [isNovaCategoriaOpen, setIsNovaCategoriaOpen] = useState(false)
  const [isNovaMarcaOpen, setIsNovaMarcaOpen] = useState(false)
  const [selectedProdutoEdit, setSelectedProdutoEdit] = useState<any | null>(null)
  const [isEditarProdutoOpen, setIsEditarProdutoOpen] = useState(false)
  const [selectedCategoriaEdit, setSelectedCategoriaEdit] = useState<any | null>(null)
  const [isEditarCategoriaOpen, setIsEditarCategoriaOpen] = useState(false)
  const [selectedMarcaEdit, setSelectedMarcaEdit] = useState<any | null>(null)
  const [isEditarMarcaOpen, setIsEditarMarcaOpen] = useState(false)

  // Parse URL Search Params
  useEffect(() => {
    if (searchParams) {
      searchParams.then((params) => {
        if (params.tab) {
          setCurrentTab(params.tab)
        }
        if (params.novo === "true") {
          setIsNovoProdutoOpen(true)
        }
        if (params.novo_servico === "true") {
          setIsNovoServicoOpen(true)
        }
        if (params.nova_categoria === "true") {
          setIsNovaCategoriaOpen(true)
        }
        if (params.nova_marca === "true") {
          setIsNovaMarcaOpen(true)
        }
        // Clear params to keep URL clean
        if (Object.keys(params).length > 0) {
          router.replace("/produtos")
        }
      })
    }
  }, [searchParams, router])

  const loadLogoMenu = async () => {
    try {
      const response = await fetch("/api/configuracoes/logos")
      const result = await response.json()
      if (result.success && result.data?.length > 0) {
        const menuLogo = result.data.find((logo: any) => logo.tipo === "menu")
        if (menuLogo?.arquivo_base64) {
          setLogoMenu(menuLogo.arquivo_base64)
        }
      }
    } catch (error) {
      console.error("Erro ao carregar logo do menu:", error)
    }
  }

  const fetchProdutos = async () => {
    try {
      const response = await fetch(`/api/produtos?search=${searchProdutos}&limit=1000`)
      const result = await response.json()
      if (result.success) {
        const produtosFiltrados = Array.isArray(result.data)
          ? result.data.filter(
              (produto: Produto) =>
                produto.categoria_nome?.toLowerCase() !== "serviços" &&
                produto.categoria_nome?.toLowerCase() !== "servicos",
            )
          : []
        setProdutos(produtosFiltrados)
      } else {
        setProdutos([])
      }
    } catch (error) {
      console.error("Erro ao buscar produtos:", error)
      setProdutos([])
    } finally {
      setLoading(false)
    }
  }

  const fetchServicos = async () => {
    try {
      const response = await fetch(`/api/produtos?search=${searchServicos}&categoria=serviços&limit=1000`)
      const result = await response.json()
      if (result.success) {
        setServicos(Array.isArray(result.data) ? result.data : [])
      } else {
        setServicos([])
      }
    } catch (error) {
      console.error("Erro ao buscar serviços:", error)
      setServicos([])
    }
  }

  const fetchCategorias = async () => {
    try {
      const response = await fetch(`/api/categorias?search=${searchCategorias}&limit=1000`)
      const result = await response.json()
      if (result.success) {
        setCategorias(Array.isArray(result.data) ? result.data : [])
      } else {
        setCategorias([])
      }
    } catch (error) {
      console.error("Erro ao buscar categorias:", error)
      setCategorias([])
    }
  }

  const fetchMarcas = async () => {
    try {
      const response = await fetch(`/api/marcas?search=${searchMarcas}&limit=1000`)
      const result = await response.json()
      if (result.success) {
        setMarcas(Array.isArray(result.data) ? result.data : [])
      } else {
        setMarcas([])
      }
    } catch (error) {
      console.error("Erro ao buscar marcas:", error)
      setMarcas([])
    }
  }

  useEffect(() => {
    loadLogoMenu()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProdutos()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchProdutos])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchServicos()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchServicos])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCategorias()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchCategorias])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMarcas()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchMarcas])

  const isServico = (codigo: string) => {
    return codigo.startsWith("015")
  }

  const filteredProdutos = useMemo(() => {
    let result = produtos

    if (produtoCardFilter === "ativos") {
      result = result.filter((p) => p.ativo)
    } else if (produtoCardFilter === "estoque_baixo") {
      result = result.filter((p) => p.estoque <= p.estoque_minimo && p.estoque_minimo > 0)
    }

    if (selectedCategoria !== "all") {
      result = result.filter((p) => p.categoria_nome === selectedCategoria)
    }

    if (selectedMarca !== "all") {
      result = result.filter((p) => p.marca_nome === selectedMarca)
    }

    return result
  }, [produtos, produtoCardFilter, selectedCategoria, selectedMarca])

  const handleProdutoCardToggle = (filter: string) => {
    setProdutoCardFilter((prev) => (prev === filter ? "all" : filter))
    setExpandedProdutoId(null)
  }

  const getFilterLabel = (filter: string) => {
    if (filter === "ativos") return "Ativos"
    if (filter === "estoque_baixo") return "Estoque Baixo"
    return ""
  }

  const reloadAll = () => {
    fetchProdutos()
    fetchServicos()
    fetchCategorias()
    fetchMarcas()
  }

  const renderProdutoTable = (produtosList: Produto[]) => (
    <ResizableTable<Produto>
      storageKey="produtos"
      columns={[
        { key: "codigo", label: "Código", width: 100, sortable: true },
        { key: "ncm", label: "NCM", width: 90, sortable: false },
        { key: "descricao", label: "Descrição", width: 220, sortable: true },
        { key: "categoria_nome", label: "Categoria", width: 130, sortable: true },
        { key: "marca_nome", label: "Marca", width: 110, sortable: true },
        { key: "valor_unitario", label: "Valor", width: 100, sortable: true },
        { key: "estoque", label: "Estoque", width: 90, sortable: true },
        { key: "ativo", label: "Status", width: 80, sortable: true },
        { key: "acoes", label: "Ações", width: 120, sortable: false, noResize: true },
      ]}
      data={produtosList}
      rowKey={(row) => row.id}
      emptyState={
        <div className="text-center py-12">
          <Package className="mx-auto h-16 w-16 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-foreground mb-2">Nenhum produto encontrado</h3>
          <p className="text-sm text-muted-foreground mb-4">Comece cadastrando seu primeiro produto</p>
          <Button onClick={() => setIsNovoProdutoOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm">
            <Plus className="h-4 w-4 mr-2" />Cadastrar Primeiro Produto
          </Button>
        </div>
      }
      renderCell={(produto, col) => {
        switch (col) {
          case "codigo":
            return <Badge variant="outline" className="font-mono text-xs text-foreground bg-muted/40 border-border">{produto.codigo}</Badge>
          case "ncm":
            return produto.ncm ? (
              <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono text-[10px] border-0">{produto.ncm}</Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground border-border text-[10px]">Sem NCM</Badge>
            )
          case "descricao":
            return <span className="font-medium text-sm text-foreground break-words whitespace-normal leading-tight" title={produto.descricao}>{produto.descricao}</span>
          case "categoria_nome":
            return produto.categoria_nome && produto.categoria_nome !== "0" ? (
              <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs border-0 truncate max-w-[110px]" title={produto.categoria_nome}>
                {produto.categoria_nome}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground border-border text-xs">Sem cat.</Badge>
            )
          case "marca_nome":
            return produto.marca_nome && produto.marca_nome !== "0" ? (
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs border-0 truncate max-w-[100px]" title={produto.marca_nome}>
                {produto.marca_nome}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground border-border text-xs">Sem marca</Badge>
            )
          case "valor_unitario":
            return <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm">{formatCurrency(produto.valor_unitario)}</span>
          case "estoque":
            const isLowStock = produto.estoque <= produto.estoque_minimo && produto.estoque_minimo > 0
            return (
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-sm text-foreground">{produto.estoque}</span>
                {isLowStock ? (
                  <Badge className="bg-red-500/10 text-red-500 border-0 animate-pulse text-[10px] px-1">
                    <AlertTriangle className="h-3 w-3" />
                  </Badge>
                ) : (
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-0 text-[10px] px-1">
                    <CheckCircle className="h-3 w-3" />
                  </Badge>
                )}
              </div>
            )
          case "ativo":
            return (
              <Badge
                variant={produto.ativo ? "default" : "secondary"}
                className={`text-xs border-0 ${
                  produto.ativo ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"
                }`}
              >
                {produto.ativo ? "Ativo" : "Inativo"}
              </Badge>
            )
          case "acoes":
            const handleEditClick = () => {
              if (isServico(produto.codigo)) {
                setEditandoServico({
                  id: produto.id,
                  codigo: produto.codigo,
                  descricao: produto.descricao,
                  valor_mao_obra: produto.valor_mao_obra,
                  observacoes: produto.observacoes,
                  ativo: produto.ativo,
                })
                setServicoDialogOpen(true)
              } else {
                setSelectedProdutoEdit(produto)
                setIsEditarProdutoOpen(true)
              }
            }
            return (
              <div className="flex items-center gap-1">
                {/* Desktop View: Show buttons directly on large screens */}
                <div className="hidden xl:flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditClick}
                    className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 border-indigo-200 dark:border-indigo-900/50 bg-transparent h-8 w-8 p-0"
                    title="Editar"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <ProdutoDeleteDialog produto={produto} onSuccess={reloadAll} />
                </div>
                {/* Mobile/Tablet View: Show dropdown menu on smaller screens */}
                <div className="xl:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleEditClick}>
                        <Edit className="h-4 w-4 mr-2" />Editar
                      </DropdownMenuItem>
                      <ProdutoDeleteDialog
                        produto={produto}
                        onSuccess={reloadAll}
                        trigger={
                          <DropdownMenuItem className="text-red-600 focus:text-red-600" onSelect={(e) => e.preventDefault()}>
                            <Trash2 className="h-4 w-4 mr-2" />Excluir
                          </DropdownMenuItem>
                        }
                      />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          default:
            return null
        }
      }}
    />
  )

  const renderServicoTable = (servicosList: Produto[]) => (
    <ResizableTable<Produto>
      storageKey="servicos"
      columns={[
        { key: "codigo", label: "Código", width: 100, sortable: true },
        { key: "descricao", label: "Descrição", width: 270, sortable: true },
        { key: "categoria_nome", label: "Categoria", width: 130, sortable: true },
        { key: "valor_mao_obra", label: "Valor Mão de Obra", width: 140, sortable: true },
        { key: "ativo", label: "Status", width: 80, sortable: true },
        { key: "acoes", label: "Ações", width: 120, sortable: false, noResize: true },
      ]}
      data={servicosList}
      rowKey={(row) => row.id}
      emptyState={
        <div className="text-center py-12">
          <Wrench className="mx-auto h-16 w-16 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-foreground mb-2">Nenhum serviço encontrado</h3>
          <p className="text-sm text-muted-foreground mb-4">Comece cadastrando seu primeiro serviço</p>
          <Button onClick={() => setIsNovoServicoOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm">
            <Plus className="h-4 w-4 mr-2" />Cadastrar Primeiro Serviço
          </Button>
        </div>
      }
      renderCell={(servico, col) => {
        switch (col) {
          case "codigo":
            return <Badge variant="outline" className="font-mono text-xs text-foreground bg-muted/40 border-border">{servico.codigo}</Badge>
          case "descricao":
            return <span className="font-medium text-sm text-foreground break-words whitespace-normal leading-tight" title={servico.descricao}>{servico.descricao}</span>
          case "categoria_nome":
            return (
              <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs border-0">
                <Wrench className="h-3 w-3 mr-1" />
                Serviços
              </Badge>
            )
          case "valor_mao_obra":
            return <span className="font-semibold text-orange-600 dark:text-orange-400 text-sm">{formatCurrency(servico.valor_mao_obra)}</span>
          case "ativo":
            return (
              <Badge
                variant={servico.ativo ? "default" : "secondary"}
                className={`text-xs border-0 ${
                  servico.ativo ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"
                }`}
              >
                {servico.ativo ? "Ativo" : "Inativo"}
              </Badge>
            )
          case "acoes":
            const handleEditClick = () => {
              setEditandoServico({
                id: servico.id,
                codigo: servico.codigo,
                descricao: servico.descricao,
                valor_mao_obra: servico.valor_mao_obra,
                observacoes: servico.observacoes,
                ativo: servico.ativo,
              })
              setServicoDialogOpen(true)
            }
            return (
              <div className="flex items-center gap-1">
                {/* Desktop View: Show buttons directly on large screens */}
                <div className="hidden xl:flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditClick}
                    className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 border-indigo-200 dark:border-indigo-900/50 bg-transparent h-8 w-8 p-0"
                    title="Editar"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <ProdutoDeleteDialog produto={servico} onSuccess={reloadAll} />
                </div>
                {/* Mobile/Tablet View: Show dropdown menu on smaller screens */}
                <div className="xl:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleEditClick}>
                        <Edit className="h-4 w-4 mr-2" />Editar
                      </DropdownMenuItem>
                      <ProdutoDeleteDialog
                        produto={servico}
                        onSuccess={reloadAll}
                        trigger={
                          <DropdownMenuItem className="text-red-600 focus:text-red-600" onSelect={(e) => e.preventDefault()}>
                            <Trash2 className="h-4 w-4 mr-2" />Excluir
                          </DropdownMenuItem>
                        }
                      />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          default:
            return null
        }
      }}
    />
  )

  const renderCategoriaTable = (categoriasList: Categoria[]) => (
    <ResizableTable<Categoria>
      storageKey="categorias"
      columns={[
        { key: "codigo", label: "Código", width: 100, sortable: true },
        { key: "nome", label: "Nome", width: 270, sortable: true },
        { key: "ativo", label: "Status", width: 100, sortable: true },
        { key: "acoes", label: "Ações", width: 120, sortable: false, noResize: true },
      ]}
      data={categoriasList}
      rowKey={(row) => row.id}
      emptyState={
        <div className="text-center py-12">
          <Tag className="mx-auto h-16 w-16 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma categoria encontrada</h3>
          <p className="text-sm text-muted-foreground mb-4">Comece cadastrando sua primeira categoria</p>
          <Button onClick={() => setIsNovaCategoriaOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm">
            <Plus className="h-4 w-4 mr-2" />Cadastrar Primeira Categoria
          </Button>
        </div>
      }
      renderCell={(categoria, col) => {
        switch (col) {
          case "codigo":
            return <Badge variant="outline" className="font-mono text-foreground bg-muted/40 border-border">{categoria.codigo}</Badge>
          case "nome":
            return <span className="font-medium text-foreground break-words whitespace-normal leading-tight" title={categoria.nome}>{categoria.nome}</span>
          case "ativo":
            return (
              <Badge
                variant={categoria.ativo ? "default" : "secondary"}
                className={`text-xs border-0 ${
                  categoria.ativo ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"
                }`}
              >
                {categoria.ativo ? "Ativo" : "Inativo"}
              </Badge>
            )
          case "acoes":
            const handleEditClick = () => {
              setSelectedCategoriaEdit(categoria)
              setIsEditarCategoriaOpen(true)
            }
            return (
              <div className="flex items-center gap-1">
                {/* Desktop View: Show buttons directly on large screens */}
                <div className="hidden xl:flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditClick}
                    className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 border-indigo-200 dark:border-indigo-900/50 bg-transparent h-8 w-8 p-0"
                    title="Editar"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <CategoriaDeleteDialog categoria={categoria} onSuccess={fetchCategorias} />
                </div>
                {/* Mobile/Tablet View: Show dropdown menu on smaller screens */}
                <div className="xl:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleEditClick}>
                        <Edit className="h-4 w-4 mr-2" />Editar
                      </DropdownMenuItem>
                      <CategoriaDeleteDialog
                        categoria={categoria}
                        onSuccess={fetchCategorias}
                        trigger={
                          <DropdownMenuItem className="text-red-600 focus:text-red-600" onSelect={(e) => e.preventDefault()}>
                            <Trash2 className="h-4 w-4 mr-2" />Excluir
                          </DropdownMenuItem>
                        }
                      />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          default:
            return null
        }
      }}
    />
  )

  const renderMarcaTable = (marcasList: Marca[]) => (
    <ResizableTable<Marca>
      storageKey="marcas"
      columns={[
        { key: "nome", label: "Nome", width: 220, sortable: true },
        { key: "sigla", label: "Sigla", width: 100, sortable: true },
        { key: "contador", label: "Contador", width: 90, sortable: true },
        { key: "ativo", label: "Status", width: 90, sortable: true },
        { key: "acoes", label: "Ações", width: 120, sortable: false, noResize: true },
      ]}
      data={marcasList}
      rowKey={(row) => row.id}
      emptyState={
        <div className="text-center py-12">
          <Award className="mx-auto h-16 w-16 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma marca encontrada</h3>
          <p className="text-sm text-muted-foreground mb-4">Comece cadastrando sua primeira marca</p>
          <Button onClick={() => setIsNovaMarcaOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm">
            <Plus className="h-4 w-4 mr-2" />Cadastrar Primeira Marca
          </Button>
        </div>
      }
      renderCell={(marca, col) => {
        switch (col) {
          case "nome":
            return <span className="font-medium text-foreground break-words whitespace-normal leading-tight" title={marca.nome}>{marca.nome}</span>
          case "sigla":
            return marca.sigla ? (
              <Badge variant="outline" className="font-mono text-foreground bg-muted/40 border-border">{marca.sigla}</Badge>
            ) : (
              <span className="text-muted-foreground">-</span>
            )
          case "contador":
            return <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs border-0">{marca.contador}</Badge>
          case "ativo":
            return (
              <Badge
                variant={marca.ativo ? "default" : "secondary"}
                className={`text-xs border-0 ${
                  marca.ativo ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"
                }`}
              >
                {marca.ativo ? "Ativo" : "Inativo"}
              </Badge>
            )
          case "acoes":
            const handleEditClick = () => {
              setSelectedMarcaEdit(marca)
              setIsEditarMarcaOpen(true)
            }
            return (
              <div className="flex items-center gap-1">
                {/* Desktop View: Show buttons directly on large screens */}
                <div className="hidden xl:flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditClick}
                    className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 border-indigo-200 dark:border-indigo-900/50 bg-transparent h-8 w-8 p-0"
                    title="Editar"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <MarcaDeleteDialog marca={marca} onSuccess={fetchMarcas} />
                </div>
                {/* Mobile/Tablet View: Show dropdown menu on smaller screens */}
                <div className="xl:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleEditClick}>
                        <Edit className="h-4 w-4 mr-2" />Editar
                      </DropdownMenuItem>
                      <MarcaDeleteDialog
                        marca={marca}
                        onSuccess={fetchMarcas}
                        trigger={
                          <DropdownMenuItem className="text-red-600 focus:text-red-600" onSelect={(e) => e.preventDefault()}>
                            <Trash2 className="h-4 w-4 mr-2" />Excluir
                          </DropdownMenuItem>
                        }
                      />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          default:
            return null
        }
      }}
    />
  )

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-10 w-10 bg-muted animate-pulse rounded-lg" />
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                <div className="h-3 w-32 bg-muted animate-pulse rounded mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const hasActiveFilter =
    searchProdutos.trim() !== "" ||
    produtoCardFilter !== "all" ||
    selectedCategoria !== "all" ||
    selectedMarca !== "all"

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full text-foreground bg-background">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          {logoMenu && (
            <img
              src={logoMenu || "/placeholder.svg"}
              alt="Logo"
              className="h-10 w-10 object-contain rounded-lg border border-border bg-card p-1"
            />
          )}
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
              Produtos & Serviços
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5 font-medium">
              Gerencie produtos, serviços, categorias e marcas do sistema
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <Button
                onClick={() => setIsNovoProdutoOpen(true)}
                className="bg-indigo-650 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-650 text-white shadow-md hover:shadow-indigo-500/10 h-10 px-4 text-xs lg:text-sm font-semibold transition-all rounded-xl"
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Produto
              </Button>
              <Button
                onClick={() => setIsNovoServicoOpen(true)}
                className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold shadow-md rounded-xl h-10 px-4 text-xs lg:text-sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Serviço
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
        {/* Desktop: TabsList normal */}
        <TabsList className="hidden md:grid w-full grid-cols-4 bg-slate-100 dark:bg-slate-900/60 rounded-xl p-1.5 h-12 max-w-2xl border border-border">
          <TabsTrigger
            value="produtos"
            className="flex items-center gap-2 h-full rounded-lg transition-all text-xs font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-blue-650 data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            <Package className="h-4 w-4" />
            Produtos
          </TabsTrigger>
          <TabsTrigger
            value="servicos"
            className="flex items-center gap-2 h-full rounded-lg transition-all text-xs font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            <Wrench className="h-4 w-4" />
            Serviços
          </TabsTrigger>
          <TabsTrigger
            value="categorias"
            className="flex items-center gap-2 h-full rounded-lg transition-all text-xs font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            <Tag className="h-4 w-4" />
            Categorias
          </TabsTrigger>
          <TabsTrigger
            value="marcas"
            className="flex items-center gap-2 h-full rounded-lg transition-all text-xs font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            <Award className="h-4 w-4" />
            Marcas
          </TabsTrigger>
        </TabsList>

        {/* Mobile Navigation Dropdown */}
        <div className="md:hidden">
          <Select value={currentTab} onValueChange={setCurrentTab}>
            <SelectTrigger className="w-full h-11 bg-card border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="produtos">Produtos</SelectItem>
              <SelectItem value="servicos">Serviços</SelectItem>
              <SelectItem value="categorias">Categorias</SelectItem>
              <SelectItem value="marcas">Marcas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="produtos" className="space-y-6 outline-none">
          {/* Stats Cards — filtros clicáveis */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Total */}
            <Card
              className={`border border-border shadow-xs hover:border-indigo-500/30 transition-all duration-200 bg-card cursor-pointer select-none ${
                produtoCardFilter === "all" ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-background" : ""
              }`}
              onClick={() => handleProdutoCardToggle("all")}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                <CardTitle className="text-xs lg:text-sm font-semibold text-indigo-600 dark:text-indigo-400">Total</CardTitle>
                <Package className="h-4 w-4 text-indigo-500" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-xl lg:text-2xl font-bold text-foreground">{produtos.length}</div>
                <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">cadastrados</p>
              </CardContent>
            </Card>

            {/* Ativos */}
            <Card
              className={`border border-border shadow-xs hover:border-emerald-500/30 transition-all duration-200 bg-card cursor-pointer select-none ${
                produtoCardFilter === "ativos" ? "ring-2 ring-emerald-500 ring-offset-2 ring-offset-background" : ""
              }`}
              onClick={() => handleProdutoCardToggle("ativos")}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                <CardTitle className="text-xs lg:text-sm font-semibold text-emerald-600 dark:text-emerald-400">Ativos</CardTitle>
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-xl lg:text-2xl font-bold text-foreground">{produtos.filter((p) => p.ativo).length}</div>
                <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">disponíveis</p>
              </CardContent>
            </Card>

            {/* Estoque Baixo */}
            <Card
              className={`border border-border shadow-xs hover:border-red-500/30 transition-all duration-200 bg-card cursor-pointer select-none ${
                produtoCardFilter === "estoque_baixo" ? "ring-2 ring-red-500 ring-offset-2 ring-offset-background" : ""
              }`}
              onClick={() => handleProdutoCardToggle("estoque_baixo")}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                <CardTitle className="text-xs lg:text-sm font-semibold text-red-650 dark:text-red-400">Estoque Baixo</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent className="p-4 pt-0 col-span-2 lg:col-span-1">
                <div className="text-xl lg:text-2xl font-bold text-foreground">
                  {produtos.filter((p) => p.estoque <= p.estoque_minimo && p.estoque_minimo > 0).length}
                </div>
                <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">abaixo do mínimo</p>
              </CardContent>
            </Card>
          </div>

          {/* Table Card */}
          <Card className="border border-border bg-card">
            <CardHeader className="bg-gradient-to-r from-indigo-500 to-violet-650 text-white rounded-t-lg p-4 lg:p-6 dark:from-indigo-950/40 dark:to-violet-950/40 dark:border-b dark:border-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-white flex items-center gap-2 text-lg lg:text-xl">
                    <Package className="h-5 w-5" />
                    Lista de Produtos
                  </CardTitle>
                  <CardDescription className="text-indigo-100 text-xs mt-1 dark:text-indigo-200/80">
                    Gerencie todos os produtos do sistema.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Filters / Search Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border-b border-border/60">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produtos..."
                    value={searchProdutos}
                    onChange={(e) => setSearchProdutos(e.target.value)}
                    className="pl-9 h-9 text-xs border-border bg-background text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <CategoriaFilter value={selectedCategoria} onValueChange={setSelectedCategoria} categorias={categorias} />
                  <MarcaFilter value={selectedMarca} onValueChange={setSelectedMarca} marcas={marcas} />
                </div>
              </div>
              {/* Desktop View */}
              <div className="hidden md:block">
                {renderProdutoTable(filteredProdutos)}
              </div>

              {/* Mobile View */}
              <div className="md:hidden p-4 space-y-3">
                {!hasActiveFilter ? (
                  <div className="text-center py-12 bg-card rounded-xl border border-border p-6 shadow-sm">
                    <Search className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                    <h3 className="text-base font-medium text-foreground mb-1">Busque ou filtre para ver os produtos</h3>
                    <p className="text-sm text-muted-foreground">Digite na busca ou selecione um filtro para começar.</p>
                  </div>
                ) : filteredProdutos.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                    <h3 className="text-base font-medium text-foreground mb-1">Nenhum produto encontrado</h3>
                    <p className="text-sm text-muted-foreground">Tente ajustar os filtros de busca.</p>
                  </div>
                ) : (
                  filteredProdutos.map((produto) => {
                    const isExpanded = expandedProdutoId === produto.id
                    const isLowStock = produto.estoque <= produto.estoque_minimo && produto.estoque_minimo > 0

                    return (
                      <div
                        key={produto.id}
                        className={`rounded-xl border transition-all duration-200 overflow-hidden bg-card ${
                          isExpanded ? "shadow-lg ring-1 ring-indigo-500 border-indigo-500" : "border-border shadow-sm"
                        }`}
                      >
                        {/* Main card trigger */}
                        <button
                          type="button"
                          onClick={() => setExpandedProdutoId(expandedProdutoId === produto.id ? null : produto.id)}
                          className="w-full text-left p-3.5 flex items-center gap-3 bg-transparent text-foreground"
                        >
                          <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-muted text-muted-foreground">
                            {produto.codigo ? produto.codigo.slice(-2).toUpperCase() : "PR"}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-foreground break-words whitespace-normal leading-tight">
                                {produto.descricao}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-[11px] text-muted-foreground font-mono">
                                {produto.codigo}
                              </span>
                              {produto.categoria_nome && produto.categoria_nome !== "0" && (
                                <Badge className="text-[10px] px-1.5 py-0 h-4 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0">
                                  {produto.categoria_nome}
                                </Badge>
                              )}
                              <span className="text-[11px] font-semibold text-emerald-650 dark:text-emerald-400">
                                {formatCurrency(produto.valor_unitario)}
                              </span>
                            </div>
                          </div>

                          <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 flex-shrink-0 ${
                            isExpanded ? "rotate-90" : ""
                          }`} />
                        </button>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="px-3.5 pb-3.5 pt-0 animate-in slide-in-from-top-2 duration-200">
                            <div className="border-t border-border/40 pt-3 space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="bg-muted/40 rounded-lg p-2.5">
                                  <span className="text-[10px] font-medium text-muted-foreground uppercase block mb-1">Preço Venda</span>
                                  <p className="text-xs font-semibold text-emerald-650 dark:text-emerald-400">
                                    {formatCurrency(produto.valor_unitario)}
                                  </p>
                                </div>
                                <div className="bg-muted/40 rounded-lg p-2.5">
                                  <span className="text-[10px] font-medium text-muted-foreground uppercase block mb-1">Estoque</span>
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-xs font-semibold text-foreground">{produto.estoque} {produto.unidade}</p>
                                    {isLowStock ? (
                                      <Badge className="bg-red-500/10 text-red-500 border-0 text-[9px] px-1 py-0 h-3.5">
                                        Baixo
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-emerald-500/10 text-emerald-500 border-0 text-[9px] px-1 py-0 h-3.5">
                                        OK
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                {produto.marca_nome && produto.marca_nome !== "0" && (
                                  <div className="bg-muted/40 rounded-lg p-2.5">
                                    <span className="text-[10px] font-medium text-muted-foreground uppercase block mb-1">Marca</span>
                                    <p className="text-xs text-foreground truncate">{produto.marca_nome}</p>
                                  </div>
                                )}
                                {produto.ncm && (
                                  <div className="bg-muted/40 rounded-lg p-2.5">
                                    <span className="text-[10px] font-medium text-muted-foreground uppercase block mb-1">NCM</span>
                                    <p className="text-xs font-mono text-foreground">{produto.ncm}</p>
                                  </div>
                                )}
                              </div>

                              {produto.observacoes && (
                                <div className="bg-muted/40 rounded-lg p-2.5">
                                  <span className="text-[10px] font-medium text-muted-foreground uppercase block mb-1">Observações</span>
                                  <p className="text-xs text-foreground whitespace-pre-wrap">{produto.observacoes}</p>
                                </div>
                              )}

                              <div className="flex gap-2 pt-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 h-9 text-xs font-medium text-indigo-650 dark:text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/10"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedProdutoEdit(produto)
                                    setIsEditarProdutoOpen(true)
                                  }}
                                >
                                  <Edit className="h-3.5 w-3.5 mr-1.5" />
                                  Editar
                                </Button>
                                <ProdutoDeleteDialog
                                  produto={produto}
                                  onSuccess={reloadAll}
                                  trigger={
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-9 text-xs font-medium text-red-500 dark:text-red-400 border-red-500/20 hover:bg-red-500/10 bg-transparent px-3"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  }
                                />
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
        </TabsContent>

        <TabsContent value="servicos" className="space-y-6 outline-none">
          <Card className="border border-border bg-card">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-t-lg p-4 lg:p-6 dark:from-orange-950/40 dark:to-amber-950/40 dark:border-b dark:border-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-white flex items-center gap-2 text-lg lg:text-xl">
                    <Wrench className="h-5 w-5" />
                    Lista de Serviços
                  </CardTitle>
                  <CardDescription className="text-orange-100 text-xs mt-1 dark:text-orange-200/80">
                    Gerencie todos os serviços e tabelas de mão de obra.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Filters / Search Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border-b border-border/60">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar serviços..."
                    value={searchServicos}
                    onChange={(e) => setSearchServicos(e.target.value)}
                    className="pl-9 h-9 text-xs border-border bg-background text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              {renderServicoTable(servicos)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categorias" className="space-y-6 outline-none">
          <Card className="border border-border bg-card">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white rounded-t-lg p-4 lg:p-6 dark:from-purple-950/40 dark:to-fuchsia-950/40 dark:border-b dark:border-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-white flex items-center gap-2 text-lg lg:text-xl">
                    <Tag className="h-5 w-5" />
                    Categorias de Produtos
                  </CardTitle>
                  <CardDescription className="text-purple-150 text-xs mt-1 dark:text-purple-200/80">
                    Gerencie as divisões de categorias de produtos.
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setIsNovaCategoriaOpen(true)}
                  className="bg-white text-purple-650 hover:bg-purple-50 dark:bg-slate-900 dark:text-purple-400 dark:hover:bg-slate-800 border dark:border-purple-500/20 shadow-sm h-9 px-4 text-sm font-medium transition-all"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Categoria
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Filters / Search Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border-b border-border/60">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar categorias..."
                    value={searchCategorias}
                    onChange={(e) => setSearchCategorias(e.target.value)}
                    className="pl-9 h-9 text-xs border-border bg-background text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              {renderCategoriaTable(categorias)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marcas" className="space-y-6 outline-none">
          <Card className="border border-border bg-card">
            <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-lg p-4 lg:p-6 dark:from-emerald-950/40 dark:to-teal-950/40 dark:border-b dark:border-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-white flex items-center gap-2 text-lg lg:text-xl">
                    <Award className="h-5 w-5" />
                    Marcas de Produtos
                  </CardTitle>
                  <CardDescription className="text-emerald-150 text-xs mt-1 dark:text-emerald-200/80">
                    Gerencie as fabricantes e marcas vinculadas.
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setIsNovaMarcaOpen(true)}
                  className="bg-white text-emerald-650 hover:bg-emerald-50 dark:bg-slate-900 dark:text-emerald-400 dark:hover:bg-slate-800 border dark:border-emerald-500/20 shadow-sm h-9 px-4 text-sm font-medium transition-all"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Marca
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Filters / Search Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border-b border-border/60">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar marcas..."
                    value={searchMarcas}
                    onChange={(e) => setSearchMarcas(e.target.value)}
                    className="pl-9 h-9 text-xs border-border bg-background text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              {renderMarcaTable(marcas)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <EditarServicoDialog
        open={servicoDialogOpen}
        onOpenChange={setServicoDialogOpen}
        servico={editandoServico}
        onSuccess={reloadAll}
      />

      {/* Drawers */}
      <NovoProdutoDialog
        open={isNovoProdutoOpen}
        onOpenChange={setIsNovoProdutoOpen}
        onSuccess={reloadAll}
      />
      <NovoServicoDialog
        open={isNovoServicoOpen}
        onOpenChange={setIsNovoServicoOpen}
        onSuccess={reloadAll}
      />
      <NovaCategoriaDialog
        open={isNovaCategoriaOpen}
        onOpenChange={setIsNovaCategoriaOpen}
        onSuccess={reloadAll}
      />
      <NovaMarcaDialog
        open={isNovaMarcaOpen}
        onOpenChange={setIsNovaMarcaOpen}
        onSuccess={reloadAll}
      />
      <EditarProdutoDialog
        open={isEditarProdutoOpen}
        onOpenChange={(open) => {
          setIsEditarProdutoOpen(open)
          if (!open) setSelectedProdutoEdit(null)
        }}
        onSuccess={reloadAll}
        produto={selectedProdutoEdit}
      />
      <CategoriaEditDialog
        open={isEditarCategoriaOpen}
        onOpenChange={(open) => {
          setIsEditarCategoriaOpen(open)
          if (!open) setSelectedCategoriaEdit(null)
        }}
        onSuccess={reloadAll}
        categoria={selectedCategoriaEdit}
      />
      <MarcaEditDialog
        open={isEditarMarcaOpen}
        onOpenChange={(open) => {
          setIsEditarMarcaOpen(open)
          if (!open) setSelectedMarcaEdit(null)
        }}
        onSuccess={reloadAll}
        marca={selectedMarcaEdit}
      />
    </div>
  )
}

interface CategoriaFilterProps {
  value: string
  onValueChange: (value: string) => void
  categorias: Categoria[]
}

function CategoriaFilter({ value, onValueChange, categorias }: CategoriaFilterProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    if (!search) return categorias
    const s = search.toLowerCase()
    return categorias.filter((c) => c.nome?.toLowerCase().includes(s))
  }, [categorias, search])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full md:w-[180px] justify-between text-foreground border-border bg-card h-9 text-xs font-normal hover:bg-muted/40"
        >
          <span className="truncate">
            {value === "all" ? "Filtrar por Categoria" : value}
          </span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[180px] p-0 border-border bg-card" align="start">
        <Command shouldFilter={false} className="bg-card">
          <CommandInput
            placeholder="Buscar categoria..."
            value={search}
            onValueChange={setSearch}
            className="text-xs h-9"
          />
          <CommandList>
            <CommandEmpty className="text-xs p-2 text-muted-foreground">Nenhuma encontrada.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="all"
                onSelect={() => {
                  onValueChange("all")
                  setOpen(false)
                  setSearch("")
                }}
                className="text-xs"
              >
                <Check className={cn("mr-2 h-3.5 w-3.5", value === "all" ? "opacity-100" : "opacity-0")} />
                Todas Categorias
              </CommandItem>
              {filtered.map((cat) => (
                <CommandItem
                  key={cat.id}
                  value={cat.nome}
                  onSelect={() => {
                    onValueChange(cat.nome)
                    setOpen(false)
                    setSearch("")
                  }}
                  className="text-xs"
                >
                  <Check className={cn("mr-2 h-3.5 w-3.5", value === cat.nome ? "opacity-100" : "opacity-0")} />
                  {cat.nome}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

interface MarcaFilterProps {
  value: string
  onValueChange: (value: string) => void
  marcas: Marca[]
}

function MarcaFilter({ value, onValueChange, marcas }: MarcaFilterProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    if (!search) return marcas
    const s = search.toLowerCase()
    return marcas.filter((m) => m.nome?.toLowerCase().includes(s) || (m.sigla && m.sigla.toLowerCase().includes(s)))
  }, [marcas, search])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full md:w-[180px] justify-between text-foreground border-border bg-card h-9 text-xs font-normal hover:bg-muted/40"
        >
          <span className="truncate">
            {value === "all" ? "Filtrar por Marca" : value}
          </span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[180px] p-0 border-border bg-card" align="start">
        <Command shouldFilter={false} className="bg-card">
          <CommandInput
            placeholder="Buscar marca..."
            value={search}
            onValueChange={setSearch}
            className="text-xs h-9"
          />
          <CommandList>
            <CommandEmpty className="text-xs p-2 text-muted-foreground">Nenhuma encontrada.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="all"
                onSelect={() => {
                  onValueChange("all")
                  setOpen(false)
                  setSearch("")
                }}
                className="text-xs"
              >
                <Check className={cn("mr-2 h-3.5 w-3.5", value === "all" ? "opacity-100" : "opacity-0")} />
                Todas Marcas
              </CommandItem>
              {filtered.map((m) => (
                <CommandItem
                  key={m.id}
                  value={m.nome}
                  onSelect={() => {
                    onValueChange(m.nome)
                    setOpen(false)
                    setSearch("")
                  }}
                  className="text-xs"
                >
                  <Check className={cn("mr-2 h-3.5 w-3.5", value === m.nome ? "opacity-100" : "opacity-0")} />
                  {m.nome}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
