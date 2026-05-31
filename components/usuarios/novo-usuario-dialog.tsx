"use client"

import type React from "react"

import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { PermissoesSelector } from "./permissoes-selector"
import { UserPlus, Loader2 } from "lucide-react"

interface NovoUsuarioDialogProps {
  onUsuarioCriado: () => void
}

export function NovoUsuarioDialog({ onUsuarioCriado }: NovoUsuarioDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    cpf: "",
    telefone: "",
    tipo: "usuario" as "admin" | "usuario" | "tecnico" | "vendedor",
    senha: "",
    ativo: true,
    permissoes: [] as string[],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log("Enviando dados de criação:", formData)

      const response = await fetch("/api/usuarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          ativo: formData.ativo ? 1 : 0,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Usuário criado com sucesso!",
        })
        setOpen(false)
        setFormData({
          nome: "",
          email: "",
          cpf: "",
          telefone: "",
          tipo: "usuario",
          senha: "",
          ativo: true,
          permissoes: [],
        })
        onUsuarioCriado()
      } else {
        toast({
          title: "Erro",
          description: data.message || "Erro ao criar usuário",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao criar usuário:", error)
      toast({
        title: "Erro",
        description: "Erro ao criar usuário",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePermissoesChange = (novasPermissoes: string[]) => {
    console.log("Permissões mudaram:", novasPermissoes)
    setFormData((prev) => ({
      ...prev,
      permissoes: novasPermissoes,
    }))
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
          <UserPlus className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-2xl h-full flex flex-col p-6 overflow-y-auto border-l border-border shadow-2xl bg-card text-foreground">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-foreground text-2xl font-bold flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-purple-400" />
            Criar Novo Usuário
          </SheetTitle>
          <SheetDescription className="text-muted-foreground">
            Preencha os dados do novo usuário para liberar o acesso ao sistema
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-foreground font-medium">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                  className="bg-background border-border text-foreground focus:border-purple-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="bg-background border-border text-foreground focus:border-purple-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf" className="text-foreground font-medium">CPF</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                  className="bg-background border-border text-foreground focus:border-purple-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone" className="text-foreground font-medium">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  className="bg-background border-border text-foreground focus:border-purple-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo" className="text-foreground font-medium">Tipo de Usuário *</Label>
                <Select value={formData.tipo} onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}>
                  <SelectTrigger className="bg-background border-border text-foreground focus:border-purple-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="tecnico">Técnico</SelectItem>
                    <SelectItem value="vendedor">Vendedor</SelectItem>
                    <SelectItem value="usuario">Usuário</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha" className="text-foreground font-medium">Senha *</Label>
                <Input
                  id="senha"
                  type="password"
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  required
                  className="bg-background border-border text-foreground focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-muted/20 p-3 rounded-lg border border-border/40">
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
              />
              <Label htmlFor="ativo" className="text-foreground font-medium cursor-pointer">Usuário Ativo</Label>
            </div>

            <PermissoesSelector
              permissoesSelecionadas={formData.permissoes}
              onChange={handlePermissoesChange}
              tipo={formData.tipo}
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-border mt-auto">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading} className="border-border text-foreground hover:bg-muted/40">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Usuário
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
