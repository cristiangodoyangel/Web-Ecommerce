"use client";

import React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";

import { cn } from "./utils"; // Asegúrate de que tu función cn esté correctamente configurada

function Separator({
  className,
  orientation = "horizontal", // Orientación por defecto
  decorative = true,          // Si debe ser decorativo
  ...props
}) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator-root"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "bg-gray-200 shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className
      )}
      {...props}  // Propiedades adicionales
    />
  );
}

export { Separator };
