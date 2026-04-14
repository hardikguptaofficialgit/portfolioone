import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      {...props}
      className={cn(
        // base
        "w-full h-11 px-3 text-sm rounded-lg",

        // minimal surface
        "bg-transparent",

        // subtle border
        "border border-zinc-700/40",

        // text + placeholder
        "text-zinc-200 placeholder:text-zinc-500",

        // smooth transitions
        "transition-all duration-200",

        // focus state (clean, no harsh ring)
        "focus:outline-none focus:border-zinc-500 focus:bg-zinc-900/40",

        // disabled
        "disabled:opacity-50 disabled:cursor-not-allowed",

        className
      )}
    />
  );
});

Input.displayName = "Input";

export { Input };