"use client";

import { useState } from "react";
import { SendHorizontal, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Kbd } from "@/components/ui/kbd";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export function ChatComposer({
  disabled,
  streaming,
  onSend,
  onStop,
}: {
  disabled?: boolean;
  streaming?: boolean;
  onSend: (content: string) => void | Promise<void>;
  onStop?: () => void;
}) {
  const [value, setValue] = useState("");

  async function submit() {
    const content = value.trim();
    if (!content || disabled || streaming) return;
    setValue("");
    await onSend(content);
  }

  return (
    <div className="shrink-0 border-t border-border/60 glass p-4">
      <div className="mx-auto max-w-3xl space-y-2.5">
        <div
          className={cn(
            "flex items-end gap-2 rounded-2xl border border-border/70 bg-card/70 p-2 backdrop-blur transition-all duration-300",
            "focus-within:border-primary/40 focus-within:shadow-glow",
          )}
        >
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ask about architecture, files, or flows…"
            disabled={disabled}
            aria-label="Message"
            className="max-h-40 min-h-12 flex-1 resize-none border-0 bg-transparent px-3 py-2.5 text-sm shadow-none focus-visible:ring-0"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submit();
              }
            }}
          />

          {streaming ? (
            <Button
              size="icon-lg"
              variant="secondary"
              onClick={onStop}
              aria-label="Stop generating"
              className="shrink-0"
            >
              <Square className="size-3.5 fill-current" />
            </Button>
          ) : (
            <Button
              size="icon-lg"
              disabled={disabled || !value.trim()}
              onClick={() => void submit()}
              aria-label="Send message"
              className="group shrink-0 transition-shadow enabled:shadow-glow enabled:hover:shadow-floating"
            >
              {disabled ? (
                <Spinner />
              ) : (
                <SendHorizontal className="transition-transform duration-300 group-enabled:group-hover:translate-x-0.5" />
              )}
            </Button>
          )}
        </div>

        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 px-1 font-mono text-[0.68rem] text-muted-foreground">
          <span>
            <Kbd>Enter</Kbd> send
          </span>
          <span className="opacity-40">·</span>
          <span>
            <Kbd>Shift</Kbd>+<Kbd>Enter</Kbd> newline
          </span>
          <span className="ml-auto hidden items-center gap-1.5 sm:flex">
            <span className="size-1 rounded-full bg-primary" />
            Grounded in this repository
          </span>
        </p>
      </div>
    </div>
  );
}
