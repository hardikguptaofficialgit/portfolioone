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
        "w-full h-11 px-3 text-sm rounded-lg",
        "bg-transparent",
        "border border-zinc-700/40",
        "text-zinc-200 placeholder:text-zinc-500",
        "transition-colors duration-200",

        // focus: NO border change
        "focus:outline-none focus:bg-zinc-900/30",

        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    />
  );
});

Input.displayName = "Input";

export { Input };