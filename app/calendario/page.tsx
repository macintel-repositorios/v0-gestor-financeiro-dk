"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarCustom } from "@/components/calendar-custom"
import { Skeleton } from "@/components/ui/skeleton"
import { CalendarIcon, Clock, User, MapPin, AlertCircle, Eye } from "lucide-react"
import Link from "next/link"
import type { OrdemServico } from "@/types/ordem-servico"
import { useLogos } from "@/hooks/use-logos"

type PeriodFilter = "all" | "manha" | "tarde" | "integral"

export default function CalendarioPage() {
  const [loading, setLoading] = useState(true)
  const [ordensAgendadas, setOrdensAgendadas] = useState<OrdemServico[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [ordensDoDay, setOrdensDoDay] = useState<OrdemServico[]>([])
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all")
  const { logos, loading: logosLoading } = useLogos()

  useEffect(() => {
    carregarOrdensAgendadas()
  }, [])

  useEffect(() => {
    if (selectedDate) {
      filtrarOrdensDoDia(selectedDate)
    }
  }, [selectedDate, ordensAgendadas, periodFilter])

  const carregarOrdensAgendadas = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/ordens-servico?situacao=agendada&limit=1000")
      const data = await response.json()

      if (data.success) {
        setOrdensAgendadas(data.data)
      }
    } catch (error) {
      console.error("Erro ao carregar ordens agendadas:", error)
    } finally {
      setLoading(false)
    }
  }

  const filtrarOrdensDoDia = (date: Date) => {
    const dateString = date.toISOString().split("T")[0]
    let ordens = ordensAgendadas.filter((os) => {
      if (!os.data_agendamento) return false
      const osDate = os.data_agendamento.split("T")[0]
      return osDate === dateString
    })

    if (periodFilter === "manha") {
      ordens = ordens.filter((os) => os.periodo_agendamento === "manha")
    } else if (periodFilter === "tarde") {
      ordens = ordens.filter((os) => os.periodo_agendamento === "tarde")
    } else if (periodFilter === "integral") {
      ordens = ordens.filter((os) => os.periodo_agendamento === "integral")
    }

    setOrdensDoDay(ordens)
  }

  const getDatesWithOrders = () => {
    return ordensAgendadas
      .filter((os) => os.data_agendamento)
      .map((os) => new Date(os.data_agendamento!.split("T")[0] + "T12:00:00"))
  }

  const getDatesWithPeriods = () => {
    const periodsMap = new Map<string, { manha: boolean; tarde: boolean; integral: boolean }>()

    ordensAgendadas
      .filter((os) => os.data_agendamento)
      .forEach((os) => {
        const dateKey = os.data_agendamento!.split("T")[0]
        const existing = periodsMap.get(dateKey) || { manha: false, tarde: false, integral: false }

        if (os.periodo_agendamento === "manha") {
          existing.manha = true
        } else if (os.periodo_agendamento === "tarde") {
          existing.tarde = true
        } else if (os.periodo_agendamento === "integral") {
          existing.integral = true
        }

        periodsMap.set(dateKey, existing)
      })

    return Array.from(periodsMap.entries()).map(([dateStr, periods]) => ({
      date: new Date(dateStr + "T12:00:00"),
      ...periods,
    }))
  }

  const getPeriodoLabel = (periodo?: string) => {
    if (periodo === "manha") return "Manhã"
    if (periodo === "tarde") return "Tarde"
    if (periodo === "integral") return "Integral"
    return "Não especificado"
  }

  const getPeriodoBadgeColor = (periodo?: string) => {
    if (periodo === "manha") return "bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border-0"
    if (periodo === "tarde") return "bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300 border-0"
    if (periodo === "integral") return "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-0"
    return "bg-muted text-muted-foreground border-0"
  }

  const handlePeriodFilterClick = (filter: PeriodFilter) => {
    setPeriodFilter(filter === periodFilter ? "all" : filter)
  }

  const datesWithOrders = getDatesWithOrders()
  const datesWithPeriods = getDatesWithPeriods()

  const totalManha = ordensAgendadas.filter((os) => os.periodo_agendamento === "manha").length
  const totalTarde = ordensAgendadas.filter((os) => os.periodo_agendamento === "tarde").length
  const totalIntegral = ordensAgendadas.filter((os) => os.periodo_agendamento === "integral").length

  const podeExecutar = (dataAgendamento: string | undefined): boolean => {
    if (!dataAgendamento) return false

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const dataAgenda = new Date(dataAgendamento.split("T")[0] + "T12:00:00")
    dataAgenda.setHours(0, 0, 0, 0)

    return hoje.getTime() === dataAgenda.getTime()
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        {logos.menu && (
          <img
            src={logos.menu || "/placeholder.svg"}
            alt="Logo"
            className="h-10 w-10 object-contain rounded-lg border border-border bg-card p-1"
          />
        )}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
            Calendário de Agendamentos
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5 font-medium">Visualize e gerencie ordens de serviço agendadas</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          className={`border border-border shadow-xs hover:border-muted-foreground/30 transition-all duration-200 bg-card cursor-pointer select-none ${
            periodFilter === "all" ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-background" : ""
          }`}
          onClick={() => setPeriodFilter("all")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-xs lg:text-sm font-semibold text-muted-foreground">Total Agendadas</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground/70" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl lg:text-2xl font-bold text-foreground">{ordensAgendadas.length}</div>
            <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">ordens agendadas</p>
          </CardContent>
        </Card>

        <Card
          className={`border border-border shadow-xs hover:border-muted-foreground/30 transition-all duration-200 bg-card cursor-pointer select-none ${
            periodFilter === "manha" ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-background" : ""
          }`}
          onClick={() => handlePeriodFilterClick("manha")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-xs lg:text-sm font-semibold text-muted-foreground">Manhã</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground/70" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl lg:text-2xl font-bold text-foreground">{totalManha}</div>
            <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">período da manhã (9h-12h)</p>
          </CardContent>
        </Card>

        <Card
          className={`border border-border shadow-xs hover:border-muted-foreground/30 transition-all duration-200 bg-card cursor-pointer select-none ${
            periodFilter === "tarde" ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-background" : ""
          }`}
          onClick={() => handlePeriodFilterClick("tarde")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-xs lg:text-sm font-semibold text-muted-foreground">Tarde</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground/70" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl lg:text-2xl font-bold text-foreground">{totalTarde}</div>
            <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">período da tarde (13h-17h)</p>
          </CardContent>
        </Card>

        <Card
          className={`border border-border shadow-xs hover:border-muted-foreground/30 transition-all duration-200 bg-card cursor-pointer select-none ${
            periodFilter === "integral" ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-background" : ""
          }`}
          onClick={() => handlePeriodFilterClick("integral")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-xs lg:text-sm font-semibold text-muted-foreground">Integral</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground/70" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl lg:text-2xl font-bold text-foreground">{totalIntegral}</div>
            <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">período integral (9h-17h)</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar and Orders */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Calendar */}
        <Card className="border border-border shadow-sm bg-card overflow-hidden">
          <CardHeader className="bg-muted/40 border-b border-border p-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-sm font-semibold text-foreground">Calendário</CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Selecione uma data para ver as ordens
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <CalendarCustom
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              highlightedDates={getDatesWithOrders()}
              datesWithPeriods={getDatesWithPeriods()}
              className="rounded-md border shadow-xs"
            />
            <div className="mt-4 p-3 bg-muted/40 rounded-lg border border-border space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                <div className="w-4 h-4 bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded"></div>
                <span>Dias com agendamentos</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                <div className="w-4 h-4 border border-indigo-500 rounded"></div>
                <span>Dia selecionado</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                <div className="w-4 h-4 bg-orange-500/10 border border-orange-400 rounded flex items-center justify-center">
                  <span className="text-[6px] font-bold text-orange-600">Hoje</span>
                </div>
                <span>Dia atual</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Manhã (9h-12h)</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span>Tarde (13h-17h)</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span>Integral (9h-17h)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders of Selected Day */}
        <Card className="border border-border shadow-sm bg-card overflow-hidden">
          <CardHeader className="bg-muted/40 border-b border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle className="text-sm font-semibold text-foreground">
                    Ordens do Dia - {selectedDate?.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    {ordensDoDay.length} ordem(ns) agendada(s)
                    {periodFilter !== "all" && ` - ${getPeriodoLabel(periodFilter)}`}
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {ordensDoDay.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground/60 mb-3" />
                <p className="text-muted-foreground font-medium text-sm">Nenhuma ordem agendada</p>
                <p className="text-xs text-muted-foreground/80 mt-1">
                  {periodFilter !== "all"
                    ? `Nenhuma ordem para este período (${getPeriodoLabel(periodFilter)}). Clique nos cards acima para mudar o filtro.`
                    : "Selecione outro dia no calendário"}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {ordensDoDay.map((os) => (
                  <Card key={os.id} className="border border-border bg-card hover:border-muted-foreground/30 hover:shadow-xs transition-all duration-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">OS {os.numero}</span>
                            {os.periodo_agendamento && (
                              <Badge className={`${getPeriodoBadgeColor(os.periodo_agendamento)} text-[10px] px-1.5 py-0`}>
                                <Clock className="w-3 h-3 mr-1" />
                                {getPeriodoLabel(os.periodo_agendamento)}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {os.data_agendamento
                              ? new Date(os.data_agendamento.split("T")[0] + "T12:00:00").toLocaleDateString("pt-BR")
                              : "Não informada"}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2 text-xs">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium text-foreground">{os.cliente_nome}</span>
                        </div>
                        {os.cliente_endereco && (
                          <div className="flex items-start gap-2 text-xs">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground text-[11px]">{os.cliente_endereco}</span>
                          </div>
                        )}
                        {os.tecnico_name && (
                          <div className="flex items-center gap-2 text-xs">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground text-[11px]">Técnico: {os.tecnico_name}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-3 border-t border-border/40">
                        <Link href={`/ordem-servico/${os.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full h-8 text-xs border-border bg-card">
                            <Eye className="h-3.5 w-3.5 mr-1.5" />
                            Visualizar
                          </Button>
                        </Link>
                        {podeExecutar(os.data_agendamento) ? (
                          <Link href={`/ordem-servico/${os.id}/editar`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full h-8 text-xs bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-200 dark:border-emerald-900/50">
                              Executar
                            </Button>
                          </Link>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 text-xs bg-muted text-muted-foreground cursor-not-allowed border-border"
                            disabled
                          >
                            Executar
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
