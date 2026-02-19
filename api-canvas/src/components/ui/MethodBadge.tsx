import type { HTTPMethod } from "../../types";

const styles: Record<HTTPMethod, string> = {
  GET: "bg-emerald-900/60 text-emerald-300 border border-emerald-700/50",
  POST: "bg-blue-900/60 text-blue-300 border border-blue-700/50",
  PUT: "bg-amber-900/60 text-amber-300 border border-amber-700/50",
  PATCH: "bg-orange-900/60 text-orange-300 border border-orange-700/50",
  DELETE: "bg-red-900/60 text-red-300 border border-red-700/50",
};

interface MethodBadgeProps {
  method: HTTPMethod | string;
  className?: string;
}

export default function MethodBadge({
  method,
  className = "",
}: MethodBadgeProps) {
  const m = method.toUpperCase() as HTTPMethod;
  const colorClass =
    styles[m] ?? "bg-slate-700 text-slate-300 border border-slate-600";
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-bold rounded font-mono ${colorClass} ${className}`}
    >
      {m}
    </span>
  );
}
