"use client"

import React, { useEffect, useRef } from "react"
import { sanitizePdfFileName } from "@/lib/pdf-utils"

interface PDFViewerProps extends React.IframeHTMLAttributes<HTMLIFrameElement> {
  src: string
  title: string
}

export function PDFViewer({ src, title, className, ...props }: PDFViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!title) return

    const originalTitle = document.title
    document.title = title

    const updateIframeTitle = () => {
      try {
        const iframe = iframeRef.current
        if (iframe && iframe.contentDocument) {
          // Force setting the title inside the iframe's document context
          if (iframe.contentDocument.title !== title) {
            iframe.contentDocument.title = title
          }

          // If standard PDFViewerApplication from PDF.js is exposed on the contentWindow
          const win = iframe.contentWindow as any
          if (win && win.PDFViewerApplication) {
            const cleanName = sanitizePdfFileName(title)
            if (typeof win.PDFViewerApplication.setTitleUsingUrl === "function") {
              win.PDFViewerApplication.setTitleUsingUrl(cleanName)
            }
          }
        }
      } catch (e) {
        // Suppress any cross-origin errors or iframe loading state errors
      }
    }

    // Try immediately
    updateIframeTitle()

    // Firefox's PDF.js viewer initializes asynchronously and sets document title on success.
    // We poll for 4 seconds to override any asynchronous title changes from the viewer.
    const intervalId = setInterval(updateIframeTitle, 150)

    // Automatically stop polling after 4 seconds to save resources
    const timeoutId = setTimeout(() => {
      clearInterval(intervalId)
    }, 4000)

    return () => {
      document.title = originalTitle
      clearInterval(intervalId)
      clearTimeout(timeoutId)
    }
  }, [title])

  // Append a filename hash to the blob URL. PDF.js viewer reads the URL fragment
  // (e.g. #filename=...) to determine the default download filename.
  const cleanFilename = sanitizePdfFileName(title)
  const iframeSrc = src ? `${src}#filename=${encodeURIComponent(cleanFilename)}` : src

  return (
    <iframe
      ref={iframeRef}
      src={iframeSrc}
      title={title}
      className={className}
      {...props}
    />
  )
}

