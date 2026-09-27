"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Building2, Loader2, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { boletoEnviado } from "@/lib/boleto-gateway"

type Gateway = "inter" | "asaas"

/**
 * Botões "Enviar Inter" e "Enviar Asaas" para os boletos de uma nota.
 * Envia um boleto por vez e só os que ainda não estão em nenhum gateway (sem duplicidade).
 */
export function EnviarBoletosGatewayButtons({ boletos, onEnviado }: { boletos: any[]; onEnviado?: () => void }) {
  const { toast } = useToast()
  const [enviando, setEnviando] = useState<Gateway | null>(null)

  const pendentes = boletos.filter((b) => !boletoEnviado(b))
  if (pendentes.length === 0) return null

  const enviar = async (gateway: Gateway) => {
    const nome = gateway === "inter" ? "Banco Inter" : "Asaas"
    setEnviando(gateway)
    try {
      let successCount = 0
      let ultimoErro = ""
      for (const b of pendentes) {
        const res = await fetch(`/api/boletos/${b.id}/${gateway === "inter" ? "enviar-inter" : "enviar-asaas"}`, {
          method: "POST",
        })
        const result = await res.json()
        if (result.success) successCount++
        else ultimoErro = result.message || ""
      }
      if (successCount > 0) {
        toast({
          title: `Envio ao ${nome}`,
          description: `${successCount} de ${pendentes.length} boleto(s) enviado(s) ao ${nome} com sucesso!`,
        })
        onEnviado?.()
      } else {
        toast({
          title: "Erro ao enviar",
          description: ultimoErro || `Não foi possível enviar os boletos ao ${nome}`,
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error(err)
      toast({ title: "Erro", description: "Erro ao enviar boletos", variant: "destructive" })
    } finally {
      setEnviando(null)
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        disabled={!!enviando}
        onClick={() => enviar("inter")}
        className="text-orange-400 border-orange-900/50 hover:bg-orange-950/20 bg-background"
      >
        {enviando === "inter" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Building2 className="h-4 w-4 mr-1" />}
        Enviar Inter
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={!!enviando}
        onClick={() => enviar("asaas")}
        className="text-teal-400 border-teal-900/50 hover:bg-teal-950/20 bg-background"
      >
        {enviando === "asaas" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
        Enviar Asaas
      </Button>
    </>
  )
}
