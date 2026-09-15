import React, { MouseEvent, ButtonHTMLAttributes } from "react";
import { useRipple } from "../hooks/useRipple";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  lightRipple?: boolean;
  icon?: React.ReactNode;
}

const variantClasses = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800",
  secondary: "bg-slate-700 text-white hover:bg-slate-800",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "text-slate-700 hover:bg-slate-100",
  outline: "border border-slate-300 text-slate-700 hover:bg-slate-50",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-5 py-2.5 text-sm gap-2",
};

export default function RippleButton({
  variant = "primary",
  size = "md",
  lightRipple,
  icon,
  children,
  className = "",
  onClick,
  ...rest
}: Props) {
  const addRipple = useRipple(lightRipple ?? (variant === "primary" || variant === "secondary" || variant === "danger"));

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    addRipple(e);
    onClick?.(e);
  };

  return (
    <button
      {...rest}
      onClick={handleClick}
      className={`ripple-wrapper inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-150 select-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
