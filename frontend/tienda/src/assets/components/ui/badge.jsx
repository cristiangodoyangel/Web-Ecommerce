import * as React from "react";
import { Slot } from "@radix-ui/react-slot";  // Asegúrate de tener instalada la librería sin la versión en la importación.
import { cva } from "class-variance-authority";

import { cn } from "./utils"; // Asegúrate de tener la función 'cn' disponible en tu proyecto.

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1 pointer-events-none focus-visible:border-pink-500 focus-visible:ring-pink-200 focus-visible:ring-2 transition-colors overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-red-500 text-white hover:bg-pink-600",
        secondary:
          "border-transparent bg-gray-200 text-pink-800 hover:bg-pink-300",
        destructive:
          "border-transparent bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-200 dark:bg-red-700",
        outline:
          "text-gray-800 border-pink-300 hover:bg-pink-100 hover:text-pink-900",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant = 'default',
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "span";
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
