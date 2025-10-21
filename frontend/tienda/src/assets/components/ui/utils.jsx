import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Función para combinar las clases con tailwind-merge y clsx
export function cn(...inputs) {
  return twMerge(clsx(...inputs));
}
