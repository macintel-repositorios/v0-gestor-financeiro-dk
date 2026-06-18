"use client"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, FileText, User, DollarSign, Calendar } from "lucide-react"
import type { Cliente } from "@/components/cliente-combobox"

interface ParcelaPreview {
  parcela: number
  numero_boleto: string
  valor: number
  vencimento: string
  status: string
  descricao?: string
  multa_percentual?: number
  juros_mes_percentual?: number
}

interface PreviewParcelasDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  parcelas: ParcelaPreview[]
  cliente: Cliente | null
  numeroNota: string
  valorTotal: number
  formaPagamento: string
  multaPercentual: number
  jurosMesPercentual: number
  desconto?: number
  onEmitir: () => void
  onVoltar: () => void
  loading: boolean
}

export function PreviewParcelasDialog({
  open,
  onOpenChange,
  parcelas,
  cliente,
  numeroNota,
  valorTotal,
  formaPagamento,
  multaPercentual,
  jurosMesPercentual,
  desconto,
  onEmitir,
  onVoltar,
  loading,
}: PreviewParcelasDialogProps) {
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor)
  }

  const formatarData = (data: string) => {
    const dataCorreta = new Date(data + "T00:00:00")
    return dataCorreta.toLocaleDateString("pt-BR")
  }

  const getStatusBadge = (status: string) => {
    if (status === "Vencido") {
      return (
        <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 dark:border-red-900/30">
          Vencido
        </Badge>
      )
    }
    return (
      <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 dark:border-amber-900/30">
        Pendente
      </Badge>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl lg:max-w-4xl h-full flex flex-col p-0 gap-0 overflow-hidden border-l border-border shadow-2xl bg-card text-foreground">
        <SheetHeader className="border-b border-border p-6 flex-shrink-0 bg-muted/30">
          <SheetTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <FileText className="h-5 w-5" />
            </div>
            Preview das Parcelas
          </SheetTitle>
          <SheetDescription className="text-muted-foreground text-sm">
            Confirme as parcelas antes de emitir os boletos
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto bg-card p-6">
          <div className="space-y-6">
            {/* Informações do Cliente e Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border border-border/80 bg-slate-900/5 dark:bg-slate-900/40 hover:border-indigo-500/20 transition-all duration-200">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Informações do Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5 px-4 pb-3">
                  <p className="font-semibold text-sm text-foreground">{cliente?.nome || "Não informado"}</p>
                  {cliente?.cnpj && <p className="text-xs text-muted-foreground">CNPJ: {cliente.cnpj}</p>}
                  {cliente?.cpf && <p className="text-xs text-muted-foreground">CPF: {cliente.cpf}</p>}
                  {cliente?.email && <p className="text-xs text-muted-foreground">Email: {cliente.email}</p>}
                </CardContent>
              </Card>

              <Card className="border border-border/80 bg-slate-900/5 dark:bg-slate-900/40 hover:border-emerald-500/20 transition-all duration-200">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Resumo Financeiro
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5 px-4 pb-3">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Número da Nota:</span>
                    <span className="font-medium text-foreground">{numeroNota}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Valor Total:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatarMoeda(valorTotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Forma de Pagamento:</span>
                    <span className="font-medium text-foreground capitalize">{formaPagamento}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Total de Parcelas:</span>
                    <span className="font-medium text-foreground">{parcelas.length}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Multa por Atraso:</span>
                    <span className="font-medium text-foreground">{multaPercentual.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Juros ao Mês:</span>
                    <span className="font-medium text-foreground">{jurosMesPercentual.toFixed(2)}%</span>
                  </div>
                  {desconto !== undefined && desconto > 0 && (
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">Desconto:</span>
                      <span className="font-semibold text-rose-600 dark:text-rose-400">-{desconto.toFixed(2)}%</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Tabela de Parcelas */}
            <Card className="border border-border/80 bg-slate-900/5 dark:bg-slate-900/10">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Calendar className="h-4 w-4 text-indigo-500" />
                  Detalhamento das Parcelas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="rounded-b-lg border-t border-border/60 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 dark:bg-slate-900/60 border-b border-border/60 hover:bg-transparent">
                        <TableHead className="font-semibold w-20 text-xs text-foreground/85">Parcela</TableHead>
                        <TableHead className="font-semibold w-40 text-xs text-foreground/85">Número</TableHead>
                        <TableHead className="font-semibold text-xs text-foreground/85">Descrição</TableHead>
                        <TableHead className="font-semibold w-28 text-xs text-foreground/85">Valor</TableHead>
                        <TableHead className="font-semibold w-28 text-xs text-foreground/85">Vencimento</TableHead>
                        <TableHead className="font-semibold w-16 text-xs text-center text-foreground/85">Multa</TableHead>
                        <TableHead className="font-semibold w-16 text-xs text-center text-foreground/85">Juros</TableHead>
                        <TableHead className="font-semibold w-24 text-xs text-foreground/85">Situação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parcelas.map((parcela) => (
                        <TableRow key={parcela.parcela} className="hover:bg-muted/25 dark:hover:bg-slate-900/30 border-b border-border/40 last:border-0">
                          <TableCell className="font-medium py-2">
                            <Badge variant="outline" className="text-xs bg-background/50 dark:bg-slate-950/50 border-border">
                              {parcela.parcela}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs py-2 text-foreground/90">{parcela.numero_boleto}</TableCell>
                          <TableCell className="text-xs py-2 text-muted-foreground max-w-[200px] truncate" title={parcela.descricao}>
                            {parcela.descricao || "-"}
                          </TableCell>
                          <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs py-2">
                            {formatarMoeda(parcela.valor)}
                          </TableCell>
                          <TableCell className="text-xs py-2 text-foreground/90">{formatarData(parcela.vencimento)}</TableCell>
                          <TableCell className="text-xs py-2 text-center text-rose-600 dark:text-rose-400/90 font-mono">
                            {parcela.multa_percentual?.toFixed(2)}%
                          </TableCell>
                          <TableCell className="text-xs py-2 text-center text-amber-600 dark:text-amber-400/90 font-mono">
                            {parcela.juros_mes_percentual?.toFixed(2)}%
                          </TableCell>
                          <TableCell className="py-2">{getStatusBadge(parcela.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Resumo Final */}
            <Card className="border border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 to-indigo-500/5 dark:from-emerald-950/20 dark:to-indigo-950/20 shadow-xs">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <span className="font-semibold text-sm text-foreground">Total Geral:</span>
                  </div>
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatarMoeda(parcelas.reduce((acc, p) => acc + p.valor, 0))}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-border bg-muted/30 flex-shrink-0">
          <Button
            variant="outline"
            onClick={onVoltar}
            disabled={loading}
            className="border-border hover:bg-muted bg-card text-foreground text-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Button
            onClick={onEmitir}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all duration-200 text-sm font-medium"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Emitindo...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Emitir Boletos
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
