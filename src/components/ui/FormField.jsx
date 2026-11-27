export function FormField({ id, label, hint, error, className = "", children }) {
  return (
    <div className={`grid gap-2 ${className}`}>
      <label htmlFor={id} className="text-sm font-semibold text-civic-slate">{label}</label>
      {children}
      {error ? <p className="text-sm text-civic-rose" role="alert">{error}</p> : null}
      {hint ? <p className="text-sm text-civic-muted">{hint}</p> : null}
    </div>
  );
}

export const controlClassName = "min-h-11 w-full rounded-lg border border-civic-border bg-civic-surface px-3 py-2.5 text-civic-slate placeholder:text-civic-muted focus-visible:border-civic-blue focus-visible:ring-2 focus-visible:ring-civic-blue/20";
