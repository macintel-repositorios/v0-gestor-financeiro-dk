"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhoneInput } from "@/components/ui/phone-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { PermissoesSelector } from "./permissoes-selector"
import { Loader2, Edit } from "lucide-react"
import type { Usuario } from "@/types/usuario"

interface EditarUsuarioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  usuario: Usuario | null
  onUsuarioAtualizado: () => void
}

export function EditarUsuarioDialog({ open, onOpenChange, usuario, onUsuarioAtualizado }: EditarUsuarioDialogProps) {
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

  useEffect(() => {
    if (usuario) {
      console.log("Carregando usuário:", usuario)
      setFormData({
        nome: usuario.nome || "",
        email: usuario.email || "",
        cpf: usuario.cpf || "",
        telefone: usuario.telefone || "",
        tipo: usuario.tipo || "usuario",
        senha: "",
        ativo: usuario.ativo === true || (usuario.ativo as any) === 1,
        permissoes: usuario.permissoes || [],
      })
    }
  }, [usuario])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!usuario) return

    setLoading(true)

    try {
      console.log("Enviando dados de edição:", formData)

      const response = await fetch(`/api/usuarios/${usuario.id}`, {
        method: "PUT",
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
          description: "Usuário atualizado com sucesso!",
        })
        onOpenChange(false)
        onUsuarioAtualizado()
      } else {
        toast({
          title: "Erro",
          description: data.message || "Erro ao atualizar usuário",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar usuário",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePermissoesChange = (novasPermissoes: string[]) => {
    console.log("Permissões mudaram no edit:", novasPermissoes)
    setFormData((prev) => ({
      ...prev,
      permissoes: novasPermissoes,
    }))
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl h-full flex flex-col p-6 overflow-y-auto border-l border-border shadow-2xl bg-card text-foreground">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-foreground text-2xl font-bold flex items-center gap-2">
            <Edit className="h-6 w-6 text-purple-400" />
            Editar Usuário
          </SheetTitle>
          <SheetDescription className="text-muted-foreground">
            Edite os dados cadastrais e as permissões de acesso do usuário
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nome" className="text-foreground font-medium">Nome *</Label>
                <Input
                  id="edit-nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                  className="bg-background border-border text-foreground focus:border-purple-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email" className="text-foreground font-medium">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="bg-background border-border text-foreground focus:border-purple-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-cpf" className="text-foreground font-medium">CPF</Label>
                <Input
                  id="edit-cpf"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  className="bg-background border-border text-foreground focus:border-purple-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-telefone" className="text-foreground font-medium">Telefone</Label>
                <PhoneInput
                  id="edit-telefone"
                  value={formData.telefone}
                  onChange={(value) => setFormData({ ...formData, telefone: value })}
                  className="bg-background border-border text-foreground focus:border-purple-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-tipo" className="text-foreground font-medium">Tipo de Usuário *</Label>
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
                <Label htmlFor="edit-senha" className="text-foreground font-medium">Nova Senha (deixe em branco para manter)</Label>
                <Input
                  id="edit-senha"
                  type="password"
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  className="bg-background border-border text-foreground focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-muted/20 p-3 rounded-lg border border-border/40">
              <Switch
                id="edit-ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
              />
              <Label htmlFor="edit-ativo" className="text-foreground font-medium cursor-pointer">Usuário Ativo</Label>
            </div>

            <PermissoesSelector
              permissoesSelecionadas={formData.permissoes}
              onChange={handlePermissoesChange}
              tipo={formData.tipo}
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-border mt-auto">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="border-border text-foreground hover:bg-muted/40">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
