"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, Building2, ExternalLink, Loader2, Settings, ShieldCheck, Radio } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function InterTab() {
  const [testing, setTesting] = useState(false)
  const [savingWebhook, setSavingWebhook] = useState(false)
  const [environment, setEnvironment] = useState<"sandbox" | "production">("production")
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "unknown">("unknown")
  const [details, setDetails] = useState<{ hasClientId?: boolean; hasClientSecret?: boolean; hasCert?: boolean }>({})
  const [webhookUrl, setWebhookUrl] = useState("")
  const [currentWebhook, setCurrentWebhook] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    checkConnection()
    loadWebhookConfig()
  }, [])

  const checkConnection = async () => {
    try {
      const response = await fetch("/api/inter/status")
      const result = await response.json()

      if (result.success && result.data?.configured) {
        setConnectionStatus("connected")
        setEnvironment(result.data.environment || "production")
        setDetails(result.data)
      } else {
        setConnectionStatus("disconnected")
        setDetails(result.data || {})
      }
    } catch {
      setConnectionStatus("unknown")
    }
  }

  const loadWebhookConfig = async () => {
    try {
      const response = await fetch("/api/inter/webhook/config")
      const result = await response.json()
      if (result.success && result.data?.webhookUrl) {
        setCurrentWebhook(result.data.webhookUrl)
        setWebhookUrl(result.data.webhookUrl)
      }
    } catch {
      // Ignorar erro se não houver webhook configurado
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    try {
      const response = await fetch("/api/inter/test")
      const result = await response.json()

      if (result.success) {
        toast({
          title: "Conexão bem-sucedida!",
          description: `Conectado ao Banco Inter (${result.data?.environment || "production"})`,
        })
        setConnectionStatus("connected")
      } else {
        toast({
          title: "Erro de conexão",
          description: result.message || "Não foi possível autenticar com o Banco Inter",
          variant: "destructive",
        })
        setConnectionStatus("disconnected")
      }
    } catch {
      toast({
        title: "Erro",
        description: "Erro ao testar conexão com o Banco Inter",
        variant: "destructive",
      })
      setConnectionStatus("disconnected")
    } finally {
      setTesting(false)
    }
  }

  const handleSaveWebhook = async () => {
    if (!webhookUrl.startsWith("https://")) {
      toast({
        title: "URL Inválida",
        description: "A URL do Webhook deve começar obrigatoriamente com HTTPS://",
        variant: "destructive",
      })
      return
    }

    setSavingWebhook(true)
    try {
      const response = await fetch("/api/inter/webhook/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl }),
      })
      const result = await response.json()

      if (result.success) {
        toast({
          title: "Webhook Registrado!",
          description: `URL do Webhook atualizada no Banco Inter com sucesso!`,
        })
        setCurrentWebhook(webhookUrl)
      } else {
        toast({
          title: "Erro ao registrar Webhook",
          description: result.message || "O Banco Inter recusou a URL do Webhook.",
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível registrar o Webhook.",
        variant: "destructive",
      })
    } finally {
      setSavingWebhook(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl shadow-lg">
          <Building2 className="h-8 w-8 text-orange-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Configurações do Banco Inter</h2>
          <p className="text-muted-foreground">Emissão de boletos e Pix direto na sua Conta Corrente PJ</p>
        </div>
      </div>

      {/* Status da conexão */}
      <Card className="border border-border bg-card text-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Settings className="h-5 w-5 text-orange-500" />
            Status da Integração
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Verifique as credenciais e o certificado digital mTLS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-background border border-border rounded-lg gap-4">
            <div className="flex items-center gap-3">
              {connectionStatus === "connected" ? (
                <>
                  <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                  <div>
                    <p className="font-medium text-emerald-400">Pronto para uso</p>
                    <p className="text-sm text-muted-foreground">
                      Ambiente: {environment === "sandbox" ? "Sandbox (Testes)" : "Produção"}
                    </p>
                  </div>
                </>
              ) : connectionStatus === "disconnected" ? (
                <>
                  <AlertCircle className="h-6 w-6 text-red-400" />
                  <div>
                    <p className="font-medium text-red-400">Pendente de Configuração</p>
                    <p className="text-sm text-muted-foreground">
                      Configure as variáveis e certificados no `.env.local`
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="h-6 w-6 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Status desconhecido</p>
                    <p className="text-sm text-muted-foreground">Clique para testar a autenticação mTLS</p>
                  </div>
                </>
              )}
            </div>
            <Button
              onClick={handleTestConnection}
              disabled={testing}
              className="bg-orange-600 hover:bg-orange-700 text-white w-full sm:w-auto"
            >
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Autenticando mTLS...
                </>
              ) : (
                "Testar Conexão"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Configuração do Webhook */}
      <Card className="border border-border bg-card text-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Radio className="h-5 w-5 text-orange-500" />
            Configuração do Webhook de Recebimento
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Cadastre a URL para receber notificações automáticas quando boletos forem pagos no Banco Inter
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhook-url">URL Pública do Webhook (HTTPS obrigatório)</Label>
            <div className="flex gap-2">
              <Input
                id="webhook-url"
                placeholder="https://seu-dominio.com/api/inter/webhook"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="bg-background font-mono text-sm"
              />
              <Button
                onClick={handleSaveWebhook}
                disabled={savingWebhook || !webhookUrl}
                className="bg-orange-600 hover:bg-orange-700 text-white shrink-0"
              >
                {savingWebhook ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Salvar Webhook
              </Button>
            </div>
            {currentWebhook && (
              <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Webhook cadastrado atualmente: {currentWebhook}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Requisitos de Variáveis */}
      <Card className="border border-border bg-card text-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <ShieldCheck className="h-5 w-5 text-orange-500" />
            Parâmetros de Integração (.env.local)
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Variáveis necessárias para autenticar com o mTLS do Banco Inter
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-orange-500/5 rounded-lg border border-orange-500/20">
            <h4 className="font-medium text-orange-500 mb-2">Variáveis no arquivo .env.local:</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs border-border bg-muted/40 text-muted-foreground">
                  INTER_CLIENT_ID
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {details.hasClientId ? "✅ Configurado" : "❌ Ausente"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs border-border bg-muted/40 text-muted-foreground">
                  INTER_CLIENT_SECRET
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {details.hasClientSecret ? "✅ Configurado" : "❌ Ausente"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs border-border bg-muted/40 text-muted-foreground">
                  INTER_CERT_PATH / INTER_KEY_PATH
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {details.hasCert ? "✅ Certificados Encontrados (certs/)" : "❌ Arquivos .crt e .key não localizados"}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-muted/40 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-2">Como funciona o Certificado do Webhook:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Os arquivos <strong>`inter.crt`</strong> e <strong>`inter.key`</strong> na pasta <code>certs/</code> servem para a sua aplicação se autenticar no Banco Inter.</li>
              <li>Para o Webhook, o Banco Inter exige que a sua URL seja <strong>HTTPS</strong> com um certificado SSL de servidor (ex: Vercel, Cloudflare, Let's Encrypt na porta 443).</li>
              <li>Em ambiente de desenvolvimento local (`localhost`), você pode utilizar ferramentas como o <strong>ngrok</strong> para expor a sua porta 3001 em uma URL HTTPS temporária.</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 border-border text-foreground hover:bg-muted bg-transparent"
              onClick={() => window.open("https://cdpj.bancointer.com.br/", "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Internet Banking Inter PJ
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-border text-foreground hover:bg-muted bg-transparent"
              onClick={() => window.open("https://developers.bancointer.com.br/", "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Documentação Desenvolvedores Inter
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
