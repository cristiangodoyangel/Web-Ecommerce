import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "./utils"; // Asegúrate de que tu archivo 'utils.js' esté correctamente configurado

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 outline-none focus-visible:border-pink-500 focus-visible:ring-pink-200 focus-visible:ring-2",
  {
    variants: {
      variant: {
        default: "bg-pink-500 text-white hover:bg-pink-600",
        destructive: "bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-200 dark:bg-red-700",
        outline: "border border-gray-300 bg-white text-gray-800 hover:bg-gray-100 hover:text-gray-900",
        secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
        ghost: "bg-transparent hover:bg-pink-100 hover:text-pink-500",
        link: "text-pink-500 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md gap-1.5 px-3",
        lg: "h-10 rounded-md px-6",
        icon: "h-9 w-9 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
