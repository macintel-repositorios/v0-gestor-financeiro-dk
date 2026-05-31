"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Save,
  Shield,
  Building2,
  Hash,
  Info,
  Package,
  Upload,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface NfeConfig {
  id?: number
  razao_social: string
  nome_fantasia: string
  cnpj: string
  inscricao_estadual: string
  endereco: string
  numero_endereco: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
  cep: string
  codigo_municipio: string
  telefone: string
  crt: number
  serie_nfe: number
  proximo_numero_nfe: number
  ambiente: number
  info_complementar: string
  natureza_operacao: string
  certificado_base64?: string
  certificado_senha: string
  certificado_validade?: string
}

const defaultConfig: NfeConfig = {
  razao_social: "",
  nome_fantasia: "",
  cnpj: "",
  inscricao_estadual: "",
  endereco: "",
  numero_endereco: "",
  complemento: "",
  bairro: "",
  cidade: "SAO PAULO",
  uf: "SP",
  cep: "",
  codigo_municipio: "3550308",
  telefone: "",
  crt: 1,
  serie_nfe: 1,
  proximo_numero_nfe: 1,
  ambiente: 2,
  info_complementar: "DOCUMENTO EMITIDO POR ME OU EPP OPTANTE PELO SIMPLES NACIONAL. NAO GERA DIREITO A CREDITO FISCAL DE IPI.",
  natureza_operacao: "Venda",
  certificado_senha: "",
}

export function NfeTab() {
  const [config, setConfig] = useState<NfeConfig>(defaultConfig)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [certificadoFile, setCertificadoFile] = useState<string | null>(null)
  const [certificadoNome, setCertificadoNome] = useState<string>("")
  const { toast } = useToast()

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const response = await fetch("/api/nfe/config")
      const result = await response.json()

      if (result.success && result.data) {
        setConfig({ ...defaultConfig, ...result.data })
      }
    } catch (error: any) {
      console.error("Erro ao carregar config NF-e:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCertificadoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".pfx") && !file.name.endsWith(".p12")) {
      toast({
        title: "Arquivo inválido",
        description: "Selecione um arquivo .pfx ou .p12",
        variant: "destructive",
      })
      return
    }

    setCertificadoNome(file.name)

    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1]
      setCertificadoFile(base64)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!config.razao_social || !config.cnpj || !config.inscricao_estadual) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha a razão social, CNPJ e inscrição estadual",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...config,
        certificado_base64: certificadoFile || config.certificado_base64,
      }

      const response = await fetch("/api/nfe/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result = await response.json()

      if (result.success) {
        toast({ title: "Salvo!", description: "Configurações NF-e salvas com sucesso!" })
        loadConfig()
      } else {
        toast({ title: "Erro", description: result.message, variant: "destructive" })
      }
    } catch {
      toast({ title: "Erro", description: "Erro ao salvar configurações", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const updateConfig = (field: keyof NfeConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl shadow-lg">
          <Package className="h-8 w-8 text-blue-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">NF-e - Nota Fiscal de Material</h2>
          <p className="text-muted-foreground font-light text-sm">Configure a emissão de NF-e (material/produto) via SEFAZ-SP</p>
        </div>
      </div>

      {/* Certificado Digital */}
      <Card className="border border-border bg-card text-foreground shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Shield className="h-5 w-5 text-red-400" />
            Certificado Digital A1
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Upload do certificado digital para assinatura das NF-e
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground">Arquivo do Certificado (.pfx / .p12)</Label>
              <div className="flex items-center gap-3">
                <label
                  htmlFor="nfe-cert-upload"
                  className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 border border-border text-foreground rounded-md cursor-pointer transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  <span className="text-sm">Selecionar Arquivo</span>
                </label>
                <input
                  id="nfe-cert-upload"
                  type="file"
                  accept=".pfx,.p12"
                  onChange={handleCertificadoUpload}
                  className="hidden"
                />
                {(certificadoNome || config.certificado_base64) && (
                  <Badge variant="outline" className="text-emerald-400 border-emerald-500/20 bg-emerald-500/5">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {certificadoNome || "Certificado configurado"}
                  </Badge>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nfe_cert_senha" className="text-foreground">Senha do Certificado</Label>
              <Input
                id="nfe_cert_senha"
                type="password"
                value={config.certificado_senha}
                onChange={(e) => updateConfig("certificado_senha", e.target.value)}
                placeholder="Senha do certificado .pfx"
                className="bg-background border-border text-foreground focus-visible:ring-red-500"
              />
            </div>
          </div>
          {config.certificado_validade && (
            <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-400">
                <Info className="h-4 w-4 inline mr-1" />
                Certificado válido até: {new Date(config.certificado_validade).toLocaleDateString("pt-BR")}
              </p>
            </div>
          )}
          <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
            <p className="text-sm text-amber-400">
              <AlertCircle className="h-4 w-4 inline mr-1 text-amber-400" />
              O certificado digital A1 é necessário para assinar e transmitir NF-e ao SEFAZ.
              Ele é armazenado de forma segura no banco de dados.
            </p>
          </div>

          {/* Info Simples Nacional */}
          <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-blue-400">
              <Info className="h-4 w-4 inline mr-1" />
              <span className="font-medium">Simples Nacional:</span> CFOP 5102, CSOSN 102, Origem Nacional (0) - valores fixos aplicados automaticamente.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Ambiente */}
      <Card className="border border-border bg-card text-foreground shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Shield className="h-5 w-5 text-blue-400" />
            Ambiente
          </CardTitle>
          <CardDescription className="text-muted-foreground">Selecione entre homologação (teste) e produção</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg bg-background border border-border gap-4">
            <div className="flex items-center gap-3">
              {config.ambiente === 1 ? (
                <>
                  <CheckCircle2 className="h-6 w-6 text-emerald-400 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-emerald-400">Produção</p>
                    <p className="text-sm text-muted-foreground">Notas fiscais reais serão emitidas na SEFAZ</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="h-6 w-6 text-amber-400 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-amber-400">Homologação (Testes)</p>
                    <p className="text-sm text-muted-foreground">Notas fiscais de teste - sem valor fiscal</p>
                  </div>
                </>
              )}
            </div>
            <Select
              value={String(config.ambiente)}
              onValueChange={(v) => updateConfig("ambiente", Number(v))}
            >
              <SelectTrigger className="w-full sm:w-48 bg-background border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground">
                <SelectItem value="2" className="focus:bg-accent focus:text-foreground">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-400" />
                    Homologação
                  </div>
                </SelectItem>
                <SelectItem value="1" className="focus:bg-accent focus:text-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Produção
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Dados do Emitente */}
      <Card className="border border-border bg-card text-foreground shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Building2 className="h-5 w-5 text-blue-400" />
            Dados do Emitente
          </CardTitle>
          <CardDescription className="text-muted-foreground">Informações da empresa para a NF-e</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label className="text-foreground">Razão Social *</Label>
              <Input
                value={config.razao_social}
                onChange={(e) => updateConfig("razao_social", e.target.value)}
                placeholder="Razão social da empresa"
                className="bg-background border-border text-foreground focus-visible:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label className="text-foreground">Nome Fantasia</Label>
              <Input
                value={config.nome_fantasia}
                onChange={(e) => updateConfig("nome_fantasia", e.target.value)}
                placeholder="Nome fantasia"
                className="bg-background border-border text-foreground focus-visible:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">CNPJ *</Label>
              <Input
                value={config.cnpj}
                onChange={(e) => updateConfig("cnpj", e.target.value)}
                placeholder="00.000.000/0000-00"
                className="bg-background border-border text-foreground focus-visible:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Inscrição Estadual *</Label>
              <Input
                value={config.inscricao_estadual}
                onChange={(e) => updateConfig("inscricao_estadual", e.target.value)}
                placeholder="Inscrição Estadual (sem pontos)"
                className="bg-background border-border text-foreground focus-visible:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Telefone</Label>
              <Input
                value={config.telefone}
                onChange={(e) => updateConfig("telefone", e.target.value)}
                placeholder="(11) 99999-9999"
                className="bg-background border-border text-foreground focus-visible:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">CRT (Código de Regime Tributário)</Label>
              <Select
                value={String(config.crt)}
                onValueChange={(v) => updateConfig("crt", Number(v))}
              >
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground">
                  <SelectItem value="1" className="focus:bg-accent focus:text-foreground">1 - Simples Nacional</SelectItem>
                  <SelectItem value="2" className="focus:bg-accent focus:text-foreground">2 - Simples Nacional (excesso sublimite)</SelectItem>
                  <SelectItem value="3" className="focus:bg-accent focus:text-foreground">3 - Regime Normal</SelectItem>
                  <SelectItem value="4" className="focus:bg-accent focus:text-foreground">4 - MEI</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="border-border" />

          {/* Endereco */}
          <h3 className="text-lg font-semibold text-foreground">Endereço do Emitente</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label className="text-foreground">Logradouro</Label>
              <Input
                value={config.endereco}
                onChange={(e) => updateConfig("endereco", e.target.value)}
                placeholder="Rua, Avenida..."
                className="bg-background border-border text-foreground focus-visible:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Número</Label>
              <Input
                value={config.numero_endereco}
                onChange={(e) => updateConfig("numero_endereco", e.target.value)}
                placeholder="Número"
                className="bg-background border-border text-foreground focus-visible:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Complemento</Label>
              <Input
                value={config.complemento}
                onChange={(e) => updateConfig("complemento", e.target.value)}
                placeholder="Sala, Andar..."
                className="bg-background border-border text-foreground focus-visible:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Bairro</Label>
              <Input
                value={config.bairro}
                onChange={(e) => updateConfig("bairro", e.target.value)}
                placeholder="Bairro"
                className="bg-background border-border text-foreground focus-visible:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">CEP</Label>
              <Input
                value={config.cep}
                onChange={(e) => updateConfig("cep", e.target.value)}
                placeholder="00000-000"
                className="bg-background border-border text-foreground focus-visible:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Cidade</Label>
              <Input
                value={config.cidade}
                onChange={(e) => updateConfig("cidade", e.target.value)}
                placeholder="Cidade"
                className="bg-background border-border text-foreground focus-visible:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">UF</Label>
              <Select
                value={config.uf}
                onValueChange={(v) => updateConfig("uf", v)}
              >
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground">
                  <SelectItem value="SP" className="focus:bg-accent focus:text-foreground">SP</SelectItem>
                  <SelectItem value="RJ" className="focus:bg-accent focus:text-foreground">RJ</SelectItem>
                  <SelectItem value="MG" className="focus:bg-accent focus:text-foreground">MG</SelectItem>
                  <SelectItem value="ES" className="focus:bg-accent focus:text-foreground">ES</SelectItem>
                  <SelectItem value="PR" className="focus:bg-accent focus:text-foreground">PR</SelectItem>
                  <SelectItem value="SC" className="focus:bg-accent focus:text-foreground">SC</SelectItem>
                  <SelectItem value="RS" className="focus:bg-accent focus:text-foreground">RS</SelectItem>
                  <SelectItem value="BA" className="focus:bg-accent focus:text-foreground">BA</SelectItem>
                  <SelectItem value="GO" className="focus:bg-accent focus:text-foreground">GO</SelectItem>
                  <SelectItem value="DF" className="focus:bg-accent focus:text-foreground">DF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Código Município IBGE</Label>
              <Input
                value={config.codigo_municipio}
                onChange={(e) => updateConfig("codigo_municipio", e.target.value)}
                placeholder="3550308"
                className="bg-background border-border text-foreground focus-visible:ring-blue-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuracoes Fiscais */}
      <Card className="border border-border bg-card text-foreground shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Hash className="h-5 w-5 text-blue-400" />
            Configurações Fiscais
          </CardTitle>
          <CardDescription className="text-muted-foreground">Parâmetros para emissão da NF-e</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground">Série NF-e</Label>
              <Input
                type="number"
                value={config.serie_nfe}
                onChange={(e) => updateConfig("serie_nfe", Number(e.target.value))}
                placeholder="1"
                className="bg-background border-border text-foreground focus-visible:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Próximo Número NF-e</Label>
              <Input
                type="number"
                value={config.proximo_numero_nfe}
                onChange={(e) => updateConfig("proximo_numero_nfe", Number(e.target.value))}
                placeholder="1"
                className="bg-background border-border text-foreground focus-visible:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Natureza da Operação</Label>
              <Input
                value={config.natureza_operacao}
                onChange={(e) => updateConfig("natureza_operacao", e.target.value)}
                placeholder="Venda"
                className="bg-background border-border text-foreground focus-visible:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Informações Complementares</Label>
            <Textarea
              value={config.info_complementar}
              onChange={(e) => updateConfig("info_complementar", e.target.value)}
              placeholder="Informações adicionais que aparecerão na NF-e"
              className="bg-background border-border text-foreground focus-visible:ring-blue-500"
              rows={3}
            />
          </div>

          {/* Valores Fixos - Simples Nacional */}
          <Card className="border border-border bg-background">
            <CardContent className="p-4">
              <h4 className="font-semibold text-foreground mb-3">Valores Fixos - Simples Nacional</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-card border border-border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">CFOP</p>
                  <p className="text-lg font-bold text-foreground">5102</p>
                  <p className="text-xs text-muted-foreground">Venda de mercadoria adquirida</p>
                </div>
                <div className="p-3 rounded-lg bg-card border border-border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">CSOSN</p>
                  <p className="text-lg font-bold text-foreground">102</p>
                  <p className="text-xs text-muted-foreground">Tributada sem permissão de crédito</p>
                </div>
                <div className="p-3 rounded-lg bg-card border border-border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Origem</p>
                  <p className="text-lg font-bold text-foreground">0 - Nacional</p>
                  <p className="text-xs text-muted-foreground">Mercadoria nacional</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Botao Salvar */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8"
          size="lg"
        >
          {saving ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-5 w-5 mr-2" />
              Salvar Configurações NF-e
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
