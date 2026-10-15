"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Light / dark / system switcher.
 *
 * The trigger renders *as* the Button via the `render` prop rather than
 * wrapping one. `DropdownMenuTrigger` already emits a native <button>, so
 * nesting a Button inside it produced a <button> within a <button> and made
 * React throw a hydration error on every page showing this control.
 */
export function ModeToggle() {
  const { setTheme, theme } = useTheme();

  // false during SSR and the first client render, true afterwards. next-themes
  // resolves the stored theme on the client only, so rendering the active-state
  // indicator before mount would mismatch the server HTML. useSyncExternalStore
  // expresses that without a setState inside an effect.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const items = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ] as const;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Toggle theme"
        render={<Button variant="outline" size="icon-sm" className="relative" />}
      >
        <Sun className="size-[1.05rem] scale-100 rotate-0 transition-all duration-500 dark:scale-0 dark:-rotate-90" />
        <Moon className="absolute size-[1.05rem] scale-0 rotate-90 transition-all duration-500 dark:scale-100 dark:rotate-0" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-40 rounded-xl">
        {items.map((item) => (
          <DropdownMenuItem
            key={item.value}
            onClick={() => setTheme(item.value)}
            className="gap-2.5"
          >
            <item.icon className="size-4 text-muted-foreground" />
            {item.label}
            {mounted && theme === item.value && (
              <span className="ml-auto size-1.5 rounded-full bg-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
