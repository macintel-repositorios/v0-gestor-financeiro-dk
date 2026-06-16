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
 * Dispara o download de uma blob URL com o nome correto, via ancora <a download>.
 * Funciona em qualquer navegador (blob URLs sao same-origin, entao o atributo
 * download e respeitado).
 */
export function downloadPdfUrl(url: string, base: string): void {
  const a = document.createElement("a")
  a.href = url
  a.download = sanitizePdfFileName(base)
  document.body.appendChild(a)
  a.click()
  a.remove()
}

/**
 * Cria a blob URL e dispara o download com o nome correto.
 * Retorna a URL criada (lembre de revogar com URL.revokeObjectURL quando nao precisar mais).
 */
export function downloadPdfBlob(blob: Blob, base: string): string {
  const url = URL.createObjectURL(blob)
  downloadPdfUrl(url, base)
  return url
}
