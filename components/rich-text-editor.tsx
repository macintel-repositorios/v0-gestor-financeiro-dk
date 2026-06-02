"use client"

import type React from "react"

import { useCallback, useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  LinkIcon,
  ImageIcon,
  Type,
  Palette,
  Quote,
  Code,
  Indent,
  Outdent,
  Undo,
  Redo,
  RemoveFormatting,
  Subscript,
  Superscript,
  PlusCircle,
  Settings,
} from "lucide-react"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const fontSizes = [
  { label: "8px", value: "1" },
  { label: "10px", value: "2" },
  { label: "12px", value: "3" },
  { label: "14px", value: "4" },
  { label: "18px", value: "5" },
  { label: "24px", value: "6" },
  { label: "36px", value: "7" },
]

const fontFamilies = [
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Times", value: "Times New Roman, serif" },
  { label: "Courier", value: "Courier New, monospace" },
  { label: "Helvetica", value: "Helvetica, sans-serif" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Tahoma", value: "Tahoma, sans-serif" },
  { label: "Comic Sans", value: "Comic Sans MS, cursive" },
]

const colors = [
  "#000000",
  "#333333",
  "#666666",
  "#999999",
  "#CCCCCC",
  "#FFFFFF",
  "#FF0000",
  "#FF6600",
  "#FFCC00",
  "#FFFF00",
  "#CCFF00",
  "#66FF00",
  "#00FF00",
  "#00FF66",
  "#00FFCC",
  "#00FFFF",
  "#00CCFF",
  "#0066FF",
  "#0000FF",
  "#6600FF",
  "#CC00FF",
  "#FF00FF",
  "#FF00CC",
  "#FF0066",
  "#800000",
  "#804000",
  "#808000",
  "#408000",
  "#008000",
  "#008040",
  "#008080",
  "#004080",
  "#000080",
  "#400080",
  "#800080",
  "#800040",
]

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [linkDialog, setLinkDialog] = useState(false)
  const [imageDialog, setImageDialog] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [linkText, setLinkText] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageAlt, setImageAlt] = useState("")
  const [imageWidth, setImageWidth] = useState([300])
  const [imageHeight, setImageHeight] = useState([200])
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null)
  const [imageSettingsOpen, setImageSettingsOpen] = useState(false)
  const [showPlaceholder, setShowPlaceholder] = useState(false)
  const isUpdatingRef = useRef(false)

  const execCommand = useCallback(
    (command: string, commandValue?: string) => {
      document.execCommand(command, false, commandValue)
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML)
      }
    },
    [onChange],
  )

  const handleInput = useCallback(() => {
    if (editorRef.current && !isUpdatingRef.current) {
      const html = editorRef.current.innerHTML
      onChange(html)

      // Verificar se deve mostrar placeholder
      const isEmpty = !editorRef.current.textContent?.trim() && !html.includes("<img")
      setShowPlaceholder(isEmpty)
    }
  }, [onChange])

  const handleFocus = () => {
    setShowPlaceholder(false)
  }

  const handleBlur = () => {
    if (editorRef.current) {
      const isEmpty = !editorRef.current.textContent?.trim() && !editorRef.current.innerHTML.includes("<img")
      setShowPlaceholder(isEmpty)
    }
  }

  const insertLink = () => {
    if (linkUrl && linkText) {
      const link = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkText}</a>`
      execCommand("insertHTML", link)
      setLinkUrl("")
      setLinkText("")
      setLinkDialog(false)
    }
  }

  const insertImage = () => {
    if (imageFile) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        const img = `<img src="${result}" alt="${imageAlt}" width="${imageWidth[0]}" height="${imageHeight[0]}" style="max-width: 100%; height: auto;" />`
        execCommand("insertHTML", img)
      }
      reader.readAsDataURL(imageFile)
    } else if (imageUrl) {
      const img = `<img src="${imageUrl}" alt="${imageAlt}" width="${imageWidth[0]}" height="${imageHeight[0]}" style="max-width: 100%; height: auto;" />`
      execCommand("insertHTML", img)
    }

    setImageUrl("")
    setImageFile(null)
    setImageAlt("")
    setImageWidth([300])
    setImageHeight([200])
    setImageDialog(false)
  }

  const handleImageClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.tagName === "IMG") {
      setSelectedImage(target as HTMLImageElement)
    } else {
      setSelectedImage(null)
    }
  }

  const updateSelectedImage = () => {
    if (selectedImage) {
      selectedImage.width = imageWidth[0]
      selectedImage.height = imageHeight[0]
      selectedImage.alt = imageAlt
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML)
      }
      setImageSettingsOpen(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
    }
  }

  // Sincronizar o conteúdo apenas quando o valor vem de fora (não da digitação)
  useEffect(() => {
    if (editorRef.current && !isUpdatingRef.current) {
      const currentHtml = editorRef.current.innerHTML

      // Só atualiza se o valor for diferente do atual
      if (currentHtml !== value) {
        isUpdatingRef.current = true
        editorRef.current.innerHTML = value

        // Verificar placeholder
        const isEmpty = !value.trim() && !value.includes("<img")
        setShowPlaceholder(isEmpty)

        isUpdatingRef.current = false
      }
    }
  }, [value])

  // Verificar placeholder inicial
  useEffect(() => {
    if (editorRef.current) {
      const isEmpty = !value.trim() && !value.includes("<img")
      setShowPlaceholder(isEmpty)
    }
  }, [])

  return (
    <div className="border border-border rounded-lg bg-background text-foreground overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-border p-2 flex flex-wrap gap-1 bg-muted/40">
        {/* Undo/Redo */}
        <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("undo")} title="Desfazer" className="hover:bg-muted text-foreground">
          <Undo className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("redo")} title="Refazer" className="hover:bg-muted text-foreground">
          <Redo className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 bg-border" />

        {/* Font Family */}
        <select
          className="px-2 py-1 text-sm border border-border rounded bg-background text-foreground focus:outline-none"
          onChange={(e) => execCommand("fontName", e.target.value)}
          title="Fonte"
        >
          <option value="" className="bg-background text-foreground">Fonte</option>
          {fontFamilies.map((font) => (
            <option key={font.value} value={font.value} className="bg-background text-foreground">
              {font.label}
            </option>
          ))}
        </select>

        {/* Font Size */}
        <select
          className="px-2 py-1 text-sm border border-border rounded bg-background text-foreground focus:outline-none"
          onChange={(e) => execCommand("fontSize", e.target.value)}
          title="Tamanho"
        >
          <option value="" className="bg-background text-foreground">Tamanho</option>
          {fontSizes.map((size) => (
            <option key={size.value} value={size.value} className="bg-background text-foreground">
              {size.label}
            </option>
          ))}
        </select>

        <Separator orientation="vertical" className="h-6 bg-border" />

        {/* Text Formatting */}
        <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("bold")} title="Negrito" className="hover:bg-muted text-foreground">
          <Bold className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("italic")} title="Itálico" className="hover:bg-muted text-foreground">
          <Italic className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("underline")} title="Sublinhado" className="hover:bg-muted text-foreground">
          <Underline className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("strikeThrough")} title="Riscado" className="hover:bg-muted text-foreground">
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("subscript")} title="Subscrito" className="hover:bg-muted text-foreground">
          <Subscript className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("superscript")} title="Sobrescrito" className="hover:bg-muted text-foreground">
          <Superscript className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 bg-border" />

        {/* Text Color */}
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" title="Cor do texto" className="hover:bg-muted text-foreground">
              <Type className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 bg-popover border-border">
            <div className="grid grid-cols-6 gap-1">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className="w-8 h-8 rounded border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => execCommand("foreColor", color)}
                  title={color}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Background Color */}
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" title="Cor de fundo" className="hover:bg-muted text-foreground">
              <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 bg-popover border-border">
            <div className="grid grid-cols-6 gap-1">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className="w-8 h-8 rounded border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => execCommand("backColor", color)}
                  title={color}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand("removeFormat")}
          title="Remover formatação"
          className="hover:bg-muted text-foreground"
        >
          <RemoveFormatting className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 bg-border" />

        {/* Alignment */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand("justifyLeft")}
          title="Alinhar à esquerda"
          className="hover:bg-muted text-foreground"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand("justifyCenter")}
          title="Centralizar"
          className="hover:bg-muted text-foreground"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand("justifyRight")}
          title="Alinhar à direita"
          className="hover:bg-muted text-foreground"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("justifyFull")} title="Justificar" className="hover:bg-muted text-foreground">
          <AlignJustify className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 bg-border" />

        {/* Lists and Paragraphs */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand("insertUnorderedList")}
          title="Lista com marcadores"
          className="hover:bg-muted text-foreground"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand("insertOrderedList")}
          title="Lista numerada"
          className="hover:bg-muted text-foreground"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("indent")} title="Aumentar recuo" className="hover:bg-muted text-foreground">
          <Indent className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("outdent")} title="Diminuir recuo" className="hover:bg-muted text-foreground">
          <Outdent className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 bg-border" />

        {/* Paragraph Formatting */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand("insertParagraph")}
          title="Novo parágrafo"
          className="hover:bg-muted text-foreground"
        >
          <PlusCircle className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand("formatBlock", "blockquote")}
          title="Citação"
          className="hover:bg-muted text-foreground"
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand("formatBlock", "pre")}
          title="Código"
          className="hover:bg-muted text-foreground"
        >
          <Code className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 bg-border" />

        {/* Link */}
        <Dialog open={linkDialog} onOpenChange={setLinkDialog}>
          <DialogTrigger asChild>
            <Button type="button" variant="ghost" size="sm" title="Inserir link" className="hover:bg-muted text-foreground">
              <LinkIcon className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-popover border-border text-foreground">
            <DialogHeader>
              <DialogTitle>Inserir Link</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="linkText">Texto do link</Label>
                <Input
                  id="linkText"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Digite o texto que aparecerá"
                  className="bg-background text-foreground border-border"
                />
              </div>
              <div>
                <Label htmlFor="linkUrl">URL</Label>
                <Input
                  id="linkUrl"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://exemplo.com"
                  className="bg-background text-foreground border-border"
                />
              </div>
              <Button onClick={insertLink} disabled={!linkUrl || !linkText} className="bg-primary text-primary-foreground">
                Inserir Link
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Image */}
        <Dialog open={imageDialog} onOpenChange={setImageDialog}>
          <DialogTrigger asChild>
            <Button type="button" variant="ghost" size="sm" title="Inserir imagem" className="hover:bg-muted text-foreground">
              <ImageIcon className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-popover border-border text-foreground">
            <DialogHeader>
              <DialogTitle>Inserir Imagem</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="url" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted">
                <TabsTrigger value="url">Por URL</TabsTrigger>
                <TabsTrigger value="upload">Upload</TabsTrigger>
              </TabsList>
              <TabsContent value="url" className="space-y-4">
                <div>
                  <Label htmlFor="imageUrl">URL da imagem</Label>
                  <Input
                    id="imageUrl"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://exemplo.com/imagem.jpg"
                    className="bg-background text-foreground border-border"
                  />
                </div>
              </TabsContent>
              <TabsContent value="upload" className="space-y-4">
                <div>
                  <Label htmlFor="imageFile">Selecionar arquivo</Label>
                  <Input id="imageFile" type="file" accept="image/*" onChange={handleFileChange} className="bg-background text-foreground border-border" />
                </div>
              </TabsContent>
            </Tabs>
            <div className="space-y-4">
              <div>
                <Label htmlFor="imageAlt">Texto alternativo</Label>
                <Input
                  id="imageAlt"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="Descrição da imagem"
                  className="bg-background text-foreground border-border"
                />
              </div>
              <div>
                <Label>Largura: {imageWidth[0]}px</Label>
                <Slider value={imageWidth} onValueChange={setImageWidth} max={800} min={50} step={10} />
              </div>
              <div>
                <Label>Altura: {imageHeight[0]}px</Label>
                <Slider value={imageHeight} onValueChange={setImageHeight} max={600} min={50} step={10} />
              </div>
              <Button onClick={insertImage} disabled={!imageUrl && !imageFile} className="bg-primary text-primary-foreground">
                Inserir Imagem
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Image Settings for Selected Image */}
        {selectedImage && (
          <Popover open={imageSettingsOpen} onOpenChange={setImageSettingsOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" size="sm" title="Configurar imagem selecionada" className="hover:bg-muted text-foreground">
                <Settings className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-popover border-border text-foreground">
              <div className="space-y-4">
                <h4 className="font-medium">Configurar Imagem</h4>
                <div>
                  <Label>Largura: {imageWidth[0]}px</Label>
                  <Slider value={imageWidth} onValueChange={setImageWidth} max={800} min={50} step={10} />
                </div>
                <div>
                  <Label>Altura: {imageHeight[0]}px</Label>
                  <Slider value={imageHeight} onValueChange={setImageHeight} max={600} min={50} step={10} />
                </div>
                <div>
                  <Label htmlFor="selectedImageAlt">Texto alternativo</Label>
                  <Input
                    id="selectedImageAlt"
                    value={imageAlt}
                    onChange={(e) => setImageAlt(e.target.value)}
                    placeholder="Descrição da imagem"
                    className="bg-background text-foreground border-border"
                  />
                </div>
                <Button onClick={updateSelectedImage} className="bg-primary text-primary-foreground">Aplicar Alterações</Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Editor */}
      <div className="relative bg-background">
        <div
          ref={editorRef}
          contentEditable
          className="min-h-[300px] p-4 focus:outline-none prose prose-invert max-w-none text-foreground bg-background"
          onInput={handleInput}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onClick={handleImageClick}
          suppressContentEditableWarning
        />
        {showPlaceholder && placeholder && (
          <div className="absolute top-4 left-4 text-muted-foreground pointer-events-none select-none">{placeholder}</div>
        )}
      </div>
    </div>
  )
}
