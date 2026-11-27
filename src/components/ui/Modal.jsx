"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export default function Modal({ title, children, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
    dialogRef.current?.querySelector("button, a, input, select, textarea")?.focus();
    function handleKey(event) {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll("button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])");
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => { window.removeEventListener("keydown", handleKey); previousFocus?.focus?.(); };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[1100] grid place-items-center bg-civic-slate/45 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="modal-title" className="max-h-[90vh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-xl border border-civic-border bg-civic-surface p-6 shadow-xl">
        <header className="mb-4 flex items-center justify-between gap-4"><h2 id="modal-title" className="text-xl font-bold text-civic-slate">{title}</h2><button type="button" aria-label="Close dialog" onClick={onClose} className="grid size-10 place-items-center rounded-lg text-civic-muted hover:bg-civic-bg hover:text-civic-slate focus-visible:ring-2 focus-visible:ring-civic-blue"><X aria-hidden="true" size={20} /></button></header>
        {children}
      </section>
    </div>
  );
}
