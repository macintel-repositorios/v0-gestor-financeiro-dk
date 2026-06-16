"use client"

import React, { useEffect } from "react"

interface PDFViewerProps extends React.IframeHTMLAttributes<HTMLIFrameElement> {
  src: string
  title: string
}

export function PDFViewer({ src, title, className, ...props }: PDFViewerProps) {
  useEffect(() => {
    if (!title) return

    const originalTitle = document.title
    document.title = title

    // For some browsers, we also want to set it on the contentDocument if same-origin.
    // However, since it's a PDF object/embed, it might throw errors or be ignored,
    // so we wrap it in a try-catch.
    try {
      const iframeElement = document.activeElement as HTMLIFrameElement
      if (iframeElement && iframeElement.contentDocument) {
        iframeElement.contentDocument.title = title
      }
    } catch (e) {
      // Ignore cross-origin or PDF document structure errors
    }

    return () => {
      document.title = originalTitle
    }
  }, [title])

  return (
    <iframe
      src={src}
      title={title}
      className={className}
      {...props}
    />
  )
}
