"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  Database,
  HardDrive,
  Download,
  Trash2,
  RefreshCw,
  Calendar,
  Archive,
  AlertTriangle,
  Folder,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface TableInfo {
  name: string
  rows: number
  size: number
  engine: string
  created: Date | null
}

interface BackupFile {
  filename: string
  type: "database" | "system"
  size: number
  created: Date
  modified: Date
}

interface SystemInfo {
  projectSize: number
  nodeVersion: string
  platform: string
  uptime: number
  memoryUsage: {
    rss: number
    heapTotal: number
    heapUsed: number
    external: number
  }
  name?: string
  version?: string
  dependencies?: number
  devDependencies?: number
}

export function BackupTab() {
  const { toast } = useToast()
  const [tables, setTables] = useState<TableInfo[]>([])
  const [selectedTables, setSelectedTables] = useState<string[]>([])
  const [includeData, setIncludeData] = useState(true)
  const [includeNodeModules, setIncludeNodeModules] = useState(false)
  const [includeLogs, setIncludeLogs] = useState(false)
  const [includeBackups, setIncludeBackups] = useState(false)
  const [backupFiles, setBackupFiles] = useState<BackupFile[]>([])
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [loadingTables, setLoadingTables] = useState(true)
  const [loadingSystem, setLoadingSystem] = useState(true)
  const [loadingBackups, setLoadingBackups] = useState(true)

  useEffect(() => {
    loadTables()
    loadSystemInfo()
    loadBackupFiles()
  }, [])

  const loadTables = async () => {
    try {
      setLoadingTables(true)
      const response = await fetch("/api/backup/database")
      const result = await response.json()

      if (result.success) {
        setTables(result.tables)
        setSelectedTables(result.tables.map((t: TableInfo) => t.name))
      } else {
        toast({
          title: "Erro",
          description: "Erro ao carregar tabelas do banco",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao carregar tabelas:", error)
      toast({
        title: "Erro",
        description: "Erro ao conectar com o servidor",
        variant: "destructive",
      })
    } finally {
      setLoadingTables(false)
    }
  }

  const loadSystemInfo = async () => {
    try {
      setLoadingSystem(true)
      const response = await fetch("/api/backup/system")
      const result = await response.json()

      if (result.success) {
        setSystemInfo(result.systemInfo)
      }
    } catch (error) {
      console.error("Erro ao carregar informações do sistema:", error)
    } finally {
      setLoadingSystem(false)
    }
  }

  const loadBackupFiles = async () => {
    try {
      setLoadingBackups(true)
      const response = await fetch("/api/backup/list")
      const result = await response.json()

      if (result.success) {
        setBackupFiles(
          result.backups.map((backup: any) => ({
            ...backup,
            created: new Date(backup.created),
            modified: new Date(backup.modified),
          })),
        )
      }
    } catch (error) {
      console.error("Erro ao carregar lista de backups:", error)
    } finally {
      setLoadingBackups(false)
    }
  }

  const createDatabaseBackup = async () => {
    if (selectedTables.length === 0) {
      toast({
        title: "Atenção",
        description: "Selecione pelo menos uma tabela para fazer backup",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      setProgress(0)

      // Simular progresso
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch("/api/backup/database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tables: selectedTables,
          includeData,
        }),
      })

      const result = await response.json()
      clearInterval(progressInterval)
      setProgress(100)

      if (result.success) {
        toast({
          title: "Sucesso",
          description: `Backup do banco criado: ${result.filename}`,
        })
        loadBackupFiles()
      } else {
        toast({
          title: "Erro",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao criar backup:", error)
      toast({
        title: "Erro",
        description: "Erro ao criar backup do banco",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }

  const createSystemBackup = async () => {
    try {
      setLoading(true)
      setProgress(0)

      // Simular progresso
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 5, 90))
      }, 500)

      const response = await fetch("/api/backup/system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          includeNodeModules,
          includeLogs,
          includeBackups,
        }),
      })

      const result = await response.json()
      clearInterval(progressInterval)
      setProgress(100)

      if (result.success) {
        toast({
          title: "Sucesso",
          description: `Backup do sistema criado: ${result.filename}`,
        })
        loadBackupFiles()
      } else {
        toast({
          title: "Erro",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao criar backup:", error)
      toast({
        title: "Erro",
        description: "Erro ao criar backup do sistema",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }

  const downloadBackup = async (filename: string) => {
    try {
      const response = await fetch(`/api/backup/download/${filename}`)

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Sucesso",
          description: "Download iniciado",
        })
      } else {
        toast({
          title: "Erro",
          description: "Erro ao fazer download do arquivo",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro no download:", error)
      toast({
        title: "Erro",
        description: "Erro ao fazer download",
        variant: "destructive",
      })
    }
  }

  const deleteBackup = async (filename: string) => {
    if (!confirm(`Tem certeza que deseja excluir o backup "${filename}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/backup/delete/${filename}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Backup excluído com sucesso",
        })
        loadBackupFiles()
      } else {
        toast({
          title: "Erro",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao excluir backup:", error)
      toast({
        title: "Erro",
        description: "Erro ao excluir backup",
        variant: "destructive",
      })
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            Sistema de Backup
          </h2>
          <p className="text-muted-foreground mt-1">Faça backup completo do banco de dados e arquivos do sistema</p>
        </div>
        <Button
          onClick={() => {
            loadTables()
            loadSystemInfo()
            loadBackupFiles()
          }}
          variant="outline"
          size="sm"
          className="border-border text-foreground hover:bg-muted bg-transparent"
        >
          <RefreshCw className="h-4 w-4 mr-2 text-purple-400" />
          Atualizar
        </Button>
      </div>

      {/* Progress Bar */}
      {loading && (
        <Card className="border-purple-500/20 bg-purple-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="animate-spin">
                <RefreshCw className="h-5 w-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-2 text-foreground">Criando backup...</p>
                <Progress value={progress} className="h-2 bg-muted" />
              </div>
              <span className="text-sm text-muted-foreground">{progress}%</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backup do Banco de Dados */}
        <Card className="border-border bg-card text-foreground">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Database className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-lg text-foreground">Backup do Banco de Dados</CardTitle>
                <CardDescription className="text-muted-foreground">Faça backup das tabelas e dados do MySQL</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Opções */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-data"
                  checked={includeData}
                  onCheckedChange={(checked) => setIncludeData(checked as boolean)}
                />
                <label htmlFor="include-data" className="text-sm font-medium text-muted-foreground cursor-pointer">
                  Incluir dados das tabelas
                </label>
              </div>
            </div>

            <Separator className="border-border" />

            {/* Lista de Tabelas */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-foreground">Tabelas ({tables.length})</h4>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-muted bg-transparent" onClick={() => setSelectedTables(tables.map((t) => t.name))}>
                    Todas
                  </Button>
                  <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-muted bg-transparent" onClick={() => setSelectedTables([])}>
                    Nenhuma
                  </Button>
                </div>
              </div>

              {loadingTables ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 bg-muted/40 rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2 border border-border rounded-lg p-3 bg-background">
                  {tables.map((table) => (
                    <div key={table.name} className="flex items-center justify-between p-2 hover:bg-muted/30 rounded border border-transparent hover:border-border transition-all">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`table-${table.name}`}
                          checked={selectedTables.includes(table.name)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedTables([...selectedTables, table.name])
                            } else {
                              setSelectedTables(selectedTables.filter((t) => t !== table.name))
                            }
                          }}
                        />
                        <label htmlFor={`table-${table.name}`} className="text-sm font-medium text-foreground cursor-pointer">
                          {table.name}
                        </label>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="outline" className="bg-muted text-muted-foreground border-border">{table.rows} linhas</Badge>
                        <Badge variant="outline" className="bg-muted text-muted-foreground border-border">{formatBytes(table.size)}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={createDatabaseBackup}
              disabled={loading || selectedTables.length === 0}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Database className="h-4 w-4 mr-2" />
              Criar Backup do Banco
            </Button>
          </CardContent>
        </Card>

        {/* Backup do Sistema */}
        <Card className="border-border bg-card text-foreground">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <HardDrive className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-lg text-foreground">Backup do Sistema</CardTitle>
                <CardDescription className="text-muted-foreground">Faça backup completo dos arquivos do projeto</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Informações do Sistema */}
            {loadingSystem ? (
              <div className="space-y-2">
                <div className="h-4 bg-muted/40 rounded animate-pulse" />
                <div className="h-4 bg-muted/40 rounded animate-pulse w-3/4" />
              </div>
            ) : (
              systemInfo && (
                <div className="grid grid-cols-2 gap-3 text-sm border border-border p-4 bg-muted/20 rounded-xl">
                  <div>
                    <span className="text-muted-foreground">Tamanho:</span>
                    <span className="ml-2 font-medium text-foreground">{formatBytes(systemInfo.projectSize)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Node.js:</span>
                    <span className="ml-2 font-medium text-foreground">{systemInfo.nodeVersion}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Plataforma:</span>
                    <span className="ml-2 font-medium text-foreground">{systemInfo.platform}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Uptime:</span>
                    <span className="ml-2 font-medium text-foreground">{formatUptime(systemInfo.uptime)}</span>
                  </div>
                  {systemInfo.dependencies && (
                    <div>
                      <span className="text-muted-foreground">Deps:</span>
                      <span className="ml-2 font-medium text-foreground">{systemInfo.dependencies}</span>
                    </div>
                  )}
                  {systemInfo.version && (
                    <div>
                      <span className="text-muted-foreground">Versão:</span>
                      <span className="ml-2 font-medium text-foreground">{systemInfo.version}</span>
                    </div>
                  )}
                </div>
              )
            )}

            <Separator className="border-border" />

            {/* Opções */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-node-modules"
                  checked={includeNodeModules}
                  onCheckedChange={(checked) => setIncludeNodeModules(checked as boolean)}
                />
                <label htmlFor="include-node-modules" className="text-sm font-medium text-muted-foreground cursor-pointer">
                  Incluir node_modules
                </label>
                <Badge variant="outline" className="text-xs bg-muted text-muted-foreground border-border">
                  +~200MB
                </Badge>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-logs"
                  checked={includeLogs}
                  onCheckedChange={(checked) => setIncludeLogs(checked as boolean)}
                />
                <label htmlFor="include-logs" className="text-sm font-medium text-muted-foreground cursor-pointer">
                  Incluir arquivos de log
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-backups"
                  checked={includeBackups}
                  onCheckedChange={(checked) => setIncludeBackups(checked as boolean)}
                />
                <label htmlFor="include-backups" className="text-sm font-medium text-muted-foreground cursor-pointer">
                  Incluir backups anteriores
                </label>
              </div>
            </div>

            <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                <div className="text-sm text-amber-500">
                  <p className="font-medium">Atenção:</p>
                  <p className="text-xs text-muted-foreground mt-0.5">O backup do sistema pode ser grande e demorar alguns minutos.</p>
                </div>
              </div>
            </div>

            <Button
              onClick={createSystemBackup}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Archive className="h-4 w-4 mr-2" />
              Criar Backup do Sistema
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Backups */}
      <Card className="border-border bg-card text-foreground">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Folder className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-lg text-foreground">Backups Existentes</CardTitle>
              <CardDescription className="text-muted-foreground">Gerencie os arquivos de backup criados</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingBackups ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted/40 rounded animate-pulse" />
              ))}
            </div>
          ) : backupFiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Archive className="h-12 w-12 mx-auto mb-3 opacity-50 text-purple-400" />
              <p>Nenhum backup encontrado</p>
              <p className="text-sm text-muted-foreground">Crie seu primeiro backup usando as opções acima</p>
            </div>
          ) : (
            <div className="space-y-3">
              {backupFiles.map((backup) => (
                <div
                  key={backup.filename}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 bg-background/50 hover:border-border transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                      {backup.type === "database" ? (
                        <Database className="h-4 w-4" />
                      ) : (
                        <HardDrive className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm sm:text-base break-all max-w-[200px] sm:max-w-md">{backup.filename}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-purple-400" />
                          {format(backup.created, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                        <span>{formatBytes(backup.size)}</span>
                        <Badge variant="outline" className="border-border text-muted-foreground bg-muted/40">
                          {backup.type === "database" ? "Banco" : "Sistema"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-muted bg-transparent" onClick={() => downloadBackup(backup.filename)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteBackup(backup.filename)}
                      className="text-red-400 hover:text-red-300 border-border hover:bg-red-500/10 bg-transparent"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
