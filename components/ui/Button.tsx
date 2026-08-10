import type { AnchorHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "border-[var(--accent)] bg-[var(--accent)] text-[var(--button-primary-text)] shadow-[0_0_28px_rgba(0,168,192,0.18)] hover:bg-[var(--accent-hover)]",
  secondary:
    "theme-border bg-[var(--surface)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]",
  ghost:
    "border-transparent bg-transparent text-[var(--text-primary)] hover:border-[var(--border)] hover:bg-[var(--surface-secondary)]",
};

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <a
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-md border px-5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </a>
  );
}
