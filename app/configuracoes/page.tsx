"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  Download,
  Settings,
  ImageIcon,
  Layout,
  Wrench,
  Calendar,
  Car,
  FileText,
  Database,
  CreditCard,
  FileCheck,
  Package,
} from "lucide-react"
import { LogosTab } from "@/components/configuracoes/logos-tab"
import { LayoutTab } from "@/components/configuracoes/layout-tab"
import { EquipamentosTab } from "@/components/configuracoes/equipamentos-tab"
import { FeriadosTab } from "@/components/configuracoes/feriados-tab"
import { VisitasTab } from "@/components/configuracoes/visitas-tab"
import { ValorKmTab } from "@/components/configuracoes/valor-km-tab"
import { TermosTab } from "@/components/configuracoes/termos-tab"
import { BackupTab } from "@/components/configuracoes/backup-tab"
import { AsaasTab } from "@/components/configuracoes/asaas-tab"
import { NfseTab } from "@/components/configuracoes/nfse-tab"
import { NfeTab } from "@/components/configuracoes/nfe-tab"
import { useEffect } from "react"

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState("logos")
  const [logoMenu, setLogoMenu] = useState<string>("")

  useEffect(() => {
    loadLogoMenu()
  }, [])

  const loadLogoMenu = async () => {
    try {
      const response = await fetch("/api/configuracoes/logos")
      const result = await response.json()
      if (result.success && result.data?.length > 0) {
        const menuLogo = result.data.find((logo: any) => logo.tipo === "menu")
        if (menuLogo?.arquivo_base64) {
          setLogoMenu(menuLogo.arquivo_base64)
        }
      }
    } catch (error) {
      console.error("Erro ao carregar logo do menu:", error)
    }
  }

  const handleExportarConfiguracoes = () => {
    // Implementar exportação das configurações
    console.log("Exportar configurações")
  }

  return (
    <div className="w-full text-foreground">
      <div className="container mx-auto p-6 space-y-6 pb-32 md:pb-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            {logoMenu && (
              <img
                src={logoMenu || "/placeholder.svg"}
                alt="Logo"
                className="h-12 w-12 object-contain rounded-lg shadow-md bg-card p-1 border border-border"
              />
            )}
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                Configurações
              </h1>
              <p className="text-muted-foreground mt-1">Configure as opções do sistema</p>
              <div className="mt-4">
                <Button
                  onClick={handleExportarConfiguracoes}
                  variant="outline"
                  className="border-border text-foreground hover:bg-muted bg-transparent flex rounded-xl"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Configurações
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Card className="border border-border/80 shadow-2xl bg-card text-foreground overflow-hidden rounded-xl">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Desktop: Grid 11 colunas */}
              <div className="hidden md:block border-b border-border bg-slate-100/50 dark:bg-slate-900/40 p-1.5">
                <TabsList className="grid w-full grid-cols-11 h-auto p-0 bg-transparent gap-1">
                  <TabsTrigger
                    value="logos"
                    className="flex flex-col items-center gap-1.5 py-2.5 text-xs font-semibold data-[state=active]:bg-purple-500/15 data-[state=active]:text-purple-400 text-muted-foreground hover:text-foreground transition-all rounded-lg"
                  >
                    <ImageIcon className="h-4 w-4" />
                    Logos
                  </TabsTrigger>
                  <TabsTrigger
                    value="layout"
                    className="flex flex-col items-center gap-1.5 py-2.5 text-xs font-semibold data-[state=active]:bg-blue-500/15 data-[state=active]:text-blue-400 text-muted-foreground hover:text-foreground transition-all rounded-lg"
                  >
                    <Layout className="h-4 w-4" />
                    Layout
                  </TabsTrigger>
                  <TabsTrigger
                    value="equipamentos"
                    className="flex flex-col items-center gap-1.5 py-2.5 text-xs font-semibold data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 text-muted-foreground hover:text-foreground transition-all rounded-lg"
                  >
                    <Wrench className="h-4 w-4" />
                    Equipamentos
                  </TabsTrigger>
                  <TabsTrigger
                    value="feriados"
                    className="flex flex-col items-center gap-1.5 py-2.5 text-xs font-semibold data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-400 text-muted-foreground hover:text-foreground transition-all rounded-lg"
                  >
                    <Calendar className="h-4 w-4" />
                    Feriados
                  </TabsTrigger>
                  <TabsTrigger
                    value="visitas"
                    className="flex flex-col items-center gap-1.5 py-2.5 text-xs font-semibold data-[state=active]:bg-violet-500/15 data-[state=active]:text-violet-400 text-muted-foreground hover:text-foreground transition-all rounded-lg"
                  >
                    <Settings className="h-4 w-4" />
                    Visitas
                  </TabsTrigger>
                  <TabsTrigger
                    value="valor-km"
                    className="flex flex-col items-center gap-1.5 py-2.5 text-xs font-semibold data-[state=active]:bg-red-500/15 data-[state=active]:text-red-400 text-muted-foreground hover:text-foreground transition-all rounded-lg"
                  >
                    <Car className="h-4 w-4" />
                    Valor KM
                  </TabsTrigger>
                  <TabsTrigger
                    value="termos"
                    className="flex flex-col items-center gap-1.5 py-2.5 text-xs font-semibold data-[state=active]:bg-teal-500/15 data-[state=active]:text-teal-400 text-muted-foreground hover:text-foreground transition-all rounded-lg"
                  >
                    <FileText className="h-4 w-4" />
                    Termos
                  </TabsTrigger>
                  <TabsTrigger
                    value="backup"
                    className="flex flex-col items-center gap-1.5 py-2.5 text-xs font-semibold data-[state=active]:bg-orange-500/15 data-[state=active]:text-orange-400 text-muted-foreground hover:text-foreground transition-all rounded-lg"
                  >
                    <Database className="h-4 w-4" />
                    Backup
                  </TabsTrigger>
                  <TabsTrigger
                    value="asaas"
                    className="flex flex-col items-center gap-1.5 py-2.5 text-xs font-semibold data-[state=active]:bg-cyan-500/15 data-[state=active]:text-cyan-400 text-muted-foreground hover:text-foreground transition-all rounded-lg"
                  >
                    <CreditCard className="h-4 w-4" />
                    Asaas
                  </TabsTrigger>
                  <TabsTrigger
                    value="nfse"
                    className="flex flex-col items-center gap-1.5 py-2.5 text-xs font-semibold data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 text-muted-foreground hover:text-foreground transition-all rounded-lg"
                  >
                    <FileCheck className="h-4 w-4" />
                    NFS-e
                  </TabsTrigger>
                  <TabsTrigger
                    value="nfe"
                    className="flex flex-col items-center gap-1.5 py-2.5 text-xs font-semibold data-[state=active]:bg-blue-500/15 data-[state=active]:text-blue-400 text-muted-foreground hover:text-foreground transition-all rounded-lg"
                  >
                    <Package className="h-4 w-4" />
                    NF-e
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Mobile: Grid fixo no rodapé */}
              <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-2xl">
                <TabsList className="grid grid-cols-5 grid-rows-3 w-full h-auto p-2 gap-1 bg-muted/20">
                  <TabsTrigger
                    value="logos"
                    className="flex flex-col items-center gap-1 py-2 text-[9px] data-[state=active]:bg-purple-500/15 data-[state=active]:text-purple-400 text-muted-foreground hover:text-foreground rounded-lg"
                  >
                    <ImageIcon className="h-4 w-4" />
                    <span>Logos</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="layout"
                    className="flex flex-col items-center gap-1 py-2 text-[9px] data-[state=active]:bg-blue-500/15 data-[state=active]:text-blue-400 text-muted-foreground hover:text-foreground rounded-lg"
                  >
                    <Layout className="h-4 w-4" />
                    <span>Layout</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="equipamentos"
                    className="flex flex-col items-center gap-1 py-2 text-[9px] data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-450 text-muted-foreground hover:text-foreground rounded-lg"
                  >
                    <Wrench className="h-4 w-4" />
                    <span>Equip.</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="feriados"
                    className="flex flex-col items-center gap-1 py-2 text-[9px] data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-450 text-muted-foreground hover:text-foreground rounded-lg"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Feriados</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="visitas"
                    className="flex flex-col items-center gap-1 py-2 text-[9px] data-[state=active]:bg-violet-500/15 data-[state=active]:text-violet-400 text-muted-foreground hover:text-foreground rounded-lg"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Visitas</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="valor-km"
                    className="flex flex-col items-center gap-1 py-2 text-[9px] data-[state=active]:bg-red-500/15 data-[state=active]:text-red-400 text-muted-foreground hover:text-foreground rounded-lg"
                  >
                    <Car className="h-4 w-4" />
                    <span>KM</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="termos"
                    className="flex flex-col items-center gap-1 py-2 text-[9px] data-[state=active]:bg-teal-500/15 data-[state=active]:text-teal-400 text-muted-foreground hover:text-foreground rounded-lg"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Termos</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="backup"
                    className="flex flex-col items-center gap-1 py-2 text-[9px] data-[state=active]:bg-orange-500/15 data-[state=active]:text-orange-400 text-muted-foreground hover:text-foreground rounded-lg"
                  >
                    <Database className="h-4 w-4" />
                    <span>Backup</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="asaas"
                    className="flex flex-col items-center gap-1 py-2 text-[9px] data-[state=active]:bg-cyan-500/15 data-[state=active]:text-cyan-400 text-muted-foreground hover:text-foreground rounded-lg"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Asaas</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="nfse"
                    className="flex flex-col items-center gap-1 py-2 text-[9px] data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 text-muted-foreground hover:text-foreground rounded-lg"
                  >
                    <FileCheck className="h-4 w-4" />
                    <span>NFS-e</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="nfe"
                    className="flex flex-col items-center gap-1 py-2 text-[9px] data-[state=active]:bg-blue-500/15 data-[state=active]:text-blue-400 text-muted-foreground hover:text-foreground rounded-lg"
                  >
                    <Package className="h-4 w-4" />
                    <span>NF-e</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6 text-foreground bg-card">
                <TabsContent value="logos" className="mt-0">
                  <LogosTab />
                </TabsContent>

                <TabsContent value="layout" className="mt-0">
                  <LayoutTab />
                </TabsContent>

                <TabsContent value="equipamentos" className="mt-0">
                  <EquipamentosTab />
                </TabsContent>

                <TabsContent value="feriados" className="mt-0">
                  <FeriadosTab />
                </TabsContent>

                <TabsContent value="visitas" className="mt-0">
                  <VisitasTab />
                </TabsContent>

                <TabsContent value="valor-km" className="mt-0">
                  <ValorKmTab />
                </TabsContent>

                <TabsContent value="termos" className="mt-0">
                  <TermosTab />
                </TabsContent>

                <TabsContent value="backup" className="mt-0">
                  <BackupTab />
                </TabsContent>

                <TabsContent value="asaas" className="mt-0">
                  <AsaasTab />
                </TabsContent>

                <TabsContent value="nfse" className="mt-0">
                  <NfseTab />
                </TabsContent>

                <TabsContent value="nfe" className="mt-0">
                  <NfeTab />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
