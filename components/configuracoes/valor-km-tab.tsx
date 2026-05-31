"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Calculator, MapPin, FileText, DollarSign, TrendingUp } from "lucide-react"
import { toast } from "sonner"

interface ValorKmConfig {
  id?: number
  valor_por_km: number
  descricao?: string
  aplicacao?: string
}

export function ValorKmTab() {
  const [config, setConfig] = useState<ValorKmConfig>({
    valor_por_km: 1.5,
    descricao: "",
    aplicacao: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [distanciaExemplo, setDistanciaExemplo] = useState(10)
  const [duracaoExemplo, setDuracaoExemplo] = useState(1)

  useEffect(() => {
    carregarConfig()
  }, [])

  const carregarConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/configuracoes/valor-km")
      const data = await response.json()

      if (data.success && data.data) {
        setConfig({
          id: data.data.id,
          valor_por_km: Number(data.data.valor_por_km) || 1.5,
          descricao: data.data.descricao || "",
          aplicacao: data.data.aplicacao || "",
        })
      } else {
        setConfig({
          valor_por_km: 1.5,
          descricao: "Valor padrão por quilômetro",
          aplicacao: "Usado em orçamentos e contratos",
        })
      }
    } catch (error) {
      console.error("Erro ao carregar configuração:", error)
      toast.error("Erro ao carregar configuração")
      setConfig({
        valor_por_km: 1.5,
        descricao: "Valor padrão por quilômetro",
        aplicacao: "Usado em orçamentos e contratos",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSalvar = async () => {
    try {
      setSaving(true)

      if (!config.valor_por_km || config.valor_por_km <= 0) {
        toast.error("Valor por KM deve ser maior que zero")
        return
      }

      const response = await fetch("/api/configuracoes/valor-km", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Configuração salva com sucesso!")
        await carregarConfig()
      } else {
        toast.error(data.error || "Erro ao salvar configuração")
      }
    } catch (error) {
      console.error("Erro ao salvar:", error)
      toast.error("Erro ao salvar configuração")
    } finally {
      setSaving(false)
    }
  }

  const calcularExemplo = (distancia: number, duracao: number) => {
    const valorKm = config?.valor_por_km || 1.5
    return (distancia * valorKm * 2 * duracao).toFixed(2)
  }

  const formatarValor = (valor: number) => {
    return valor?.toFixed(2) || "1.50"
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
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">🚗 Valor por Quilômetro</h2>
        <p className="text-muted-foreground">Configure o valor cobrado por quilômetro rodado</p>
      </div>

      <div className="grid gap-6">
        <Card className="border border-border bg-card text-foreground">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">💰 Valor por Quilômetro</CardTitle>
            <CardDescription className="text-muted-foreground">Configure o valor cobrado por quilômetro rodado nas visitas técnicas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="valor-km" className="text-muted-foreground">Valor por KM (R$)</Label>
                  <Input
                    id="valor-km"
                    type="number"
                    step="0.01"
                    min="0"
                    value={config.valor_por_km || ""}
                    onChange={(e) => setConfig({ ...config, valor_por_km: Number(e.target.value) })}
                    className="text-lg font-semibold bg-background border-border text-foreground"
                    placeholder="1.50"
                  />
                </div>
                <div>
                  <Label htmlFor="descricao" className="text-muted-foreground">Descrição (opcional)</Label>
                  <Input
                    id="descricao"
                    value={config.descricao || ""}
                    onChange={(e) => setConfig({ ...config, descricao: e.target.value })}
                    placeholder="Descrição da configuração"
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div>
                  <Label htmlFor="aplicacao" className="text-muted-foreground">Aplicação (opcional)</Label>
                  <Input
                    id="aplicacao"
                    value={config.aplicacao || ""}
                    onChange={(e) => setConfig({ ...config, aplicacao: e.target.value })}
                    placeholder="Onde será aplicado"
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <Button
                  onClick={handleSalvar}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={saving || !config.valor_por_km || config.valor_por_km <= 0}
                >
                  {saving ? "Salvando..." : "💾 Salvar Configurações"}
                </Button>
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    <span className="text-sm text-emerald-400 font-medium">Valor atual: R$ {formatarValor(config.valor_por_km)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-muted-foreground">Valor cobrado por quilômetro rodado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-muted-foreground">Usado em orçamentos e contratos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-muted-foreground">Cálculo: ida + volta (× 2)</span>
                  </div>
                </div>
              </div>

              <div className="bg-purple-500/5 border border-purple-500/20 p-5 rounded-xl space-y-4">
                <h4 className="font-semibold text-foreground flex items-center gap-2 border-b border-purple-500/20 pb-2">
                  <Calculator className="w-5 h-5 text-purple-400" />
                  Calculadora de Exemplo
                </h4>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Fórmula:</Label>
                    <p className="text-sm text-purple-400 font-semibold mt-0.5">
                      Distância × R$ {formatarValor(config.valor_por_km)} × 2 × Duração
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Distância (km)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={distanciaExemplo}
                        onChange={(e) => setDistanciaExemplo(Number(e.target.value))}
                        className="h-9 bg-background border-border text-foreground"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Duração (dias)</Label>
                      <Input
                        type="number"
                        min="1"
                        value={duracaoExemplo}
                        onChange={(e) => setDuracaoExemplo(Number(e.target.value))}
                        className="h-9 bg-background border-border text-foreground"
                      />
                    </div>
                  </div>
                  <div className="bg-background border border-border p-3 rounded-lg text-sm space-y-1">
                    <p className="text-sm font-semibold text-foreground border-b border-border pb-1.5 mb-1.5">Resultados:</p>
                    <p className="text-xs text-muted-foreground">10km × 1 dia = <span className="text-purple-400 font-medium">R$ {calcularExemplo(10, 1)}</span></p>
                    <p className="text-xs text-muted-foreground">15km × 3 dias = <span className="text-purple-400 font-medium">R$ {calcularExemplo(15, 3)}</span></p>
                    <p className="text-xs text-foreground font-semibold pt-1 border-t border-border mt-1">
                      {distanciaExemplo}km × {duracaoExemplo} dia(s) = <span className="text-purple-400">R$ {calcularExemplo(distanciaExemplo, duracaoExemplo)}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card text-foreground">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">📋 Aplicado em:</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-purple-500/10 border-purple-500/20 text-purple-400">
                    <Calculator className="w-3 h-3 mr-1" />
                    Cálculo de orçamentos (custo distância)
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-purple-500/10 border-purple-500/20 text-purple-400">
                    <FileText className="w-3 h-3 mr-1" />
                    Contratos de serviços
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-purple-500/10 border-purple-500/20 text-purple-400">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Propostas de conservação
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-purple-500/10 border-purple-500/20 text-purple-400">
                    <DollarSign className="w-3 h-3 mr-1" />
                    Relatórios financeiros
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card text-foreground">
          <CardHeader>
            <CardTitle className="text-foreground">▶ Informações Técnicas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• O valor é aplicado automaticamente nos cálculos de orçamentos</p>
              <p>• Considera ida e volta (multiplicado por 2)</p>
              <p>• Pode ser ajustado conforme necessidade do negócio</p>
              <p>• Configuração única mantida no sistema</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
