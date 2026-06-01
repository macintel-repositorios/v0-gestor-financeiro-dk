"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Cliente {
  id: number
  codigo: string
  nome: string
  endereco: string
  tem_contrato: boolean
  dia_contrato: number | null
  contrato_numero: string | null
  contrato_status: string | null
  ja_tem_os_no_mes: boolean
  os_existente?: { id: number; numero: string }
}

interface LotePreventivasDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function LotePreventivasDialog({ open, onOpenChange, onSuccess }: LotePreventivasDialogProps) {
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clientesSelecionados, setClientesSelecionados] = useState<number[]>([])
  const [mesReferencia, setMesReferencia] = useState("")
  const [dataAgendamento, setDataAgendamento] = useState("")
  const [periodoAgendamento, setPeriodoAgendamento] = useState<"" | "manha" | "tarde" | "integral">("")
  const [etapa, setEtapa] = useState<"configuracao" | "preview" | "resultado">("configuracao")
  const [resultado, setResultado] = useState<any>(null)

  // Definir mês atual como padrão
  useEffect(() => {
    if (open) {
      const hoje = new Date()
      const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`
      setMesReferencia(mesAtual)
      setEtapa("configuracao")
      setClientesSelecionados([])
      setResultado(null)
    }
  }, [open])

  // Buscar clientes quando o mês mudar
  useEffect(() => {
    if (mesReferencia && open) {
      buscarClientes()
    }
  }, [mesReferencia, open])

  const buscarClientes = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/ordens-servico/lote?mes=${mesReferencia}`)
      const data = await response.json()

      if (data.success) {
        setClientes(data.data)
        // Selecionar automaticamente clientes que não têm OS no mês
        const clientesElegiveis = data.data.filter((c: Cliente) => !c.ja_tem_os_no_mes).map((c: Cliente) => c.id)
        setClientesSelecionados(clientesElegiveis)
      } else {
        toast.error("Erro ao buscar clientes")
      }
    } catch (error) {
      console.error(error)
      toast.error("Erro ao buscar clientes")
    } finally {
      setLoading(false)
    }
  }

  const toggleCliente = (clienteId: number) => {
    setClientesSelecionados((prev) =>
      prev.includes(clienteId) ? prev.filter((id) => id !== clienteId) : [...prev, clienteId],
    )
  }

  const toggleTodos = () => {
    if (clientesSelecionados.length === clientes.filter((c) => !c.ja_tem_os_no_mes).length) {
      setClientesSelecionados([])
    } else {
      setClientesSelecionados(clientes.filter((c) => !c.ja_tem_os_no_mes).map((c) => c.id))
    }
  }

  const criarOrdens = async () => {
    if (clientesSelecionados.length === 0) {
      toast.error("Selecione pelo menos um cliente")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/ordens-servico/lote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientes_ids: clientesSelecionados,
          mes_referencia: mesReferencia,
          data_agendamento: dataAgendamento || null,
          periodo_agendamento: periodoAgendamento || null,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setResultado(data.data)
        setEtapa("resultado")
        toast.success(data.message)
        if (onSuccess) onSuccess()
      } else {
        toast.error(data.error || "Erro ao criar ordens")
      }
    } catch (error) {
      console.error(error)
      toast.error("Erro ao criar ordens em lote")
    } finally {
      setLoading(false)
    }
  }

  const renderConfiguracao = () => (
    <div className="space-y-6 text-foreground">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="mes" className="text-sm font-semibold">Mês de Referência</Label>
          <Input id="mes" type="month" value={mesReferencia} onChange={(e) => setMesReferencia(e.target.value)} className="bg-background border-border text-foreground" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="data" className="text-sm font-semibold">Data de Agendamento (Opcional)</Label>
          <Input id="data" type="date" value={dataAgendamento} onChange={(e) => setDataAgendamento(e.target.value)} className="bg-background border-border text-foreground" />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">Período (Opcional)</Label>
        <Select value={periodoAgendamento || undefined} onValueChange={(v: any) => setPeriodoAgendamento(v)}>
          <SelectTrigger className="bg-background border-border text-foreground">
            <SelectValue placeholder="Selecione o período" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border text-foreground">
            <SelectItem value="manha">Manhã</SelectItem>
            <SelectItem value="tarde">Tarde</SelectItem>
            <SelectItem value="integral">Integral</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Clientes com Contrato Ativo</Label>
          <Button variant="outline" size="sm" onClick={toggleTodos} className="border-border hover:bg-muted text-foreground">
            {clientesSelecionados.length === clientes.filter((c) => !c.ja_tem_os_no_mes).length
              ? "Desmarcar Todos"
              : "Selecionar Todos"}
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="max-h-[400px] space-y-2 overflow-y-auto rounded-md border border-border bg-muted/10 p-4">
            {clientes.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">Nenhum cliente com contrato encontrado</p>
            ) : (
              clientes.map((cliente) => (
                <div
                  key={cliente.id}
                  className={`flex items-start space-x-3 rounded-lg border border-border p-3 transition-colors ${
                    cliente.ja_tem_os_no_mes ? "bg-muted/50 opacity-60" : "bg-card hover:bg-muted/40"
                  }`}
                >
                  <Checkbox
                    checked={clientesSelecionados.includes(cliente.id)}
                    onCheckedChange={() => toggleCliente(cliente.id)}
                    disabled={cliente.ja_tem_os_no_mes}
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground text-sm">{cliente.nome}</p>
                      {cliente.ja_tem_os_no_mes && (
                        <span className="flex items-center gap-1 text-xs text-orange-500 font-medium bg-orange-500/10 px-2 py-0.5 rounded-full">
                          <AlertCircle className="h-3 w-3" />
                          Já tem OS no mês ({cliente.os_existente?.numero})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{cliente.endereco}</p>
                    <div className="flex gap-2 text-[10px] text-muted-foreground">
                      <span>Código: {cliente.codigo}</span>
                      {cliente.dia_contrato && <span>• Dia do Contrato: {cliente.dia_contrato}</span>}
                      {cliente.contrato_numero && <span>• Contrato: {cliente.contrato_numero}</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div className="rounded-lg bg-blue-500/10 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50 p-4 text-sm">
          <p className="font-semibold">Selecionados: {clientesSelecionados.length} clientes</p>
          <p className="mt-1 text-xs opacity-90">
            Serão criadas {clientesSelecionados.length} ordens de serviço preventivas para o mês {mesReferencia}
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border text-foreground">
          Cancelar
        </Button>
        <Button onClick={criarOrdens} disabled={loading || clientesSelecionados.length === 0} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calendar className="mr-2 h-4 w-4" />}
          Criar {clientesSelecionados.length} Ordens
        </Button>
      </div>
    </div>
  )

  const renderResultado = () => (
    <div className="space-y-6 text-foreground">
      <div className="space-y-4">
        <div className="rounded-lg bg-emerald-500/10 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-semibold">Ordens Criadas com Sucesso</h3>
          </div>
          <p className="mt-2 text-sm opacity-90">{resultado?.sucesso.length} ordens de serviço foram criadas</p>
        </div>

        {resultado?.sucesso.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Ordens Criadas:</Label>
            <div className="max-h-[300px] space-y-2 overflow-y-auto rounded-md border border-border p-4 bg-muted/10">
              {resultado.sucesso.map((item: any) => (
                <div key={item.ordem_id} className="flex items-center justify-between rounded-lg bg-emerald-500/5 border border-emerald-500/10 dark:border-emerald-500/20 p-3">
                  <div>
                    <p className="font-semibold text-sm">{item.cliente_nome}</p>
                    <p className="text-xs text-muted-foreground">OS #{item.numero_os}</p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              ))}
            </div>
          </div>
        )}

        {resultado?.erros.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-red-600 dark:text-red-400">Erros:</Label>
            <div className="max-h-[200px] space-y-2 overflow-y-auto rounded-md border border-red-500/20 p-4 bg-muted/10">
              {resultado.erros.map((item: any, index: number) => (
                <div key={index} className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-800 dark:text-red-300">
                  <p className="text-sm font-medium">Cliente ID: {item.cliente_id}</p>
                  <p className="text-xs opacity-90">{item.erro}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={() => onOpenChange(false)} className="bg-primary text-primary-foreground">Fechar</Button>
      </div>
    </div>
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-4xl h-full flex flex-col p-6 overflow-y-auto border-l border-border shadow-2xl bg-card text-foreground">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2 text-xl font-bold">
            <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            {etapa === "configuracao" && "Criar Ordens Preventivas em Lote"}
            {etapa === "resultado" && "Resultado da Criação"}
          </SheetTitle>
          <SheetDescription>
            {etapa === "configuracao" && "Selecione o mês de referência e os clientes com contrato ativo para gerar as ordens de serviço preventivas."}
            {etapa === "resultado" && "Confira o resultado do processamento das ordens em lote."}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 pt-2">
          {etapa === "configuracao" && renderConfiguracao()}
          {etapa === "resultado" && renderResultado()}
        </div>
      </SheetContent>
    </Sheet>
  )
}
