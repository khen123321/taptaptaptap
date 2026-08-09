import type { AnchorHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "border-[#00A8C0] bg-[#00A8C0] text-black shadow-[0_0_28px_rgba(0,168,192,0.22)] hover:bg-[#26c3d8]",
  secondary:
    "border-white/15 bg-white/[0.04] text-white hover:border-[#00A8C0]/70 hover:bg-[#00A8C0]/10",
  ghost:
    "border-transparent bg-transparent text-white hover:border-white/15 hover:bg-white/[0.05]",
};

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <a
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-md border px-5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00A8C0] ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </a>
  );
}
