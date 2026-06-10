import Link from "next/link";
import { cn } from "@/lib/utils";
import React from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-red-600 text-white hover:bg-red-700 shadow-sm",
  secondary:
    "bg-black text-white hover:bg-gray-800 shadow-sm",
  outline:
    "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50",
  ghost:
    "text-gray-900 hover:bg-gray-100",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm rounded-lg",
  md: "h-11 px-5 text-sm rounded-xl",
  lg: "h-12 px-6 text-base rounded-xl",
};

type BaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
};

type ButtonProps =
  | (BaseProps &
      React.ButtonHTMLAttributes<HTMLButtonElement> & {
        href?: never;
      })
  | (BaseProps & {
      href: string;
    });

export default function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    className,
    children,
  } = props as BaseProps;

  const classes = cn(
    "inline-flex items-center justify-center font-semibold transition focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:pointer-events-none",
    variants[variant],
    sizes[size],
    className
  );

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button {...props} className={classes}>
      {children}
    </button>
  );
}