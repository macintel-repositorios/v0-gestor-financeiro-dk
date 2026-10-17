"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

/**
 * "Tem equipamentos em consignação?" — ao marcar, mostra a lista dos equipamentos
 * e o prazo para instalação. Desmarcar limpa os dois campos (o contrato deixa de ter consignação).
 */
export function BlocoConsignacao({
  temConsignacao,
  onTemConsignacao,
  equipamentos,
  onEquipamentos,
  prazoInstalacao,
  onPrazoInstalacao,
  dataInicio,
}: {
  temConsignacao: boolean
  onTemConsignacao: (v: boolean) => void
  equipamentos: string
  onEquipamentos: (v: string) => void
  prazoInstalacao: string
  onPrazoInstalacao: (v: string) => void
  /** Usado para não permitir prazo de instalação anterior ao início do contrato */
  dataInicio?: string
}) {
  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <Checkbox
          checked={temConsignacao}
          onCheckedChange={(v) => {
            const marcado = !!v
            onTemConsignacao(marcado)
            if (!marcado) {
              onEquipamentos("")
              onPrazoInstalacao("")
            }
          }}
        />
        <span className="text-sm font-medium">Tem equipamentos em consignação?</span>
      </label>

      {temConsignacao && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="md:col-span-2">
            <Label htmlFor="equipamentos_consignacao">Equipamentos em Consignação *</Label>
            <Textarea
              id="equipamentos_consignacao"
              value={equipamentos}
              onChange={(e) => onEquipamentos(e.target.value)}
              placeholder="Um equipamento por linha (ex.: 2x Interfone, 1x Controle Remoto Universal)"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="prazo_instalacao_consignacao">Prazo para instalação *</Label>
            <Input
              id="prazo_instalacao_consignacao"
              type="date"
              value={prazoInstalacao}
              min={dataInicio || undefined}
              onChange={(e) => onPrazoInstalacao(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">Data limite para a CONTRATADA instalar os equipamentos.</p>
          </div>
        </div>
      )}
    </div>
  )
}
