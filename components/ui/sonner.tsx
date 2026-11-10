"use client"

import React, { useEffect, useState } from "react"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { EmojiBadge, toast } from "@/lib/toast"

const Toaster = ({ ...props }: ToasterProps) => {
  const [theme, setTheme] = useState<ToasterProps["theme"]>(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
      ? "dark"
      : "light",
  )

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const darkActive = document.documentElement.classList.contains("dark")
      setTheme(darkActive ? "dark" : "light")
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  return (
    <Sonner
      theme={theme}
      className="toaster group font-sans"
      position={props.position || "bottom-right"}
      expand={props.expand ?? true}
      richColors={props.richColors ?? true}
      icons={{
        success: (
          <EmojiBadge emoji="✨" animation="bounce" variant="success" size="sm" />
        ),
        info: (
          <EmojiBadge emoji="💡" animation="pulse" variant="primary" size="sm" />
        ),
        warning: (
          <EmojiBadge emoji="⚠️" animation="wiggle" variant="warning" size="sm" />
        ),
        error: (
          <EmojiBadge emoji="🚨" animation="wiggle" variant="destructive" size="sm" />
        ),
        loading: (
          <EmojiBadge emoji="⏳" animation="spin" variant="default" size="sm" />
        ),
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card/95 group-[.toaster]:text-foreground group-[.toaster]:border-border/80 group-[.toaster]:shadow-2xl group-[.toaster]:backdrop-blur-xl group-[.toaster]:rounded-2xl group-[.toaster]:p-4 group-[.toaster]:gap-3.5 group-[.toaster]:transition-all group-[.toaster]:duration-300 hover:group-[.toaster]:border-rprimary/40 animate-toast-bounce",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-xs leading-relaxed mt-0.5",
          title: "group-[.toast]:font-semibold group-[.toast]:text-sm group-[.toast]:tracking-tight",
          actionButton:
            "group-[.toast]:bg-rprimary group-[.toast]:text-white group-[.toast]:font-medium group-[.toast]:rounded-xl group-[.toast]:px-3.5 group-[.toast]:py-1.5 group-[.toast]:text-xs hover:group-[.toast]:bg-rprimary/90 transition-all shadow-sm",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-xl group-[.toast]:px-3.5 group-[.toast]:py-1.5 group-[.toast]:text-xs hover:group-[.toast]:bg-muted/80 transition-all",
          closeButton:
            "group-[.toast]:bg-background/80 group-[.toast]:border group-[.toast]:border-border/60 group-[.toast]:text-muted-foreground hover:group-[.toast]:text-foreground group-[.toast]:rounded-xl group-[.toast]:transition-colors",
          success: "group-[.toaster]:border-emerald-500/30 group-[.toaster]:shadow-emerald-500/10",
          error: "group-[.toaster]:border-destructive/40 group-[.toaster]:shadow-destructive/15",
          warning: "group-[.toaster]:border-amber-500/40 group-[.toaster]:shadow-amber-500/15",
          info: "group-[.toaster]:border-rprimary/40 group-[.toaster]:shadow-rprimary/15",
        },
      }}
      style={
        {
          "--normal-bg": "var(--card)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "1rem",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster, toast }
export * from "@/lib/toast"
