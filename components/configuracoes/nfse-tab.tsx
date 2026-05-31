"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  Save,
  Shield,
  Upload,
  Building2,
  Hash,
  Database,
  ExternalLink,
  Info,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface NfseConfig {
  id?: number
  inscricao_municipal: string
  razao_social: string
  cnpj: string
  endereco: string
  numero_endereco: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
  cep: string
  codigo_municipio: string
  codigo_servico: string
  descricao_servico: string
  aliquota_iss: number
  codigo_cnae: string
  regime_tributacao: number
  optante_simples: number
  incentivador_cultural: number
  certificado_base64: string | null
  certificado_senha: string
  certificado_validade: string
  ambiente: number
  serie_rps: string
  tipo_rps: number
  proximo_numero_rps: number
  ultima_nfse_numero: number
}

const defaultConfig: NfseConfig = {
  inscricao_municipal: "",
  razao_social: "",
  cnpj: "",
  endereco: "",
  numero_endereco: "",
  complemento: "",
  bairro: "",
  cidade: "SAO PAULO",
  uf: "SP",
  cep: "",
  codigo_municipio: "3550308",
  codigo_servico: "",
  descricao_servico: "",
  aliquota_iss: 0.05,
  codigo_cnae: "",
  regime_tributacao: 6,
  optante_simples: 1,
  incentivador_cultural: 0,
  certificado_base64: null,
  certificado_senha: "",
  certificado_validade: "",
  ambiente: 2,
  serie_rps: "11",
  tipo_rps: 1,
  proximo_numero_rps: 660,
  ultima_nfse_numero: 0,
}

export function NfseTab() {
  const [config, setConfig] = useState<NfseConfig>(defaultConfig)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [migrando, setMigrando] = useState(false)
  const [tabelasCriadas, setTabelasCriadas] = useState(false)
  const [certificadoFile, setCertificadoFile] = useState<string | null>(null)
  const [certificadoNome, setCertificadoNome] = useState<string>("")
  const { toast } = useToast()

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const response = await fetch("/api/nfse/config")
      const result = await response.json()

      if (result.success) {
        if (result.data) {
          setConfig({ ...defaultConfig, ...result.data })
          setTabelasCriadas(true)
          if (result.data.certificado_base64 === "[CARREGADO]") {
            setCertificadoNome("Certificado carregado")
          }
        } else {
          setTabelasCriadas(true)
        }
      }
    } catch (error: any) {
      // Se der erro, pode ser que as tabelas não existam ainda
      if (error?.message?.includes("doesn't exist") || true) {
        setTabelasCriadas(false)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleMigrate = async () => {
    setMigrando(true)
    try {
      const response = await fetch("/api/nfse/migrate", { method: "POST" })
      const result = await response.json()

      if (result.success) {
        toast({ title: "Sucesso", description: "Tabelas NFS-e criadas com sucesso!" })
        setTabelasCriadas(true)
      } else {
        toast({ title: "Erro", description: result.message, variant: "destructive" })
      }
    } catch {
      toast({ title: "Erro", description: "Erro ao criar tabelas", variant: "destructive" })
    } finally {
      setMigrando(false)
    }
  }

  const handleSave = async () => {
    if (!config.inscricao_municipal || !config.razao_social || !config.cnpj || !config.codigo_cnae) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha a inscrição municipal, razão social, CNPJ e código CNAE",
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

      const response = await fetch("/api/nfse/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result = await response.json()

      if (result.success) {
        toast({ title: "Salvo!", description: "Configurações NFS-e salvas com sucesso!" })
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

    // Converter para base64
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1]
      setCertificadoFile(base64)
    }
    reader.readAsDataURL(file)
  }

  const updateConfig = (field: keyof NfseConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl shadow-lg">
          <FileText className="h-8 w-8 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">NFS-e - Nota Fiscal de Serviço</h2>
          <p className="text-muted-foreground font-light text-sm">Configure a emissão de NFS-e para a Prefeitura de São Paulo</p>
        </div>
      </div>

      {/* Botão para criar tabelas se necessário */}
      {!tabelasCriadas && (
        <Card className="border border-amber-500/20 bg-amber-500/5 text-foreground">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
              <div className="flex items-center gap-3">
                <Database className="h-10 w-10 text-amber-400 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-amber-400">Configuração Inicial Necessária</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    As tabelas do módulo NFS-e precisam ser criadas no banco de dados antes de utilizar este recurso.
                  </p>
                </div>
              </div>
              <Button onClick={handleMigrate} disabled={migrando} className="bg-amber-600 hover:bg-amber-700 text-white w-full sm:w-auto">
                {migrando ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Criar Tabelas
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ambiente */}
      <Card className="border border-border bg-card text-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Shield className="h-5 w-5 text-blue-400" />
            Ambiente
          </CardTitle>
          <CardDescription className="text-muted-foreground">Selecione entre homologação (teste) e produção</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg bg-background border border-border gap-4">
            <div className="flex items-center gap-3">
              {config.ambiente === 1 ? (
                <>
                  <CheckCircle2 className="h-6 w-6 text-emerald-400 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-emerald-400">Produção</p>
                    <p className="text-sm text-muted-foreground">Notas fiscais reais serão emitidas</p>
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
                <SelectItem value="2" className="focus:bg-accent focus:text-foreground">Homologação</SelectItem>
                <SelectItem value="1" className="focus:bg-accent focus:text-foreground">Produção</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {config.ambiente === 1 && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400 font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Atenção: Em modo produção, as notas fiscais emitidas terão valor fiscal real!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dados do Prestador */}
      <Card className="border border-border bg-card text-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Building2 className="h-5 w-5 text-indigo-400" />
            Dados do Prestador
          </CardTitle>
          <CardDescription className="text-muted-foreground">Informações da sua empresa para emissão de NFS-e</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="razao_social" className="text-foreground">Razão Social *</Label>
              <Input
                id="razao_social"
                value={config.razao_social}
                onChange={(e) => updateConfig("razao_social", e.target.value)}
                placeholder="Nome da empresa"
                className="bg-background border-border text-foreground focus-visible:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnpj" className="text-foreground">CNPJ *</Label>
              <Input
                id="cnpj"
                value={config.cnpj}
                onChange={(e) => updateConfig("cnpj", e.target.value)}
                placeholder="00.000.000/0000-00"
                className="bg-background border-border text-foreground focus-visible:ring-indigo-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inscricao_municipal" className="text-foreground">Inscrição Municipal *</Label>
              <Input
                id="inscricao_municipal"
                value={config.inscricao_municipal}
                onChange={(e) => updateConfig("inscricao_municipal", e.target.value)}
                placeholder="Número da inscrição municipal"
                className="bg-background border-border text-foreground focus-visible:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="codigo_municipio" className="text-foreground">Código do Município</Label>
              <Input
                id="codigo_municipio"
                value={config.codigo_municipio}
                onChange={(e) => updateConfig("codigo_municipio", e.target.value)}
                placeholder="3550308 (São Paulo)"
                className="bg-background border-border text-foreground focus-visible:ring-indigo-500"
              />
            </div>
          </div>

          <Separator className="my-4 border-border" />
          <h4 className="font-semibold text-foreground">Endereço</h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="endereco" className="text-foreground">Logradouro</Label>
              <Input
                id="endereco"
                value={config.endereco}
                onChange={(e) => updateConfig("endereco", e.target.value)}
                placeholder="Rua, Avenida, etc."
                className="bg-background border-border text-foreground focus-visible:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numero_endereco" className="text-foreground">Número</Label>
              <Input
                id="numero_endereco"
                value={config.numero_endereco}
                onChange={(e) => updateConfig("numero_endereco", e.target.value)}
                placeholder="123"
                className="bg-background border-border text-foreground focus-visible:ring-indigo-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="complemento" className="text-foreground">Complemento</Label>
              <Input
                id="complemento"
                value={config.complemento}
                onChange={(e) => updateConfig("complemento", e.target.value)}
                placeholder="Sala, Andar"
                className="bg-background border-border text-foreground focus-visible:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bairro" className="text-foreground">Bairro</Label>
              <Input
                id="bairro"
                value={config.bairro}
                onChange={(e) => updateConfig("bairro", e.target.value)}
                className="bg-background border-border text-foreground focus-visible:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cidade" className="text-foreground">Cidade</Label>
              <Input
                id="cidade"
                value={config.cidade}
                onChange={(e) => updateConfig("cidade", e.target.value)}
                className="bg-background border-border text-foreground focus-visible:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cep" className="text-foreground">CEP</Label>
              <Input
                id="cep"
                value={config.cep}
                onChange={(e) => updateConfig("cep", e.target.value)}
                placeholder="00000-000"
                className="bg-background border-border text-foreground focus-visible:ring-indigo-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados Fiscais */}
      <Card className="border border-border bg-card text-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Hash className="h-5 w-5 text-emerald-400" />
            Dados Fiscais
          </CardTitle>
          <CardDescription className="text-muted-foreground">Códigos e alíquotas para emissão de NFS-e</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo_servico" className="text-foreground">Código do Serviço (SP)</Label>
              <Input
                id="codigo_servico"
                value={config.codigo_servico}
                onChange={(e) => updateConfig("codigo_servico", e.target.value)}
                placeholder="Ex: 1401 (somente dígitos)"
                className="bg-background border-border text-foreground focus-visible:ring-emerald-500"
              />
              <p className="text-xs text-muted-foreground">Somente dígitos, sem ponto. Ex: 1401 (não 14.01). Se não informado, será usado o CNAE.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="codigo_cnae" className="text-foreground">Código CNAE *</Label>
              <Input
                id="codigo_cnae"
                value={config.codigo_cnae}
                onChange={(e) => updateConfig("codigo_cnae", e.target.value)}
                placeholder="Ex: 07498"
                className="bg-background border-border text-foreground focus-visible:ring-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aliquota_iss" className="text-foreground">Alíquota ISS (%)</Label>
              <Input
                id="aliquota_iss"
                type="number"
                step="0.01"
                value={(config.aliquota_iss * 100).toFixed(2)}
                onChange={(e) => updateConfig("aliquota_iss", Number(e.target.value) / 100)}
                placeholder="5.00"
                className="bg-background border-border text-foreground focus-visible:ring-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao_servico" className="text-foreground">Descrição Padrão do Serviço</Label>
            <Textarea
              id="descricao_servico"
              value={config.descricao_servico}
              onChange={(e) => updateConfig("descricao_servico", e.target.value)}
              placeholder="Descrição padrão que aparecerá na NFS-e"
              className="bg-background border-border text-foreground focus-visible:ring-emerald-500"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground">Regime de Tributação</Label>
              <Select
                value={String(config.regime_tributacao)}
                onValueChange={(v) => updateConfig("regime_tributacao", Number(v))}
              >
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground">
                  <SelectItem value="1" className="focus:bg-accent focus:text-foreground">Microempresa Municipal</SelectItem>
                  <SelectItem value="2" className="focus:bg-accent focus:text-foreground">Estimativa</SelectItem>
                  <SelectItem value="3" className="focus:bg-accent focus:text-foreground">Sociedade de Profissionais</SelectItem>
                  <SelectItem value="4" className="focus:bg-accent focus:text-foreground">Cooperativa</SelectItem>
                  <SelectItem value="5" className="focus:bg-accent focus:text-foreground">MEI</SelectItem>
                  <SelectItem value="6" className="focus:bg-accent focus:text-foreground">ME/EPP Simples Nacional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Optante Simples Nacional</Label>
              <div className="flex items-center gap-3 pt-2">
                <Switch
                  checked={config.optante_simples === 1}
                  onCheckedChange={(checked) => updateConfig("optante_simples", checked ? 1 : 0)}
                />
                <span className="text-sm text-muted-foreground">
                  {config.optante_simples === 1 ? "Sim" : "Não"}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Incentivador Cultural</Label>
              <div className="flex items-center gap-3 pt-2">
                <Switch
                  checked={config.incentivador_cultural === 1}
                  onCheckedChange={(checked) => updateConfig("incentivador_cultural", checked ? 1 : 0)}
                />
                <span className="text-sm text-muted-foreground">
                  {config.incentivador_cultural === 1 ? "Sim" : "Não"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* RPS */}
      <Card className="border border-border bg-card text-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <FileText className="h-5 w-5 text-blue-400" />
            Configuração do RPS
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Recibo Provisório de Serviços - o número do RPS é diferente do número da NFS-e.
            O RPS é gerado pelo sistema, a NFS-e é atribuída pela prefeitura.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serie_rps" className="text-foreground">Série do RPS</Label>
              <Input
                id="serie_rps"
                value={config.serie_rps}
                onChange={(e) => updateConfig("serie_rps", e.target.value)}
                placeholder="11"
                className="bg-background border-border text-foreground focus-visible:ring-blue-500"
              />
              <p className="text-xs text-muted-foreground">Sua série atual: 11</p>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Tipo do RPS</Label>
              <Select
                value={String(config.tipo_rps)}
                onValueChange={(v) => updateConfig("tipo_rps", Number(v))}
              >
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground">
                  <SelectItem value="1" className="focus:bg-accent focus:text-foreground">RPS</SelectItem>
                  <SelectItem value="2" className="focus:bg-accent focus:text-foreground">RPS-Mista</SelectItem>
                  <SelectItem value="3" className="focus:bg-accent focus:text-foreground">Cupom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="proximo_rps" className="text-foreground">Próximo Número RPS</Label>
              <Input
                id="proximo_rps"
                type="number"
                value={config.proximo_numero_rps}
                onChange={(e) => updateConfig("proximo_numero_rps", Number(e.target.value))}
                className="bg-background border-border text-foreground focus-visible:ring-blue-500"
              />
              <p className="text-xs text-muted-foreground">
                Último RPS usado: {config.proximo_numero_rps - 1} (série {config.serie_rps}.{String(config.proximo_numero_rps - 1).padStart(8, "0")})
              </p>
            </div>
          </div>

          <Separator className="border-border" />

          <div className="space-y-2">
            <Label htmlFor="ultima_nfse_numero" className="flex items-center gap-2 text-foreground">
              <Hash className="h-4 w-4 text-emerald-400" />
              Próximo Número NFS-e
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Input
                  id="ultima_nfse_numero"
                  type="number"
                  value={config.ultima_nfse_numero}
                  onChange={(e) => updateConfig("ultima_nfse_numero", Number(e.target.value))}
                  placeholder="Ex: 732"
                  className="bg-background border-border text-foreground focus-visible:ring-emerald-500"
                />
                <p className="text-xs text-muted-foreground">
                  Informe o próximo número de NFS-e esperado. Após cada emissão, será incrementado automaticamente.
                </p>
              </div>
              <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                <p className="text-xs text-emerald-400">
                  <strong>Para que serve:</strong> Este número é o próximo número de NFS-e que será atribuído pela prefeitura.
                  Após cada emissão bem-sucedida, o sistema incrementa automaticamente.
                  Consulte o último número emitido no portal da{" "}
                  <a
                    href="https://nfe.prefeitura.sp.gov.br"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-medium hover:text-emerald-300"
                  >
                    Prefeitura de SP
                  </a>{" "}
                  e informe o próximo (último + 1).
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
            <p className="text-xs text-blue-400">
              <strong>Importante:</strong> O número do RPS (ex: {config.serie_rps}.{String(config.proximo_numero_rps).padStart(8, "0")}) é gerado por este sistema e enviado à prefeitura.
              O número da NFS-e (ex: {config.ultima_nfse_numero ? String(config.ultima_nfse_numero).padStart(8, "0") : "00000XXX"}) é atribuído automaticamente pela prefeitura após processamento.
              Se você precisar ajustar o próximo RPS ou NFS-e, altere os campos acima.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Certificado Digital */}
      <Card className="border border-border bg-card text-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Shield className="h-5 w-5 text-red-400" />
            Certificado Digital A1
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Upload do certificado digital para assinatura das notas fiscais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground">Arquivo do Certificado (.pfx / .p12)</Label>
              <div className="flex items-center gap-3">
                <label
                  htmlFor="cert-upload"
                  className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 border border-border text-foreground rounded-md cursor-pointer transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  <span className="text-sm">Selecionar Arquivo</span>
                </label>
                <input
                  id="cert-upload"
                  type="file"
                  accept=".pfx,.p12"
                  onChange={handleCertificadoUpload}
                  className="hidden"
                />
                {certificadoNome && (
                  <Badge variant="outline" className="text-emerald-400 border-emerald-500/20 bg-emerald-500/5">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {certificadoNome}
                  </Badge>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cert_senha" className="text-foreground">Senha do Certificado</Label>
              <Input
                id="cert_senha"
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
              O certificado é armazenado de forma segura no banco de dados. Para emissão em produção,
              é necessário configurar um serviço intermediário para assinatura com certificado TLS mútuo.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Orientações SP */}
      <Card className="border border-border bg-card text-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <ExternalLink className="h-5 w-5 text-blue-400" />
            Como Funciona - Prefeitura de São Paulo
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Informações sobre a emissão de NFS-e via Web Service em São Paulo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Aviso importante: Não precisa de credenciamento */}
          <div className="p-4 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
            <h4 className="font-medium text-emerald-400 mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Não é necessário credenciamento separado
            </h4>
            <p className="text-sm text-muted-foreground">
              A Prefeitura de São Paulo <strong>não exige um processo de credenciamento separado</strong> para usar o Web Service.
              A autenticação é feita diretamente pelo seu <strong>certificado digital A1</strong> nas chamadas ao webservice.
              Como você já possui o certificado e a inscrição municipal ativa, você já pode emitir NFS-e pelo sistema.
            </p>
          </div>

          {/* Passo a Passo */}
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Passo a passo para começar a emitir:</h4>

            <div className="flex gap-3 p-3 bg-zinc-800/30 border border-border rounded-lg">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-sm font-bold">1</div>
              <div>
                <p className="font-medium text-foreground">Preencha os dados do prestador acima</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Utilize as informações do seu perfil no portal{" "}
                  <button
                    type="button"
                    onClick={() => window.open("https://nfe.prefeitura.sp.gov.br", "_blank")}
                    className="text-emerald-400 hover:text-emerald-300 underline"
                  >
                    nfe.prefeitura.sp.gov.br
                  </button>
                  . Preencha CNPJ, Inscrição Municipal, endereço e dados fiscais conforme aparecem no portal da prefeitura.
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-3 bg-zinc-800/30 border border-border rounded-lg">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-sm font-bold">2</div>
              <div>
                <p className="font-medium text-foreground">Carregue o certificado digital A1</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Faça o upload do seu arquivo <strong>.pfx ou .p12</strong> e informe a senha.
                  O certificado será usado para autenticar as chamadas ao webservice e assinar digitalmente os RPS (Recibos Provisórios de Serviço).
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-3 bg-zinc-800/30 border border-border rounded-lg">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-sm font-bold">3</div>
              <div>
                <p className="font-medium text-foreground">Preencha o código de serviço</p>
                <p className="text-sm text-muted-foreground mt-1">
                  No portal da prefeitura, em &quot;Configurações do Perfil&quot;, você encontra o <strong>Código de Serviço Principal</strong>.
                  No seu caso, o código aparece na seção &quot;Código de Serviço Principal&quot; da página de configurações do perfil do contribuinte.
                  Informe esse código no campo &quot;Código do Serviço&quot; acima.
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-3 bg-zinc-800/30 border border-border rounded-lg">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-sm font-bold">4</div>
              <div>
                <p className="font-medium text-foreground">Teste em Homologação primeiro</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Mantenha o ambiente em <strong>&quot;Homologação&quot;</strong> (já selecionado por padrão) e faça um teste de emissão
                  na página <strong>Notas Fiscais</strong>. As notas em homologação não têm valor fiscal.
                  Após validar que tudo funciona, mude para &quot;Produção&quot;.
                </p>
              </div>
            </div>
          </div>

          <Separator className="border-border" />

          {/* Como a emissão funciona tecnicamente */}
          <div className="p-4 bg-background border border-border rounded-lg">
            <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
              <Info className="h-4 w-4 text-emerald-400" />
              Como funciona a emissão
            </h4>
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
              <li>O sistema gera um <strong>RPS</strong> (Recibo Provisório de Serviços) com os dados da nota</li>
              <li>O RPS é enviado ao Web Service da Prefeitura de SP via SOAP com autenticação por certificado digital</li>
              <li>A prefeitura processa o RPS e converte em <strong>NFS-e</strong> (Nota Fiscal de Serviço Eletrônica)</li>
              <li>O número da NFS-e e o link de verificação são retornados e armazenados no sistema</li>
            </ol>
          </div>

          {/* Reforma Tributária 2026 */}
          <div className="p-4 bg-amber-500/5 rounded-lg border border-amber-500/20">
            <h4 className="font-medium text-amber-400 mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Reforma Tributária 2026 - Layouts de Emissão
            </h4>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                A partir de 01/01/2026, a Prefeitura de SP permite emissão em <strong>dois layouts</strong>:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Layout 1 (atual)</strong> - Emissão apenas com destaque de ISS. Funciona via Web Service, TXT e Online.</li>
                <li><strong>Layout 2 (novo)</strong> - Emissão com destaque de ISS, IBS e CBS (novos tributos). Funciona via Web Service e Online.</li>
              </ul>
              <p>
                O ano de 2026 é um <strong>ano de teste</strong> para IBS/CBS (LC 214/2025). Este sistema utiliza
                o <strong>Layout 1</strong> por padrão. O preenchimento dos campos de IBS/CBS no Layout 2 é opcional,
                mas se preenchidos, serão validados pela prefeitura.
              </p>
            </div>
          </div>

          {/* Endpoints usados */}
          <div className="p-4 bg-blue-500/5 rounded-lg border border-blue-500/20">
            <h4 className="font-medium text-blue-400 mb-2">Endpoints do Web Service SP (LoteNFe)</h4>
            <div className="space-y-1 text-xs font-mono text-blue-300">
              <p><strong>Produção:</strong> https://nfe.prefeitura.sp.gov.br/ws/lotenfe.asmx</p>
              <p><strong>Homologação:</strong> https://nfeh.prefeitura.sp.gov.br/ws/lotenfe.asmx</p>
              <p className="mt-2 text-blue-400"><strong>Schemas XSD:</strong> https://nfe.prefeitura.sp.gov.br/ws/schemas.zip</p>
            </div>
          </div>

          {/* Links Oficiais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="w-full bg-secondary hover:bg-secondary/80 border-border text-foreground"
              onClick={() => window.open("https://nfe.prefeitura.sp.gov.br", "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Portal NFS-e SP
            </Button>
            <Button
              variant="outline"
              className="w-full bg-secondary hover:bg-secondary/80 border-border text-foreground"
              onClick={() => window.open("https://nfe.prefeitura.sp.gov.br/arquivos/nfews.pdf", "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Manual Web Service
            </Button>
            <Button
              variant="outline"
              className="w-full bg-secondary hover:bg-secondary/80 border-border text-foreground"
              onClick={() => window.open("https://www.prefeitura.sp.gov.br/cidade/secretarias/financas/servicos/?p=1883", "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Secretaria da Fazenda
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
          size="lg"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações NFS-e
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
