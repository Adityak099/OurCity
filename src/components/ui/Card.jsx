export function Card({ as: Component = "section", children, className = "" }) {
  return <Component className={`rounded-xl border border-civic-border bg-civic-surface p-6 shadow-xs ${className}`}>{children}</Component>;
}

export function CardHeader({ children, className = "" }) {
  return <header className={`mb-5 ${className}`}>{children}</header>;
}
