'use client';

import React from "react";
import { toast as sonnerToast, type ExternalToast } from "sonner";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastAnimation = "bounce" | "slide" | "zoom" | "wiggle" | "flip" | "none";
export type EmojiAnimation = "bounce" | "wiggle" | "spin" | "pulse" | "heartbeat" | "none";
export type ToastVariant = "default" | "primary" | "success" | "warning" | "destructive" | "amber" | "purple";

export interface EmojiBadgeProps {
  emoji: string;
  animation?: EmojiAnimation;
  variant?: ToastVariant;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const variantBadgeStyles: Record<ToastVariant, string> = {
  default: "bg-muted/60 text-foreground border-border/60",
  primary: "bg-rprimary/15 text-rprimary border-rprimary/30 shadow-sm shadow-rprimary/10",
  success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-sm shadow-emerald-500/10",
  warning: "bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-sm shadow-amber-500/10",
  destructive: "bg-red-500/15 text-red-400 border-red-500/30 shadow-sm shadow-red-500/10",
  amber: "bg-ramber/15 text-ramber border-ramber/30 shadow-sm shadow-ramber/10",
  purple: "bg-purple-500/15 text-purple-400 border-purple-500/30 shadow-sm shadow-purple-500/10",
};

const emojiAnimationClasses: Record<EmojiAnimation, string> = {
  bounce: "animate-emoji-bounce",
  wiggle: "animate-emoji-wiggle",
  spin: "animate-emoji-spin",
  pulse: "animate-emoji-pulse",
  heartbeat: "animate-emoji-heartbeat",
  none: "",
};

const toastAnimationClasses: Record<ToastAnimation, string> = {
  bounce: "animate-toast-bounce",
  slide: "animate-toast-slide-up",
  zoom: "animate-toast-zoom",
  wiggle: "animate-toast-wiggle",
  flip: "animate-toast-flip",
  none: "",
};

export function EmojiBadge({
  emoji,
  animation = "bounce",
  variant = "default",
  className,
  size = "md",
}: EmojiBadgeProps) {
  const sizeClasses = {
    sm: "w-7 h-7 text-sm rounded-lg",
    md: "w-9 h-9 text-lg rounded-xl",
    lg: "w-11 h-11 text-xl rounded-2xl",
  }[size];

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center border font-normal select-none backdrop-blur-sm",
        sizeClasses,
        variantBadgeStyles[variant],
        className
      )}
    >
      <span className={cn("inline-block transform-gpu transition-transform", emojiAnimationClasses[animation])}>
        {emoji}
      </span>
    </div>
  );
}

export interface CustomToastProps {
  id: string | number;
  title: React.ReactNode;
  description?: React.ReactNode;
  emoji?: string;
  emojiAnimation?: EmojiAnimation;
  toastAnimation?: ToastAnimation;
  variant?: ToastVariant;
  tag?: string;
  action?: {
    label: React.ReactNode;
    onClick?: (event?: React.MouseEvent<HTMLButtonElement>) => void;
  };
  cancel?: {
    label: React.ReactNode;
    onClick?: (event?: React.MouseEvent<HTMLButtonElement>) => void;
  };
  onDismiss?: () => void;
}

export function CustomToastCard({
  id,
  title,
  description,
  emoji = "✨",
  emojiAnimation = "bounce",
  toastAnimation = "bounce",
  variant = "primary",
  tag,
  action,
  cancel,
  onDismiss,
}: CustomToastProps) {
  const handleDismiss = () => {
    onDismiss?.();
    sonnerToast.dismiss(id);
  };

  const borderVariantGlow: Record<ToastVariant, string> = {
    default: "border-border/80 hover:border-border",
    primary: "border-rprimary/30 shadow-[0_4px_24px_-4px_rgba(48,132,242,0.2)] hover:border-rprimary/50",
    success: "border-emerald-500/30 shadow-[0_4px_24px_-4px_rgba(16,185,129,0.2)] hover:border-emerald-500/50",
    warning: "border-amber-500/30 shadow-[0_4px_24px_-4px_rgba(245,158,11,0.2)] hover:border-amber-500/50",
    destructive: "border-destructive/40 shadow-[0_4px_24px_-4px_rgba(239,68,68,0.2)] hover:border-destructive/60",
    amber: "border-ramber/35 shadow-[0_4px_24px_-4px_rgba(242,168,29,0.2)] hover:border-ramber/55",
    purple: "border-purple-500/35 shadow-[0_4px_24px_-4px_rgba(168,85,247,0.2)] hover:border-purple-500/55",
  };

  return (
    <div
      className={cn(
        "group relative flex w-full max-w-md items-start gap-3.5 rounded-2xl border bg-card/95 p-4 text-foreground backdrop-blur-xl shadow-xl transition-all duration-300",
        borderVariantGlow[variant],
        toastAnimationClasses[toastAnimation]
      )}
    >
      <EmojiBadge
        emoji={emoji}
        animation={emojiAnimation}
        variant={variant}
      />

      <div className="flex-1 min-w-0 pr-6">
        {tag && (
          <span className="inline-block px-2 py-0.5 mb-1 text-[10px] font-semibold tracking-wider uppercase rounded-md bg-muted/80 text-muted-foreground">
            {tag}
          </span>
        )}
        <div className="text-sm font-semibold tracking-tight text-foreground">
          {title}
        </div>
        {description && (
          <div className="mt-1 text-xs text-muted-foreground leading-relaxed">
            {description}
          </div>
        )}

        {(action || cancel) && (
          <div className="mt-3 flex items-center gap-2">
            {action && (
              <button
                type="button"
                onClick={(e) => {
                  if (action.onClick) action.onClick(e);
                  sonnerToast.dismiss(id);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-rprimary text-white shadow-sm hover:bg-rprimary/90 active:scale-[0.98] transition-all cursor-pointer"
              >
                {action.label}
              </button>
            )}
            {cancel && (
              <button
                type="button"
                onClick={(e) => {
                  if (cancel.onClick) cancel.onClick(e);
                  sonnerToast.dismiss(id);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all cursor-pointer"
              >
                {cancel.label}
              </button>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        className="absolute top-3.5 right-3.5 p-1 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export interface ToastOptions extends ExternalToast {
  emoji?: string;
  emojiAnimation?: EmojiAnimation;
  toastAnimation?: ToastAnimation;
  variant?: ToastVariant;
  tag?: string;
}

/**
 * Enhanced Toast helper with emoji badges & pop up animations
 */
export const toast = Object.assign(
  (message: React.ReactNode, options?: ToastOptions) => {
    const emoji = options?.emoji || "✨";
    const emojiAnimation = options?.emojiAnimation || "bounce";
    const toastAnimation = options?.toastAnimation || "bounce";
    const variant = options?.variant || "default";

    const actionObj =
      options?.action && typeof options.action === "object" && "label" in options.action
        ? {
            label: (options.action as { label: React.ReactNode }).label,
            onClick: (options.action as { onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void }).onClick,
          }
        : undefined;

    const cancelObj =
      options?.cancel && typeof options.cancel === "object" && "label" in options.cancel
        ? {
            label: (options.cancel as { label: React.ReactNode }).label,
            onClick: (options.cancel as { onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void }).onClick,
          }
        : undefined;

    return sonnerToast.custom(
      (id) => (
        <CustomToastCard
          id={id}
          title={message}
          description={options?.description as React.ReactNode}
          emoji={emoji}
          emojiAnimation={emojiAnimation}
          toastAnimation={toastAnimation}
          variant={variant}
          tag={options?.tag}
          action={actionObj}
          cancel={cancelObj}
          onDismiss={options?.onDismiss ? () => options.onDismiss?.({ id } as Parameters<NonNullable<ExternalToast["onDismiss"]>>[0]) : undefined}
        />
      ),
      options
    );
  },
  {
    ...sonnerToast,

    /**
     * Custom Emoji Toast
     */
    emoji: (emoji: string, title: React.ReactNode, options?: ToastOptions) => {
      return toast(title, {
        emoji,
        emojiAnimation: options?.emojiAnimation || "bounce",
        toastAnimation: options?.toastAnimation || "bounce",
        variant: options?.variant || "primary",
        ...options,
      });
    },

    /**
     * Success Toast with Celebratory Emojis & Bounce
     */
    success: (title: React.ReactNode, options?: ToastOptions) => {
      const emoji = options?.emoji || "🎉";
      return toast(title, {
        emoji,
        emojiAnimation: options?.emojiAnimation || "bounce",
        toastAnimation: options?.toastAnimation || "bounce",
        variant: "success",
        ...options,
      });
    },

    /**
     * Error Toast with Alert Emojis & Wiggle
     */
    error: (title: React.ReactNode, options?: ToastOptions) => {
      const emoji = options?.emoji || "🚨";
      return toast(title, {
        emoji,
        emojiAnimation: options?.emojiAnimation || "wiggle",
        toastAnimation: options?.toastAnimation || "wiggle",
        variant: "destructive",
        ...options,
      });
    },

    /**
     * Warning Toast with Caution Emojis & Wiggle
     */
    warning: (title: React.ReactNode, options?: ToastOptions) => {
      const emoji = options?.emoji || "⚠️";
      return toast(title, {
        emoji,
        emojiAnimation: options?.emojiAnimation || "wiggle",
        toastAnimation: options?.toastAnimation || "zoom",
        variant: "warning",
        ...options,
      });
    },

    /**
     * Info Toast with Lightbulb Emojis & Slide
     */
    info: (title: React.ReactNode, options?: ToastOptions) => {
      const emoji = options?.emoji || "💡";
      return toast(title, {
        emoji,
        emojiAnimation: options?.emojiAnimation || "pulse",
        toastAnimation: options?.toastAnimation || "slide",
        variant: "primary",
        ...options,
      });
    },

    /**
     * Loading Toast with Spinning Emojis
     */
    loading: (title: React.ReactNode, options?: ToastOptions) => {
      const emoji = options?.emoji || "⏳";
      return toast(title, {
        emoji,
        emojiAnimation: options?.emojiAnimation || "spin",
        toastAnimation: options?.toastAnimation || "zoom",
        variant: "default",
        ...options,
      });
    },

    /**
     * Diary Entry Saved Toast
     */
    diary: (title: React.ReactNode = "Diary entry saved!", options?: ToastOptions) => {
      return toast(title, {
        emoji: options?.emoji || "📖",
        emojiAnimation: options?.emojiAnimation || "bounce",
        toastAnimation: options?.toastAnimation || "bounce",
        variant: "primary",
        tag: options?.tag || "Diary",
        ...options,
      });
    },

    /**
     * Voice Recording Toast
     */
    voice: (title: React.ReactNode = "Voice note transcribed!", options?: ToastOptions) => {
      return toast(title, {
        emoji: options?.emoji || "🎙️",
        emojiAnimation: options?.emojiAnimation || "pulse",
        toastAnimation: options?.toastAnimation || "slide",
        variant: "purple",
        tag: options?.tag || "Voice",
        ...options,
      });
    },

    /**
     * Celebration / Milestone Toast
     */
    celebrate: (title: React.ReactNode, options?: ToastOptions) => {
      return toast(title, {
        emoji: options?.emoji || "🥳",
        emojiAnimation: options?.emojiAnimation || "bounce",
        toastAnimation: options?.toastAnimation || "bounce",
        variant: "amber",
        ...options,
      });
    },

    /**
     * Daily Streak Toast
     */
    streak: (days: number, options?: ToastOptions) => {
      return toast(`${days}-Day Writing Streak!`, {
        description: "Keep up the momentum. Every day is a page in your story.",
        emoji: "🔥",
        emojiAnimation: "heartbeat",
        toastAnimation: "bounce",
        variant: "amber",
        tag: "Streak",
        ...options,
      });
    },

    /**
     * Mood Logged Toast
     */
    mood: (moodEmoji: string, moodName: string, options?: ToastOptions) => {
      return toast(`Feeling ${moodName}`, {
        description: "Your mood has been logged for today's entry.",
        emoji: moodEmoji,
        emojiAnimation: "pulse",
        toastAnimation: "zoom",
        variant: "purple",
        tag: "Mood",
        ...options,
      });
    },
  }
);
