// Utilitarios para padronizar o nome dos arquivos PDF gerados/impressos
// em todos os drawers de impressao (Orcamento, Proposta, Contrato, NF-e, NFS-e, etc.)
//
// Problema que isto resolve:
// - URLs de blob (URL.createObjectURL) NAO carregam nome de arquivo, entao o
//   navegador/PDF.js mostra "document" ou o UUID do blob ("PDF.js.viewer").
// - O atributo `#filename=` e o `new File([blob], nome)` NAO sao respeitados em blob URLs.
//
// Solucao padronizada:
// - sanitizePdfFileName: gera um nome ASCII seguro no padrao "Nome_Numero.pdf".
// - downloadPdfUrl / downloadPdfBlob: baixa via ancora <a download> (nome garantido).
// - Para a aba/visualizador, defina o titulo nos metadados do PDF (pdf.setProperties).

/**
 * Normaliza um nome base para um nome de arquivo PDF seguro.
 * Remove acentos/cedilha e caracteres invalidos, troca espacos por "_"
 * e garante a extensao .pdf.
 * Ex: "Orcamento 1850/A" -> "Orcamento_1850-A.pdf"
 */
export function sanitizePdfFileName(base: string): string {
  const clean = (base || "documento")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos/diacriticos
    .replace(/[\/\\:*?"<>|]/g, "-") // caracteres invalidos em nome de arquivo
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[-_]+|[-_]+$/g, "")
    .trim()
  return (clean || "documento").replace(/\.pdf$/i, "") + ".pdf"
}

/**
 * Auxiliar para disparar o download de um Blob com nome de arquivo limpo,
 * usando uma blob URL temporaria isolada (nao carregada em nenhum iframe)
 * para evitar que o visualizador interno do Firefox/Chrome sobrescreva o nome.
 */
function triggerAnchorDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.style.display = "none"
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  
  // Delay na remocao e revogacao para garantir que o Firefox capture o download
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 250)
}

/**
 * Dispara o download de uma blob URL com o nome correto, via ancora <a download>.
 * Cria uma URL isolada para evitar conflitos com iframes no Firefox.
 */
export async function downloadPdfUrl(url: string, base: string): Promise<void> {
  const filename = sanitizePdfFileName(base)
  try {
    const blob = await fetch(url).then((r) => r.blob())
    triggerAnchorDownload(blob, filename)
  } catch (error) {
    // Fallback caso o fetch falhe (ex: restricoes de CSP ou CORS)
    const a = document.createElement("a")
    a.style.display = "none"
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    setTimeout(() => {
      document.body.removeChild(a)
    }, 250)
  }
}

/**
 * Cria a blob URL e dispara o download com o nome correto.
 * Retorna a URL criada.
 */
export function downloadPdfBlob(blob: Blob, base: string): string {
  const filename = sanitizePdfFileName(base)
  triggerAnchorDownload(blob, filename)
  return URL.createObjectURL(blob)
}

/**
 * Salva o PDF abrindo o dialogo nativo "Salvar como" (o usuario escolhe a pasta),
 * SEM abrir nova aba.
 *
 * Usa a File System Access API (window.showSaveFilePicker), suportada em
 * navegadores Chromium (Chrome, Edge, Opera, Brave). Em navegadores sem suporte
 * (Firefox, Safari) faz fallback para o download via ancora — nesse caso o arquivo
 * vai para a pasta de downloads padrao com o nome correto (para escolher a pasta no
 * Firefox, ative "Sempre perguntar onde salvar os arquivos" nas configuracoes).
 *
 * Deve ser chamada dentro de um gesto do usuario (ex.: onClick).
 */
export async function savePdfUrl(url: string, base: string): Promise<void> {
  const filename = sanitizePdfFileName(base)
  const w = window as any

  if (typeof w.showSaveFilePicker === "function") {
    try {
      const blob = await fetch(url).then((r) => r.blob())
      const handle = await w.showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: "Documento PDF", accept: { "application/pdf": [".pdf"] } }],
      })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return
    } catch (err: any) {
      // Usuario cancelou o dialogo -> nao faz nada (nao baixa para a pasta padrao)
      if (err?.name === "AbortError") return
      // Qualquer outro erro -> cai no fallback abaixo
    }
  }

  // Fallback: download via ancora (nome correto, pasta de downloads padrao)
  await downloadPdfUrl(url, base)
}
