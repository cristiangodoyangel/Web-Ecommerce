import React from "react";
import { cn } from "./utils"; // Asegúrate de que 'utils.js' esté correctamente configurado

function Input({ className, type, ...props }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full min-w-0 rounded-md border border-gray-300 px-3 py-1 text-base bg-white text-gray-900 placeholder:text-gray-400 transition-colors outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-200 aria-invalid:border-red-500 aria-invalid:ring-red-200",
        className
      )}
      {...props}
    />
  );
}

export { Input };
