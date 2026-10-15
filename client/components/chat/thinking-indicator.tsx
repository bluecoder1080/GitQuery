"use client";

import { useEffect, useState } from "react";

import { GitQueryIcon } from "@/components/icons/gitquery-icon";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import {
  Message,
  MessageAvatar,
  MessageContent,
} from "@/components/ui/message";

/** Widths of the placeholder lines, as a percentage of the bubble. */
const PLACEHOLDER_WIDTHS = ["92%", "78%", "54%"];

/**
 * Shown between sending a message and the model's first token.
 *
 * That gap is real work — the question is embedded, a vector search runs, and
 * the model is called — and previously nothing rendered at all, so the UI
 * looked frozen. The elapsed counter is genuine rather than a fake progress
 * label, since the API doesn't expose which phase it's in.
 */
export function ThinkingIndicator() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <Message align="start" className="animate-rise">
      <MessageAvatar>
        <Avatar className="size-8 rounded-[10px] ring-1 ring-border/60">
          <AvatarFallback className="rounded-[10px] bg-transparent p-0">
            <GitQueryIcon className="size-8 rounded-[10px]" />
          </AvatarFallback>
        </Avatar>
      </MessageAvatar>

      <MessageContent>
        <Bubble variant="muted" align="start" className="max-w-full">
          <BubbleContent className="w-full max-w-full border border-border/60 bg-card/70 px-4 py-3 backdrop-blur">
            <div className="flex items-center gap-2.5">
              <span className="flex items-end gap-1" aria-hidden>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="size-1.5 rounded-full bg-primary animate-dot"
                    style={{ animationDelay: `${i * 160}ms` }}
                  />
                ))}
              </span>
              <span className="text-xs text-muted-foreground">
                Thinking
                {seconds >= 2 && (
                  <span className="font-mono"> · {seconds}s</span>
                )}
              </span>
            </div>

            {/* Skeleton of the answer that's about to stream in. */}
            <div className="mt-3 space-y-2" aria-hidden>
              {PLACEHOLDER_WIDTHS.map((width, i) => (
                <div
                  key={i}
                  className="skeleton-line h-2.5"
                  style={{ width, animationDelay: `${i * 120}ms` }}
                />
              ))}
            </div>

            <span className="sr-only" role="status">
              Generating a response
            </span>
          </BubbleContent>
        </Bubble>
      </MessageContent>
    </Message>
  );
}
