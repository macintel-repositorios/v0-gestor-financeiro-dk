"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  Mail,
  Filter,
  Send,
  Users,
  CheckSquare,
  Square,
  History,
  ChevronDown,
  ChevronUp,
  Search,
  Loader2,
  MailCheck,
  MailX,
  Building2,
  MapPin,
  FileCheck,
  Settings2,
  RefreshCw,
  Info,
  AlertCircle,
  ImagePlus,
  Trash2,
} from "lucide-react"

interface Destinatario {
  cliente_id: number
  cliente_nome: string
  email: string
  tipo: string
  cidade: string
  estado: string
  distancia_km: number
  tem_contrato: number
  selecionado?: boolean
}

interface Campanha {
  id: number
  assunto: string
  total_destinatarios: number
  total_enviados: number
  total_erros: number
  status: string
  smtp_from: string
  created_at: string
  enviado_at: string | null
}

interface SmtpConfig {
  host: string
  port: number
  user: string
  pass: string
  from: string
  fromName: string
}

const TIPO_LABEL: Record<string, string> = {
  principal: "Principal",
  sindico: "Síndico",
  administradora: "Administradora",
  contato_extra: "Extra",
}

const TIPO_COLOR: Record<string, string> = {
  principal: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  sindico: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  administradora: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  contato_extra: "bg-green-500/15 text-green-400 border-green-500/30",
}

/** "Bom dia!" (até 11h59), "Boa tarde!" (12h–17h59) ou "Boa noite!" — horário de Brasília */
function saudacaoBrasilia(): string {
  const hora = Number(
    new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", hour12: false }).format(new Date())
  )
  if (hora >= 5 && hora < 12) return "Bom dia!"
  if (hora >= 12 && hora < 18) return "Boa tarde!"
  return "Boa noite!"
}

export default function MarketingPage() {
  const { toast } = useToast()

  // Filtros
  const [temContrato, setTemContrato] = useState("todos")
  const [distanciaMin, setDistanciaMin] = useState("")
  const [distanciaMax, setDistanciaMax] = useState("")
  const [cidade, setCidade] = useState("")
  const [estado, setEstado] = useState("")
  const [tiposEmail, setTiposEmail] = useState({
    principal: true,
    sindico: true,
    administradora: true,
    extras: true,
  })
  const [search, setSearch] = useState("")

  // Destinatários
  const [destinatarios, setDestinatarios] = useState<Destinatario[]>([])
  const [loadingDestinatarios, setLoadingDestinatarios] = useState(false)
  const [filtrosAbertos, setFiltrosAbertos] = useState(true)

  // Email
  const [assunto, setAssunto] = useState("")
  // Corpo já começa com a saudação conforme o horário de Brasília (editável)
  const [corpo, setCorpo] = useState(() => `Prezados(as),\n\n${saudacaoBrasilia()}\n\n`)

  // Assinatura (imagem) anexada no final do e-mail
  const [assinatura, setAssinatura] = useState<{ dados: string; nome: string; dimensoes?: string } | null>(null)
  const [incluirAssinatura, setIncluirAssinatura] = useState(true)
  const [salvandoAssinatura, setSalvandoAssinatura] = useState(false)

  useEffect(() => {
    fetch("/api/marketing/assinatura")
      .then((r) => r.json())
      .then((r) => r.success && setAssinatura(r.data))
      .catch(() => {})
  }, [])

  const handleUploadAssinatura = async (file?: File) => {
    if (!file) return
    if (!/^image\/(png|jpe?g)$/.test(file.type)) {
      toast({ title: "Formato inválido", description: "Use uma imagem PNG ou JPG", variant: "destructive" })
      return
    }
    if (file.size > 1024 * 1024) {
      toast({ title: "Imagem muito grande", description: "A assinatura deve ter no máximo 1 MB", variant: "destructive" })
      return
    }
    setSalvandoAssinatura(true)
    try {
      const dados = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const dimensoes = await new Promise<string>((resolve) => {
        const img = new Image()
        img.onload = () => resolve(`${img.naturalWidth}x${img.naturalHeight}`)
        img.onerror = () => resolve("")
        img.src = dados
      })
      const res = await fetch("/api/marketing/assinatura", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: file.name, dados, dimensoes }),
      })
      const result = await res.json()
      if (!result.success) throw new Error(result.message)
      setAssinatura({ dados, nome: file.name, dimensoes })
      setIncluirAssinatura(true)
      toast({ title: "Assinatura salva", description: "Ela será incluída no final dos e-mails." })
    } catch (e: any) {
      toast({ title: "Erro ao salvar assinatura", description: e?.message, variant: "destructive" })
    } finally {
      setSalvandoAssinatura(false)
    }
  }

  const handleRemoverAssinatura = async () => {
    if (!confirm("Remover a assinatura dos e-mails?")) return
    await fetch("/api/marketing/assinatura", { method: "DELETE" })
    setAssinatura(null)
  }

  // SMTP
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>({
    host: "smtp.gmail.com",
    port: 587,
    user: "",
    pass: "",
    from: "",
    fromName: "",
  })
  const [smtpAberto, setSmtpAberto] = useState(false)

  // Status do servidor SMTP (LED): volta para "não testado" sempre que a configuração muda
  type StatusSmtp = "nao_configurado" | "nao_testado" | "testando" | "online" | "erro"
  const [smtpStatus, setSmtpStatus] = useState<StatusSmtp>("nao_configurado")
  const [smtpStatusMsg, setSmtpStatusMsg] = useState("")

  // Senha já salva no servidor (o campo fica vazio = "manter a senha salva")
  const [temSenhaSalva, setTemSenhaSalva] = useState(false)
  const smtpConfigurado = !!(smtpConfig.host && smtpConfig.user && (smtpConfig.pass || temSenhaSalva))
  const smtpCarregadoRef = useRef(false)

  useEffect(() => {
    // Ignora a mudança feita pelo carregamento da configuração salva (ela é testada logo em seguida)
    if (!smtpCarregadoRef.current) return
    setSmtpStatus(smtpConfigurado ? "nao_testado" : "nao_configurado")
    setSmtpStatusMsg("")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [smtpConfig.host, smtpConfig.port, smtpConfig.user, smtpConfig.pass])

  const testarSmtp = async (salvarSeOk = true) => {
    setSmtpStatus("testando")
    setSmtpStatusMsg("")
    try {
      const res = await fetch("/api/marketing/smtp-teste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(smtpConfig),
      })
      const result = await res.json()
      setSmtpStatus(result.success ? "online" : "erro")
      setSmtpStatusMsg(result.success ? `${result.message} (${result.ms} ms)` : result.message)

      // Conexão OK: salva a configuração (senha criptografada no servidor)
      if (result.success && salvarSeOk) {
        const salvar = await fetch("/api/marketing/smtp", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(smtpConfig),
        }).then((r) => r.json())
        if (salvar.success) {
          setTemSenhaSalva(!!salvar.temSenha)
          setSmtpStatusMsg(`${result.message} (${result.ms} ms) · configuração salva`)
        }
      }
    } catch {
      setSmtpStatus("erro")
      setSmtpStatusMsg("Não foi possível testar a conexão")
    }
  }

  // Ao abrir a página: carrega a configuração salva e testa a conexão automaticamente
  useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch("/api/marketing/smtp").then((x) => x.json())
        if (r.success && r.data) {
          setSmtpConfig({
            host: r.data.host,
            port: r.data.port,
            user: r.data.user,
            pass: "",
            from: r.data.from,
            fromName: r.data.fromName || "",
          })
          setTemSenhaSalva(!!r.data.temSenha)
          if (r.data.temSenha) {
            setSmtpStatus("testando")
            const teste = await fetch("/api/marketing/smtp-teste", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({}),
            }).then((x) => x.json())
            setSmtpStatus(teste.success ? "online" : "erro")
            setSmtpStatusMsg(teste.success ? `${teste.message} (${teste.ms} ms)` : teste.message)
          } else {
            setSmtpStatus("nao_configurado")
          }
        }
      } catch {}
      // Libera o efeito que marca "não testado" nas próximas edições
      setTimeout(() => {
        smtpCarregadoRef.current = true
      }, 0)
    })()
  }, [])

  const LED_SMTP: Record<StatusSmtp, { cor: string; texto: string }> = {
    nao_configurado: { cor: "bg-zinc-500", texto: "Não configurado" },
    nao_testado: { cor: "bg-amber-400", texto: "Configurado · não testado" },
    testando: { cor: "bg-blue-400 animate-pulse", texto: "Testando..." },
    online: { cor: "bg-green-500 shadow-[0_0_8px_2px_rgba(34,197,94,0.6)]", texto: "Online" },
    erro: { cor: "bg-red-500 shadow-[0_0_8px_2px_rgba(239,68,68,0.6)]", texto: "Erro de conexão" },
  }

  // Envio
  const [enviando, setEnviando] = useState(false)

  // Histórico
  const [campanhas, setCampanhas] = useState<Campanha[]>([])
  const [loadingCampanhas, setLoadingCampanhas] = useState(false)
  const [activeTab, setActiveTab] = useState("compose")

  const selecionados = destinatarios.filter((d) => d.selecionado)

  const buscarDestinatarios = useCallback(async () => {
    setLoadingDestinatarios(true)
    try {
      const tipos = Object.entries(tiposEmail)
        .filter(([, v]) => v)
        .map(([k]) => k)
        .join(",")

      const params = new URLSearchParams()
      if (temContrato !== "todos") params.set("tem_contrato", temContrato)
      if (distanciaMin) params.set("distancia_min", distanciaMin)
      if (distanciaMax) params.set("distancia_max", distanciaMax)
      if (cidade) params.set("cidade", cidade)
      if (estado) params.set("estado", estado)
      if (tipos) params.set("tipos_email", tipos)
      if (search) params.set("search", search)

      const res = await fetch(`/api/marketing/destinatarios?${params.toString()}`)
      const result = await res.json()

      if (result.success) {
        setDestinatarios(result.data.map((d: Destinatario) => ({ ...d, selecionado: true })))
      }
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao buscar destinatários", variant: "destructive" })
    } finally {
      setLoadingDestinatarios(false)
    }
  }, [temContrato, distanciaMin, distanciaMax, cidade, estado, tiposEmail, search, toast])

  const carregarCampanhas = useCallback(async () => {
    setLoadingCampanhas(true)
    try {
      const res = await fetch("/api/marketing/campanhas")
      const result = await res.json()
      if (result.success) setCampanhas(result.data)
    } catch {}
    setLoadingCampanhas(false)
  }, [])

  useEffect(() => {
    buscarDestinatarios()
  }, [])

  useEffect(() => {
    if (activeTab === "historico") carregarCampanhas()
  }, [activeTab, carregarCampanhas])

  const toggleSelecionado = (email: string) => {
    setDestinatarios((prev) =>
      prev.map((d) => (d.email === email ? { ...d, selecionado: !d.selecionado } : d))
    )
  }

  const selecionarTodos = () => {
    setDestinatarios((prev) => prev.map((d) => ({ ...d, selecionado: true })))
  }

  const desmarcarTodos = () => {
    setDestinatarios((prev) => prev.map((d) => ({ ...d, selecionado: false })))
  }

  const handleEnviar = async () => {
    if (!assunto.trim()) {
      toast({ title: "Erro", description: "Preencha o assunto do email", variant: "destructive" })
      return
    }
    // Não deixa enviar só com a saudação padrão
    const semSaudacao = corpo.replace(/Prezados\(as\),|Bom dia!|Boa tarde!|Boa noite!/g, "").trim()
    if (!semSaudacao) {
      toast({ title: "Erro", description: "Preencha o corpo do email", variant: "destructive" })
      return
    }
    if (selecionados.length === 0) {
      toast({ title: "Erro", description: "Selecione pelo menos um destinatário", variant: "destructive" })
      return
    }
    if (!smtpConfigurado) {
      toast({ title: "Erro", description: "Configure as credenciais SMTP antes de enviar", variant: "destructive" })
      setSmtpAberto(true)
      return
    }

    setEnviando(true)
    try {
      const res = await fetch("/api/marketing/enviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assunto,
          corpo,
          destinatarios: selecionados.map((d) => ({
            cliente_id: d.cliente_id,
            cliente_nome: d.cliente_nome,
            email: d.email,
            tipo: d.tipo,
          })),
          smtp: smtpConfig,
          incluirAssinatura: !!assinatura && incluirAssinatura,
          filtros: { temContrato, distanciaMin, distanciaMax, cidade, estado },
        }),
      })
      const result = await res.json()

      if (result.success) {
        toast({
          title: "✅ Campanha enviada!",
          description: result.message,
        })
        setActiveTab("historico")
        carregarCampanhas()
      } else {
        toast({ title: "Erro ao enviar", description: result.message, variant: "destructive" })
      }
    } catch {
      toast({ title: "Erro", description: "Erro de conexão. Tente novamente.", variant: "destructive" })
    } finally {
      setEnviando(false)
    }
  }

  const statusCampanhaLabel: Record<string, { label: string; cls: string }> = {
    rascunho: { label: "Rascunho", cls: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
    enviando: { label: "Enviando...", cls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
    concluido: { label: "Concluído", cls: "bg-green-500/20 text-green-400 border-green-500/30" },
    erro: { label: "Com erros", cls: "bg-red-500/20 text-red-400 border-red-500/30" },
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 pb-32 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-500 bg-clip-text text-transparent flex items-center gap-2">
            <Mail className="h-7 w-7 text-violet-400" />
            E-mail Marketing
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Envie campanhas segmentadas para seus clientes
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-sm px-3 py-1.5 border-violet-500/30 text-violet-400">
            <Users className="h-3.5 w-3.5 mr-1.5" />
            {destinatarios.length} encontrados
          </Badge>
          <Badge variant="outline" className="text-sm px-3 py-1.5 border-green-500/30 text-green-400">
            <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
            {selecionados.length} selecionados
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="compose" className="gap-1.5">
            <Mail className="h-4 w-4" />
            Compor
          </TabsTrigger>
          <TabsTrigger value="historico" className="gap-1.5">
            <History className="h-4 w-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
            {/* Coluna Esquerda: Filtros + Lista */}
            <div className="xl:col-span-2 space-y-4">
              {/* Painel de Filtros */}
              <Card className="border-border bg-card">
                <CardHeader
                  className="pb-2 cursor-pointer select-none"
                  onClick={() => setFiltrosAbertos((p) => !p)}
                >
                  <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-violet-400" />
                      Filtros de Segmentação
                    </span>
                    {filtrosAbertos ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </CardTitle>
                </CardHeader>

                {filtrosAbertos && (
                  <CardContent className="space-y-4 pt-0">
                    {/* Busca */}
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nome ou código..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>

                    {/* Contrato */}
                    <div>
                      <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1.5">
                        <FileCheck className="h-3.5 w-3.5" />
                        Contrato
                      </Label>
                      <Select value={temContrato} onValueChange={setTemContrato}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos os clientes</SelectItem>
                          <SelectItem value="1">Com contrato ativo</SelectItem>
                          <SelectItem value="0">Sem contrato</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Distância */}
                    <div>
                      <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        Distância (km)
                      </Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          type="number"
                          placeholder="De"
                          value={distanciaMin}
                          onChange={(e) => setDistanciaMin(e.target.value)}
                          className="w-full"
                          min="0"
                        />
                        <span className="text-muted-foreground text-sm shrink-0">até</span>
                        <Input
                          type="number"
                          placeholder="Até"
                          value={distanciaMax}
                          onChange={(e) => setDistanciaMax(e.target.value)}
                          className="w-full"
                          min="0"
                        />
                      </div>
                    </div>

                    {/* Localização */}
                    <div>
                      <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1.5">
                        <Building2 className="h-3.5 w-3.5" />
                        Localização
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Cidade"
                          value={cidade}
                          onChange={(e) => setCidade(e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          placeholder="UF"
                          value={estado}
                          onChange={(e) => setEstado(e.target.value.toUpperCase())}
                          className="w-16 uppercase"
                          maxLength={2}
                        />
                      </div>
                    </div>

                    {/* Tipo de email */}
                    <div>
                      <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                        <Mail className="h-3.5 w-3.5" />
                        Incluir tipos de e-mail
                      </Label>
                      <div className="space-y-2">
                        {(["principal", "sindico", "administradora", "extras"] as const).map((tipo) => (
                          <div key={tipo} className="flex items-center gap-2">
                            <Checkbox
                              id={`tipo-${tipo}`}
                              checked={tiposEmail[tipo]}
                              onCheckedChange={(v) =>
                                setTiposEmail((p) => ({ ...p, [tipo]: !!v }))
                              }
                            />
                            <Label htmlFor={`tipo-${tipo}`} className="text-sm cursor-pointer">
                              {tipo === "principal"
                                ? "Email Principal do cliente"
                                : tipo === "sindico"
                                ? "Email do Síndico(a)"
                                : tipo === "administradora"
                                ? "Email da Administradora"
                                : "Emails adicionais de contato"}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button onClick={buscarDestinatarios} disabled={loadingDestinatarios} className="w-full">
                      {loadingDestinatarios ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Aplicar Filtros
                    </Button>
                  </CardContent>
                )}
              </Card>

              {/* Lista de Destinatários */}
              <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-violet-400" />
                      Destinatários ({destinatarios.length})
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={selecionarTodos}
                        className="h-7 text-xs"
                      >
                        <CheckSquare className="h-3.5 w-3.5 mr-1" />
                        Todos
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={desmarcarTodos}
                        className="h-7 text-xs"
                      >
                        <Square className="h-3.5 w-3.5 mr-1" />
                        Nenhum
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {loadingDestinatarios ? (
                    <div className="flex items-center justify-center py-10 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Buscando destinatários...
                    </div>
                  ) : destinatarios.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                      <Info className="h-8 w-8" />
                      <p className="text-sm">Nenhum destinatário encontrado</p>
                      <p className="text-xs">Ajuste os filtros e clique em Aplicar</p>
                    </div>
                  ) : (
                    <div className="max-h-[400px] overflow-y-auto divide-y divide-border">
                      {destinatarios.map((dest, i) => (
                        <div
                          key={`${dest.email}-${i}`}
                          className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/40 ${
                            dest.selecionado ? "" : "opacity-50"
                          }`}
                          onClick={() => toggleSelecionado(dest.email)}
                        >
                          <Checkbox
                            checked={dest.selecionado}
                            onCheckedChange={() => toggleSelecionado(dest.email)}
                            className="mt-0.5 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-sm font-medium truncate">{dest.cliente_nome}</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium shrink-0 ${
                                  TIPO_COLOR[dest.tipo] || ""
                                }`}
                              >
                                {TIPO_LABEL[dest.tipo] || dest.tipo}
                              </span>
                              {dest.tem_contrato === 1 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full border bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-medium shrink-0">
                                  Contrato
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{dest.email}</p>
                            <p className="text-[10px] text-muted-foreground/70">
                              {dest.cidade}{dest.estado ? `, ${dest.estado}` : ""}
                              {dest.distancia_km > 0 ? ` · ${dest.distancia_km} km` : ""}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Coluna Direita: Composer */}
            <div className="xl:col-span-3 space-y-4">
              {/* SMTP */}
              <Card className="border-border bg-card">
                <CardHeader
                  className="pb-2 cursor-pointer select-none"
                  onClick={() => setSmtpAberto((p) => !p)}
                >
                  <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Settings2 className="h-4 w-4 text-orange-400" />
                      Configuração SMTP
                      {smtpConfig.user && (
                        <span className="text-xs text-muted-foreground font-normal">({smtpConfig.user})</span>
                      )}
                    </span>
                    {/* LED de status do servidor */}
                    <span
                      className="ml-auto mr-2 flex items-center gap-1.5 text-xs font-normal text-muted-foreground"
                      title={smtpStatusMsg || LED_SMTP[smtpStatus].texto}
                    >
                      <span className={`h-2.5 w-2.5 rounded-full ${LED_SMTP[smtpStatus].cor}`} />
                      {LED_SMTP[smtpStatus].texto}
                    </span>
                    {smtpAberto ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </CardTitle>
                </CardHeader>
                {smtpAberto && (
                  <CardContent className="space-y-3 pt-0">
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 flex gap-2">
                      <Info className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>
                        Para Gmail: ative "Acesso a apps menos seguros" ou use uma{" "}
                        <strong>Senha de App</strong> em myaccount.google.com/security
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <Label className="text-xs">Servidor SMTP</Label>
                        <Input
                          placeholder="smtp.gmail.com"
                          value={smtpConfig.host}
                          onChange={(e) =>
                            setSmtpConfig((p) => ({ ...p, host: e.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Porta</Label>
                        <Input
                          type="number"
                          value={smtpConfig.port}
                          onChange={(e) =>
                            setSmtpConfig((p) => ({ ...p, port: Number(e.target.value) }))
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Usuário / E-mail de envio</Label>
                        <Input
                          type="email"
                          placeholder="seu@email.com"
                          value={smtpConfig.user}
                          onChange={(e) =>
                            setSmtpConfig((p) => ({ ...p, user: e.target.value, from: e.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Senha / App Password</Label>
                        <Input
                          type="password"
                          placeholder={temSenhaSalva ? "•••••••• (salva — deixe vazio para manter)" : "••••••••"}
                          value={smtpConfig.pass}
                          onChange={(e) =>
                            setSmtpConfig((p) => ({ ...p, pass: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Nome do Remetente</Label>
                      <Input
                        placeholder="Nome que aparece no email"
                        value={smtpConfig.fromName}
                        onChange={(e) =>
                          setSmtpConfig((p) => ({ ...p, fromName: e.target.value }))
                        }
                      />
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => testarSmtp()}
                        disabled={smtpStatus === "nao_configurado" || smtpStatus === "testando"}
                      >
                        {smtpStatus === "testando" ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Testar conexão
                      </Button>
                      {smtpStatusMsg && (
                        <span className={`text-xs ${smtpStatus === "online" ? "text-green-400" : "text-red-400"}`}>
                          {smtpStatusMsg}
                        </span>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Composer */}
              <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Mail className="h-4 w-4 text-violet-400" />
                    Compor E-mail
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Assunto *</Label>
                    <Input
                      placeholder="Ex: Oferta especial de manutenção de elevadores"
                      value={assunto}
                      onChange={(e) => setAssunto(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Corpo do E-mail * (HTML aceito)</Label>
                    <Textarea
                      placeholder={`Olá, [Nome do Cliente]!\n\nEscreva aqui o conteúdo do seu email...\n\nVocê pode usar HTML para formatar o email.`}
                      value={corpo}
                      onChange={(e) => setCorpo(e.target.value)}
                      rows={14}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Dica: use tags HTML como &lt;b&gt;, &lt;br&gt;, &lt;a href=""&gt; para formatar o email.
                    </p>
                  </div>

                  {/* Assinatura em imagem */}
                  <div className="rounded-lg border border-border p-3 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="flex items-center gap-2">
                        <ImagePlus className="h-4 w-4 text-violet-400" />
                        Assinatura (imagem)
                      </Label>
                      {assinatura && (
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                          <Checkbox
                            checked={incluirAssinatura}
                            onCheckedChange={(v) => setIncluirAssinatura(!!v)}
                          />
                          Incluir neste e-mail
                        </label>
                      )}
                    </div>

                    {assinatura ? (
                      <div className="space-y-2">
                        <div className={`rounded-md bg-white p-3 ${incluirAssinatura ? "" : "opacity-40"}`}>
                          <img src={assinatura.dados} alt="Assinatura" className="max-w-full max-h-40 object-contain" />
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="truncate">
                            {assinatura.nome}
                            {assinatura.dimensoes ? ` · ${assinatura.dimensoes}` : ""}
                          </span>
                          <div className="flex gap-2 shrink-0">
                            <label className="cursor-pointer text-violet-400 hover:underline">
                              Trocar
                              <input
                                type="file"
                                accept="image/png,image/jpeg"
                                className="hidden"
                                onChange={(e) => handleUploadAssinatura(e.target.files?.[0])}
                              />
                            </label>
                            <button type="button" onClick={handleRemoverAssinatura} className="text-red-400 hover:underline flex items-center gap-1">
                              <Trash2 className="h-3 w-3" /> Remover
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border p-4 text-xs text-muted-foreground cursor-pointer hover:bg-muted/40">
                        {salvandoAssinatura ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <ImagePlus className="h-5 w-5" />
                        )}
                        Clique para escolher a imagem da assinatura (PNG ou JPG, até 1 MB)
                        <span className="text-[11px]">Recomendado: até 600 px de largura</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg"
                          className="hidden"
                          disabled={salvandoAssinatura}
                          onChange={(e) => handleUploadAssinatura(e.target.files?.[0])}
                        />
                      </label>
                    )}
                  </div>

                  {/* Resumo antes de enviar */}
                  {selecionados.length > 0 && assunto && (
                    <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20 flex gap-3 text-sm">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-violet-400" />
                      <div className="text-violet-300">
                        Enviar <strong>{selecionados.length} emails</strong> com o assunto:{" "}
                        <em>"{assunto}"</em>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleEnviar}
                    disabled={enviando || selecionados.length === 0}
                    className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-semibold"
                    size="lg"
                  >
                    {enviando ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando {selecionados.length} emails...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Enviar Campanha para {selecionados.length} destinatário
                        {selecionados.length !== 1 ? "s" : ""}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Histórico de Campanhas */}
        <TabsContent value="historico" className="mt-4">
          <Card className="border-border bg-card">
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <History className="h-4 w-4 text-violet-400" />
                Histórico de Campanhas
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={carregarCampanhas}
                disabled={loadingCampanhas}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingCampanhas ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
            </CardHeader>
            <CardContent>
              {loadingCampanhas ? (
                <div className="flex items-center justify-center py-10 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Carregando histórico...
                </div>
              ) : campanhas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                  <History className="h-8 w-8" />
                  <p className="text-sm">Nenhuma campanha enviada ainda</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {campanhas.map((c) => {
                    const st = statusCampanhaLabel[c.status] || statusCampanhaLabel.rascunho
                    return (
                      <div
                        key={c.id}
                        className="p-4 rounded-lg border border-border bg-muted/20 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{c.assunto}</p>
                            <p className="text-xs text-muted-foreground">
                              {c.smtp_from} · {new Date(c.created_at).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${st.cls}`}
                          >
                            {st.label}
                          </span>
                        </div>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {c.total_destinatarios} destinatários
                          </span>
                          <span className="flex items-center gap-1 text-green-400">
                            <MailCheck className="h-3.5 w-3.5" />
                            {c.total_enviados} enviados
                          </span>
                          {c.total_erros > 0 && (
                            <span className="flex items-center gap-1 text-red-400">
                              <MailX className="h-3.5 w-3.5" />
                              {c.total_erros} erros
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
