"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table"
import {
  DollarSign,
  FileText,
  Calculator,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  Plus,
  LucideContrast as FileContract,
  Wrench,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Receipt,
  Package,
  ArrowUpDown,
  Search,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { canAccessRoute } from "@/lib/redirect-helper"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency, cn } from "@/lib/utils"
import Link from "next/link"

// Importar os dialogos/drawers
import { ClienteFormDialog } from "@/components/cliente-form-dialog"
import { ProdutoFormDialog } from "@/components/produto-form-dialog"
import { NovoBoletoDialog } from "@/components/financeiro/novo-boleto-dialog"

interface DashboardStats {
  totalClientes: number
  clientesComContrato: number
  totalEmpresas: number
  totalBoletos: number
  valorTotalBoletos: number
  boletosPendentes: number
  boletosVencidos: number
  totalOrcamentos: number
  orcamentosAbertos: number
  orcamentosAprovados: number
  valorTotalOrcamentos: number
}

interface RecentItem {
  id: number
  numero: string
  cliente_nome: string
  valor: number
  data: string
  status: string
  tipo: "boleto" | "orcamento"
}

// Componente de Loading Skeleton adaptado ao novo padrão minimalista
function DashboardSkeleton() {
  return (
    <div className="flex-1 space-y-6 p-6 md:p-10 min-h-screen bg-transparent text-foreground">
      {/* Header Skeleton */}
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <div>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border border-border/80 rounded-xl shadow-xs bg-card">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </div>
              <Skeleton className="h-8 w-24 mt-4" />
              <Skeleton className="h-3 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border border-border/80 rounded-xl shadow-xs bg-card">
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-60" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 rounded-xl shadow-xs bg-card">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentItems, setRecentItems] = useState<RecentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showValues, setShowValues] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [logoMenu, setLogoMenu] = useState<string | null>(null)
  const { toast } = useToast()

  // Controladores de estado dos Drawers/Sheets
  const [isClienteOpen, setIsClienteOpen] = useState(false)
  const [isProdutoOpen, setIsProdutoOpen] = useState(false)
  const [isBoletoOpen, setIsBoletoOpen] = useState(false)

  // Estados de Ordenação e Filtragem da TanStack Table
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")

  useEffect(() => {
    if (user) {
      const hasAccess = canAccessRoute(user, "/dashboard")
      if (!hasAccess) {
        router.push("/sem-permissoes")
        return
      }
    }

    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)

    const saved = localStorage.getItem("ocultar-valores")
    if (saved !== null) {
      setShowValues(saved !== "true")
    }

    loadData()

    return () => window.removeEventListener("resize", checkMobile)
  }, [user, router])

  const toggleShowValues = () => {
    const newValue = !showValues
    setShowValues(newValue)
    localStorage.setItem("ocultar-valores", String(!newValue))
  }

  const shouldShow = showValues && !isMobile

  const formatValueOrHide = (value: number) => {
    if (!shouldShow) {
      return "R$ •••"
    }
    return formatCurrency(value)
  }

  const loadData = async () => {
    try {
      setLoading(true)

      const [clientesRes, boletosRes, orcamentosRes, logoRes] = await Promise.all([
        fetch("/api/clientes"),
        fetch("/api/boletos"),
        fetch("/api/orcamentos"),
        fetch("/api/configuracoes/logos"),
      ])

      const [clientesData, boletosData, orcamentosData, logoResult] = await Promise.all([
        clientesRes.json(),
        boletosRes.json(),
        orcamentosRes.json(),
        logoRes.json(),
      ])

      if (logoResult.success && logoResult.data) {
        const logoMenuData = logoResult.data.find((logo: any) => logo.tipo === "menu")
        if (logoMenuData && logoMenuData.caminho) {
          setLogoMenu(logoMenuData.caminho)
        }
      }

      if (clientesData.success && boletosData.success && orcamentosData.success) {
        const clientes = clientesData.data || []
        const boletos = boletosData.data || []
        const orcamentos = orcamentosData.data || []

        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)

        const boletosVencidos = boletos.filter((b: any) => {
          if (b.status === "vencido") return true
          if (b.status === "pendente" && b.data_vencimento) {
            const vencimento = new Date(b.data_vencimento)
            vencimento.setHours(0, 0, 0, 0)
            return vencimento < hoje
          }
          return false
        })

        const dashboardStats: DashboardStats = {
          totalClientes: clientes.length,
          clientesComContrato: clientes.filter((c: any) => c.tem_contrato).length,
          totalEmpresas: clientes.filter((c: any) => c.cnpj && c.cnpj.trim() !== "").length,
          totalBoletos: boletos.length,
          valorTotalBoletos: boletos.reduce((acc: number, b: any) => acc + Number(b.valor || 0), 0),
          boletosPendentes: boletos.filter((b: any) => b.status === "pendente").length,
          boletosVencidos: boletosVencidos.length,
          totalOrcamentos: orcamentos.length,
          orcamentosAbertos: orcamentos.filter((o: any) => o.situacao === "pendente").length,
          orcamentosAprovados: orcamentos.filter((o: any) => o.situacao === "concluido").length,
          valorTotalOrcamentos: orcamentos.reduce((acc: number, o: any) => acc + Number(o.valor_total || 0), 0),
        }

        setStats(dashboardStats)

        const recentBoletos = boletos.slice(0, 5).map((b: any) => ({
          id: b.id,
          numero: b.numero,
          cliente_nome: b.cliente_nome || "Cliente não encontrado",
          valor: Number(b.valor || 0),
          data: b.created_at,
          status: b.status,
          tipo: "boleto" as const,
        }))

        const recentOrcamentos = orcamentos.slice(0, 5).map((o: any) => ({
          id: o.id,
          numero: o.numero,
          cliente_nome: o.cliente_nome || "Cliente não encontrado",
          valor: Number(o.valor_total || 0),
          data: o.created_at,
          status: o.situacao,
          tipo: "orcamento" as const,
        }))

        setRecentItems(
          [...recentBoletos, ...recentOrcamentos]
            .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
        )
      }
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do dashboard",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string, tipo: string) => {
    const config: Record<string, Record<string, { label: string; class: string }>> = {
      boleto: {
        pendente: { label: "Pendente", class: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30" },
        pago: { label: "Pago", class: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30" },
        vencido: { label: "Vencido", class: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/30" },
        cancelado: { label: "Cancelado", class: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700/40" },
        aguardando_pagamento: { label: "Aguardando", class: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30" },
      },
      orcamento: {
        pendente: { label: "Aberto", class: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30" },
        aprovado: { label: "Aprovado", class: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30" },
        concluido: { label: "Concluído", class: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30" },
        rejeitado: { label: "Rejeitado", class: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/30" },
        cancelado: { label: "Cancelado", class: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700/40" },
      },
    }

    const item = config[tipo]?.[status] || { label: status, class: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700" }
    return (
      <Badge variant="outline" className={cn("text-[10px] py-0.5 px-2 font-medium rounded-full whitespace-nowrap", item.class)}>
        {item.label}
      </Badge>
    )
  }

  // Definição das colunas para a TanStack Table
  const columns = useMemo(
    () => [
      {
        accessorKey: "tipo",
        header: "Tipo",
        cell: ({ row }: any) => {
          const type = row.original.tipo
          return (
            <div className="flex items-center gap-2">
              <div className={cn(
                "p-1.5 rounded-lg border",
                type === "boleto" ? "bg-emerald-50/50 border-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/40" : "bg-blue-50/50 border-blue-100 text-blue-600 dark:bg-blue-950/20 dark:border-blue-900/40"
              )}>
                {type === "boleto" ? <Receipt className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {type === "boleto" ? "Boleto" : "Orçam."}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: "numero",
        header: "Número",
        cell: ({ row }: any) => <span className="font-mono font-bold text-xs">{row.original.numero}</span>,
      },
      {
        accessorKey: "cliente_nome",
        header: "Cliente",
        cell: ({ row }: any) => (
          <span className="text-xs font-medium text-foreground block max-w-[180px] truncate">
            {row.original.cliente_nome}
          </span>
        ),
      },
      {
        accessorKey: "valor",
        header: ({ column }: any) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-xs hover:bg-transparent p-0 font-semibold"
          >
            Valor
            <ArrowUpDown className="ml-1.5 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }: any) => (
          <span className="font-semibold text-xs text-foreground">
            {shouldShow ? formatCurrency(row.original.valor) : "R$ •••"}
          </span>
        ),
      },
      {
        accessorKey: "data",
        header: ({ column }: any) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-xs hover:bg-transparent p-0 font-semibold"
          >
            Emissão
            <ArrowUpDown className="ml-1.5 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }: any) => (
          <span className="text-xs text-muted-foreground">
            {new Date(row.original.data).toLocaleDateString("pt-BR")}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }: any) => getStatusBadge(row.original.status, row.original.tipo),
      },
      {
        id: "actions",
        cell: ({ row }: any) => (
          <Button variant="ghost" size="icon" asChild className="h-7 w-7 text-muted-foreground hover:text-foreground">
            <Link href={row.original.tipo === "boleto" ? "/financeiro" : "/orcamentos"}>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        ),
      },
    ],
    [shouldShow]
  )

  const table = useReactTable({
    data: recentItems,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  })

  if (loading) {
    return <DashboardSkeleton />
  }

  if (!stats) {
    return (
      <div className="flex-1 p-6 md:p-10 min-h-screen bg-transparent">
        <div className="text-center py-20 bg-card border border-border/80 rounded-xl max-w-md mx-auto shadow-xs p-6">
          <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-6 w-6 text-rose-600 dark:text-rose-400" />
          </div>
          <p className="text-foreground font-semibold">Erro ao carregar dados</p>
          <p className="text-muted-foreground text-sm mt-1">Por favor, recarregue a página ou tente novamente mais tarde.</p>
        </div>
      </div>
    )
  }

  const taxaConversao = stats.totalOrcamentos > 0 
    ? Math.round((stats.orcamentosAprovados / stats.totalOrcamentos) * 100) 
    : 0

  return (
    <div className="flex-1 space-y-6 p-6 md:p-10 min-h-screen bg-transparent text-foreground w-full">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="flex items-center gap-3">
          {logoMenu && (
            <img
              src={logoMenu || "/placeholder.svg"}
              alt="Logo"
              className="h-8 w-8 object-contain rounded-lg border border-border bg-card"
            />
          )}
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
              Dashboard
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground">
              Visão consolidada da performance financeira e clientes do sistema
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={toggleShowValues}
          className="hidden md:flex items-center justify-center gap-2 h-9 rounded-lg border border-border bg-card hover:bg-slate-100/50 shadow-xs"
        >
          {!shouldShow ? (
            <>
              <Eye className="h-4 w-4" />
              <span className="text-xs font-medium">Mostrar Valores</span>
            </>
          ) : (
            <>
              <EyeOff className="h-4 w-4" />
              <span className="text-xs font-medium">Ocultar Valores</span>
            </>
          )}
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        {/* KPI Clientes */}
        <Card
          onClick={() => router.push("/clientes")}
          className="cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-all border border-border/80 rounded-xl shadow-xs bg-card"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="text-2xl font-bold">{stats.totalClientes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-semibold text-foreground">{stats.clientesComContrato}</span> contratos ativos
            </p>
          </CardContent>
        </Card>

        {/* KPI Receita */}
        <Card
          onClick={() => router.push("/financeiro")}
          className="cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-all border border-border/80 rounded-xl shadow-xs bg-card"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Receita em Boletos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="text-2xl font-bold">{formatValueOrHide(stats.valorTotalBoletos)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-semibold text-foreground">{stats.totalBoletos}</span> boletos emitidos
            </p>
          </CardContent>
        </Card>

        {/* KPI Orçamentos */}
        <Card
          onClick={() => router.push("/orcamentos")}
          className="cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-all border border-border/80 rounded-xl shadow-xs bg-card"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total em Orçamentos</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="text-2xl font-bold">{formatValueOrHide(stats.valorTotalOrcamentos)}</div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
              <span className={cn(
                "font-semibold flex items-center",
                taxaConversao >= 50 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
              )}>
                {taxaConversao >= 50 ? <TrendingUp className="h-3.5 w-3.5 mr-0.5" /> : <TrendingDown className="h-3.5 w-3.5 mr-0.5" />}
                {taxaConversao}%
              </span>
              <span>conversão ({stats.orcamentosAprovados} aprovados)</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI Alertas */}
        <Card
          onClick={() => router.push("/financeiro?status=vencido")}
          className={cn(
            "cursor-pointer transition-all border rounded-xl shadow-xs bg-card",
            stats.boletosVencidos > 0 
              ? "border-rose-200 hover:border-rose-300 dark:border-rose-900/40" 
              : "border-border/80 hover:border-slate-300"
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Alertas Ativos</CardTitle>
            <AlertTriangle className={cn("h-4 w-4", stats.boletosVencidos > 0 ? "text-rose-500" : "text-muted-foreground")} />
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className={cn("text-2xl font-bold", stats.boletosVencidos > 0 && "text-rose-600 dark:text-rose-400")}>
              {stats.boletosVencidos}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-semibold text-foreground">{stats.boletosPendentes}</span> boletos pendentes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">
        {/* Recent Activity Table using TanStack Table */}
        <Card className="lg:col-span-2 border border-border/80 shadow-xs rounded-xl bg-card overflow-hidden">
          <CardHeader className="border-b border-border/40 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-semibold">Atividade Recente</CardTitle>
                <CardDescription className="text-xs">Últimos boletos e orçamentos emitidos no sistema</CardDescription>
              </div>
              
              {/* TanStack Table Search Filter Input */}
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Filtrar por cliente ou número..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-9 h-8.5 text-xs bg-background border-border"
                />
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {recentItems.length === 0 ? (
              <div className="text-center py-20 px-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="font-semibold text-sm">Nenhuma atividade registrada</p>
                <p className="text-xs text-muted-foreground mt-1">Cadastre clientes ou crie novos boletos para ver as movimentações recentes.</p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id} className="border-b border-border/40 bg-slate-50/50 dark:bg-slate-900/30">
                        {headerGroup.headers.map((header) => (
                          <th key={header.id} className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {table.getRowModel().rows.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/10 transition-colors">
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="p-4 align-middle">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TanStack Table Pagination Controls */}
            {recentItems.length > 0 && (
              <div className="p-4 border-t border-border/40 flex items-center justify-between gap-4">
                <div className="text-[10px] sm:text-xs text-muted-foreground">
                  Mostrando <span className="font-medium text-foreground">{table.getRowModel().rows.length}</span> de{" "}
                  <span className="font-medium text-foreground">{recentItems.length}</span> registros
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="h-8 px-2 text-xs border-border bg-card"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="h-8 px-2 text-xs border-border bg-card"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions Panel */}
        <Card className="border border-border/80 shadow-xs rounded-xl bg-card overflow-hidden">
          <CardHeader className="border-b border-border/40 p-6 bg-slate-50/30 dark:bg-slate-900/10">
            <CardTitle className="text-base font-semibold">Ações Rápidas</CardTitle>
            <CardDescription className="text-xs">Inicie cadastros ou abra novos formulários diretamente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 p-6">
            
            {/* Novo Cliente Drawer Button */}
            <Button
              variant="ghost"
              onClick={() => setIsClienteOpen(true)}
              className="w-full justify-start h-11 hover:bg-slate-100/50 hover:text-foreground rounded-lg group border border-transparent hover:border-border transition-all duration-200 text-xs font-semibold"
            >
              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 mr-3 border border-border group-hover:bg-slate-200 transition-colors">
                <Users className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
              </div>
              Cadastrar Novo Cliente
            </Button>

            {/* Novo Produto Drawer Button */}
            <Button
              variant="ghost"
              onClick={() => setIsProdutoOpen(true)}
              className="w-full justify-start h-11 hover:bg-slate-100/50 hover:text-foreground rounded-lg group border border-transparent hover:border-border transition-all duration-200 text-xs font-semibold"
            >
              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 mr-3 border border-border group-hover:bg-slate-200 transition-colors">
                <Package className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
              </div>
              Cadastrar Novo Produto
            </Button>

            {/* Novo Boleto Drawer Button */}
            <Button
              variant="ghost"
              onClick={() => setIsBoletoOpen(true)}
              className="w-full justify-start h-11 hover:bg-slate-100/50 hover:text-foreground rounded-lg group border border-transparent hover:border-border transition-all duration-200 text-xs font-semibold"
            >
              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 mr-3 border border-border group-hover:bg-slate-200 transition-colors">
                <DollarSign className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
              </div>
              Emitir Novo Boleto
            </Button>

            {/* Nova Ordem de Serviço Redirect Button */}
            <Button
              variant="ghost"
              className="w-full justify-start h-11 hover:bg-slate-100/50 hover:text-foreground rounded-lg group border border-transparent hover:border-border transition-all duration-200 text-xs font-semibold"
              asChild
            >
              <Link href="/ordem-servico/nova">
                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 mr-3 border border-border group-hover:bg-slate-200 transition-colors">
                  <Wrench className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                </div>
                Nova Ordem de Serviço
              </Link>
            </Button>

            {/* Novo Orçamento Redirect Button */}
            <Button
              variant="ghost"
              className="w-full justify-start h-11 hover:bg-slate-100/50 hover:text-foreground rounded-lg group border border-transparent hover:border-border transition-all duration-200 text-xs font-semibold"
              asChild
            >
              <Link href="/orcamentos/novo">
                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 mr-3 border border-border group-hover:bg-slate-200 transition-colors">
                  <Calculator className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                </div>
                Novo Orçamento
              </Link>
            </Button>

            {/* Nova Proposta Redirect Button */}
            <Button
              variant="ghost"
              className="w-full justify-start h-11 hover:bg-slate-100/50 hover:text-foreground rounded-lg group border border-transparent hover:border-border transition-all duration-200 text-xs font-semibold"
              asChild
            >
              <Link href="/contratos/proposta/nova">
                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 mr-3 border border-border group-hover:bg-slate-200 transition-colors">
                  <FileContract className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                </div>
                Nova Proposta Comercial
              </Link>
            </Button>

            {/* System Status Panel */}
            <div className="mt-4 p-4 bg-muted/40 border border-border/80 rounded-xl">
              <h4 className="font-semibold text-xs text-foreground mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Status do Sistema
              </h4>
              <div className="space-y-2 text-[10px] font-medium text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Servidores</span>
                  <Badge variant="outline" className="bg-emerald-50/50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30 text-[9px] py-0 px-2 rounded-full">
                    Estável
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Banco de Dados</span>
                  <Badge variant="outline" className="bg-emerald-50/50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30 text-[9px] py-0 px-2 rounded-full">
                    Conectado
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attention / Alerts Panel */}
      {(stats.boletosVencidos > 0 || stats.boletosPendentes > 5) && (
        <Card className="border border-rose-200/60 dark:border-rose-900/30 bg-rose-500/10 dark:bg-rose-950/20 rounded-xl shadow-xs overflow-hidden w-full">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-rose-800 dark:text-rose-300 text-sm">Pendências Financeiras</h3>
                <p className="text-xs text-rose-700/80 dark:text-rose-400 mt-1">
                  {stats.boletosVencidos > 0 && (
                    <span>
                      Você possui <strong className="text-rose-900 dark:text-rose-200 font-bold">{stats.boletosVencidos} boleto{stats.boletosVencidos > 1 ? "s" : ""} vencido{stats.boletosVencidos > 1 ? "s" : ""}</strong>
                      {stats.boletosPendentes > 5 && " e "}
                    </span>
                  )}
                  {stats.boletosPendentes > 5 && (
                    <span>
                      <strong className="text-amber-800 dark:text-amber-200 font-bold">{stats.boletosPendentes} boletos pendentes</strong> aguardando pagamento
                    </span>
                  )}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 border-rose-300 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 hover:bg-rose-600 dark:hover:bg-rose-950 dark:hover:text-rose-300 hover:text-white hover:border-rose-600 transition-all font-medium text-xs h-8 bg-transparent"
                  asChild
                >
                  <Link href="/financeiro?status=vencido">
                    Visualizar no Extrato
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Drawers / Sheets para Ações Rápidas */}
      <ClienteFormDialog
        open={isClienteOpen}
        onOpenChange={setIsClienteOpen}
        asDrawer={true}
        onSuccess={() => {
          setIsClienteOpen(false)
          loadData()
        }}
      />

      <ProdutoFormDialog
        open={isProdutoOpen}
        onOpenChange={setIsProdutoOpen}
        asDrawer={true}
        onSuccess={() => {
          setIsProdutoOpen(false)
          loadData()
        }}
      />

      <NovoBoletoDialog
        open={isBoletoOpen}
        onOpenChange={setIsBoletoOpen}
        onSuccess={() => {
          setIsBoletoOpen(false)
          loadData()
        }}
      />
    </div>
  )
}
