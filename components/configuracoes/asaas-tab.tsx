"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, CheckCircle2, CreditCard, ExternalLink, Loader2, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function AsaasTab() {
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const [environment, setEnvironment] = useState<"sandbox" | "production">("production")
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "unknown">("unknown")
  const { toast } = useToast()

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      const response = await fetch("/api/asaas/status")
      const result = await response.json()
      
      if (result.success && result.data?.connected) {
        setConnectionStatus("connected")
        setEnvironment(result.data.environment || "production")
      } else {
        setConnectionStatus("disconnected")
      }
    } catch {
      setConnectionStatus("unknown")
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    try {
      const response = await fetch("/api/asaas/test")
      const result = await response.json()

      if (result.success) {
        toast({
          title: "Conexao bem-sucedida!",
          description: `Conectado ao Asaas (${result.data?.environment || "production"})`,
        })
        setConnectionStatus("connected")
      } else {
        toast({
          title: "Erro de conexao",
          description: result.message || "Nao foi possivel conectar ao Asaas",
          variant: "destructive",
        })
        setConnectionStatus("disconnected")
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao testar conexao com Asaas",
        variant: "destructive",
      })
      setConnectionStatus("disconnected")
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl shadow-lg">
          <CreditCard className="h-8 w-8 text-purple-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Configurações do Asaas</h2>
          <p className="text-muted-foreground">Configure a integração com o Asaas para emissão de boletos</p>
        </div>
      </div>

      {/* Status da conexão */}
      <Card className="border border-border bg-card text-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Settings className="h-5 w-5 text-purple-400" />
            Status da Integração
          </CardTitle>
          <CardDescription className="text-muted-foreground">Verifique o status da conexão com o Asaas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-background border border-border rounded-lg gap-4">
            <div className="flex items-center gap-3">
              {connectionStatus === "connected" ? (
                <>
                  <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                  <div>
                    <p className="font-medium text-emerald-400">Conectado</p>
                    <p className="text-sm text-muted-foreground">
                      Ambiente: {environment === "sandbox" ? "Sandbox (Testes)" : "Produção"}
                    </p>
                  </div>
                </>
              ) : connectionStatus === "disconnected" ? (
                <>
                  <AlertCircle className="h-6 w-6 text-red-400" />
                  <div>
                    <p className="font-medium text-red-400">Desconectado</p>
                    <p className="text-sm text-muted-foreground">Configure a API Key nas variáveis de ambiente</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="h-6 w-6 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Status desconhecido</p>
                    <p className="text-sm text-muted-foreground">Clique em testar conexão</p>
                  </div>
                </>
              )}
            </div>
            <Button
              onClick={handleTestConnection}
              disabled={testing}
              className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto"
            >
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testando...
                </>
              ) : (
                "Testar Conexão"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Instruções de configuração */}
      <Card className="border border-border bg-card text-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <ExternalLink className="h-5 w-5 text-purple-400" />
            Configuração
          </CardTitle>
          <CardDescription className="text-muted-foreground">Como configurar a integração com o Asaas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-purple-500/5 rounded-lg border border-purple-500/20">
            <h4 className="font-medium text-purple-400 mb-2">Variáveis de Ambiente Necessárias:</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs border-border bg-muted/40 text-muted-foreground">ASAAS_API_KEY</Badge>
                <span className="text-sm text-muted-foreground">- Sua chave de API do Asaas</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs border-border bg-muted/40 text-muted-foreground">ASAAS_ENVIRONMENT</Badge>
                <span className="text-sm text-muted-foreground">- sandbox ou production (padrão: production)</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-500/5 rounded-lg border border-amber-500/20">
            <h4 className="font-medium text-amber-400 mb-2">Como obter a API Key:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Acesse sua conta no Asaas</li>
              <li>Vá em Configurações &gt; Integrações</li>
              <li>Clique em "Gerar nova chave de API"</li>
              <li>Copie a chave gerada</li>
              <li>Configure a variável ASAAS_API_KEY no Vercel/Painel de Hospedagem</li>
            </ol>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 border-border text-foreground hover:bg-muted bg-transparent"
              onClick={() => window.open("https://www.asaas.com/", "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Acessar Asaas
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-border text-foreground hover:bg-muted bg-transparent"
              onClick={() => window.open("https://docs.asaas.com/", "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Documentação
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Funcionalidades */}
      <Card className="border border-border bg-card text-foreground">
        <CardHeader>
          <CardTitle className="text-foreground">Funcionalidades Disponíveis</CardTitle>
          <CardDescription className="text-muted-foreground">Recursos disponíveis com a integração Asaas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-3 p-3 bg-purple-500/5 border border-purple-500/10 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-purple-400" />
              <span className="text-muted-foreground text-sm">Emissão de Boletos Bancários</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-500/5 border border-purple-500/10 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-purple-400" />
              <span className="text-muted-foreground text-sm">Gerenciamento de Clientes</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-500/5 border border-purple-500/10 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-purple-400" />
              <span className="text-muted-foreground text-sm">Linha Digitável e Código de Barras</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-500/5 border border-purple-500/10 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-purple-400" />
              <span className="text-muted-foreground text-sm">PDF do Boleto para Impressão</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-500/5 border border-purple-500/10 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-purple-400" />
              <span className="text-muted-foreground text-sm">Multa e Juros Automáticos</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
