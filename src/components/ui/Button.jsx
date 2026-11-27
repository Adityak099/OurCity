import Link from "next/link";

const styles = {
  primary: "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-civic-blue bg-civic-blue px-4 py-2.5 font-semibold text-white transition-colors hover:border-civic-blue-dark hover:bg-civic-blue-dark focus-visible:ring-2 focus-visible:ring-civic-blue focus-visible:ring-offset-2",
  secondary: "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-civic-border bg-civic-surface px-4 py-2.5 font-semibold text-civic-slate transition-colors hover:border-civic-blue hover:bg-civic-blue-tint focus-visible:ring-2 focus-visible:ring-civic-blue focus-visible:ring-offset-2",
};

export function Button({ children, className = "", variant = "primary", ...props }) {
  return <button className={`${styles[variant] || styles.primary} ${className}`} {...props}>{children}</button>;
}

export function ButtonLink({ children, className = "", href, variant = "primary", ...props }) {
  return <Link href={href} className={`${styles[variant] || styles.primary} ${className}`} {...props}>{children}</Link>;
}
