"use client";

import { Sparkles, UserRound } from "lucide-react";
import { useEffect, useRef } from "react";

import { ChatMarkdown } from "@/components/chat/chat-markdown";
import { CitationChips } from "@/components/chat/citation-chips";
import { ThinkingIndicator } from "@/components/chat/thinking-indicator";
import { GitQueryIcon } from "@/components/icons/gitquery-icon";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
} from "@/components/ui/message";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChatMessage, Repository } from "@/lib/api";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Where is authentication handled?",
  "Walk me through the indexing pipeline",
  "How are citations produced?",
  "What would I change to add caching?",
];

function AssistantAvatar() {
  return (
    <Avatar className="size-8 rounded-[10px] ring-1 ring-border/60">
      <AvatarFallback className="rounded-[10px] bg-transparent p-0">
        <GitQueryIcon className="size-8 rounded-[10px]" />
      </AvatarFallback>
    </Avatar>
  );
}

export function ChatMessages({
  repo,
  messages,
  streamText,
  isLoading,
  isStreaming,
  onSuggestion,
}: {
  repo: Repository;
  messages: ChatMessage[];
  streamText?: string;
  isLoading?: boolean;
  /** True from send until the reply finishes — drives the thinking state. */
  isStreaming?: boolean;
  onSuggestion?: (value: string) => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, streamText, isStreaming]);

  // Retrieval plus the first token take a moment; without this the thread is
  // blank and looks stuck.
  const thinking = Boolean(isStreaming) && !streamText;
  const empty = messages.length === 0 && !streamText && !thinking;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <div
          className={cn(
            "mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8",
            empty && "min-h-full justify-center",
          )}
        >
          {isLoading ? (
            <div className="flex flex-col gap-5">
              <Skeleton className="h-16 w-2/3 rounded-3xl" />
              <Skeleton className="ml-auto h-12 w-1/2 rounded-3xl" />
              <Skeleton className="h-24 w-3/4 rounded-3xl" />
            </div>
          ) : empty ? (
            <div className="animate-fade-up flex flex-col items-center px-2 py-10 text-center">
              <div className="relative">
                <div
                  aria-hidden
                  className="absolute -inset-3 rounded-3xl bg-primary/15 blur-2xl"
                />
                <GitQueryIcon className="relative size-14 rounded-2xl shadow-floating" />
              </div>

              <h2 className="mt-6 font-heading text-xl font-semibold tracking-tight">
                Ask anything about{" "}
                <span className="text-primary">{repo.name}</span>
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground text-balance">
                Answers are grounded in chunks retrieved from this repository,
                with citations linking back to the source files.
              </p>

              <div className="mt-8 grid w-full max-w-lg gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onSuggestion?.(s)}
                    disabled={!onSuggestion}
                    style={{ animationDelay: `${120 + i * 60}ms` }}
                    className="animate-fade-up group flex items-center gap-2.5 rounded-xl border border-border/70 bg-card/60 px-3.5 py-2.5 text-left text-sm text-muted-foreground backdrop-blur transition-all duration-200 not-disabled:hover:-translate-y-0.5 not-disabled:hover:border-primary/40 not-disabled:hover:text-foreground not-disabled:hover:shadow-raised disabled:opacity-60"
                  >
                    <Sparkles className="size-3.5 shrink-0 text-primary/70 transition-colors group-hover:text-primary" />
                    <span className="truncate">{s}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <MessageGroup>
              {messages.map((message) => {
                const isUser = message.role === "USER";
                return (
                  <Message
                    key={message.id}
                    align={isUser ? "end" : "start"}
                    className="animate-rise"
                  >
                    <MessageAvatar>
                      {isUser ? (
                        <Avatar className="size-8 ring-1 ring-border/60">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            <UserRound className="size-4" />
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <AssistantAvatar />
                      )}
                    </MessageAvatar>
                    <MessageContent>
                      <Bubble
                        variant={isUser ? "default" : "muted"}
                        align={isUser ? "end" : "start"}
                        className={cn(
                          !isUser && "max-w-full",
                          isUser && "shadow-subtle",
                        )}
                      >
                        <BubbleContent
                          className={cn(
                            !isUser &&
                              "w-full max-w-full border border-border/60 bg-card/70 px-4 py-3 backdrop-blur",
                          )}
                        >
                          {isUser ? (
                            <span className="whitespace-pre-wrap">
                              {message.content}
                            </span>
                          ) : (
                            <ChatMarkdown content={message.content} />
                          )}
                        </BubbleContent>
                      </Bubble>
                      {!isUser && message.citations?.length > 0 && (
                        <MessageFooter>
                          <CitationChips
                            repo={repo}
                            citations={message.citations}
                          />
                        </MessageFooter>
                      )}
                    </MessageContent>
                  </Message>
                );
              })}

              {thinking && <ThinkingIndicator />}

              {streamText && (
                <Message align="start" className="animate-rise">
                  <MessageAvatar>
                    <AssistantAvatar />
                  </MessageAvatar>
                  <MessageContent>
                    <Bubble variant="muted" align="start" className="max-w-full">
                      <BubbleContent className="w-full max-w-full border border-border/60 bg-card/70 px-4 py-3 backdrop-blur">
                        <ChatMarkdown content={streamText} isStreaming />
                        <span className="ml-0.5 inline-block h-4 w-1.5 animate-caret rounded-sm bg-primary align-middle" />
                      </BubbleContent>
                    </Bubble>
                  </MessageContent>
                </Message>
              )}
            </MessageGroup>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
