import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Send,
  Plus,
  Trash2,
  Clock,
  ChevronDown,
  Copy,
  Check,
  AlertTriangle,
} from "lucide-react";
import { executeTestRequest } from "../services/api";
import type { HTTPMethod, TestResponse, KeyValuePair } from "../types";
import AppLayout from "../components/layout/AppLayout";
import LoadingSpinner from "../components/ui/LoadingSpinner";

import toast from "react-hot-toast";

const HTTP_METHODS: HTTPMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];
type ReqTab = "params" | "headers" | "body";
type ResTab = "body" | "headers";

function emptyPair(): KeyValuePair {
  return { key: "", value: "", enabled: true };
}

function pairsToRecord(pairs: KeyValuePair[]): Record<string, string> {
  const obj: Record<string, string> = {};
  pairs
    .filter((p) => p.enabled && p.key)
    .forEach((p) => {
      obj[p.key] = p.value;
    });
  return obj;
}

function statusColor(status: number) {
  if (status === 0) return "text-slate-400";
  if (status < 300) return "text-emerald-400";
  if (status < 400) return "text-yellow-400";
  return "text-red-400";
}

export default function TesterPage() {
  const [searchParams] = useSearchParams();

  const [method, setMethod] = useState<HTTPMethod>(
    (searchParams.get("method") as HTTPMethod) ?? "GET",
  );
  const [url, setUrl] = useState(searchParams.get("url") ?? "");
  const [reqTab, setReqTab] = useState<ReqTab>("params");
  const [params, setParams] = useState<KeyValuePair[]>([emptyPair()]);
  const [headers, setHeaders] = useState<KeyValuePair[]>([
    { key: "Content-Type", value: "application/json", enabled: true },
  ]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<TestResponse | null>(null);
  const [resTab, setResTab] = useState<ResTab>("body");
  const [copied, setCopied] = useState(false);
  const [bodyError, setBodyError] = useState("");

  useEffect(() => {
    const m = searchParams.get("method") as HTTPMethod;
    const u = searchParams.get("url");
    if (m) setMethod(m);
    if (u) setUrl(u);
  }, [searchParams]);

  const handleSend = async () => {
    if (!url.trim()) {
      toast.error("Enter a URL");
      return;
    }
    try {
      new URL(url);
    } catch {
      toast.error("Invalid URL format");
      return;
    }

    let parsedBody: unknown = undefined;
    if (["POST", "PUT", "PATCH"].includes(method) && body.trim()) {
      try {
        parsedBody = JSON.parse(body);
        setBodyError("");
      } catch {
        setBodyError("Invalid JSON body");
        toast.error("Invalid JSON in request body");
        return;
      }
    }

    setLoading(true);
    setResponse(null);
    try {
      const res = await executeTestRequest({
        method,
        url,
        headers: pairsToRecord(headers),
        queryParams: pairsToRecord(params),
        body: parsedBody,
      });
      setResponse(res);
      setResTab("body");
    } catch {
      toast.error("Request failed — check your URL and try again");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    const text =
      typeof response?.data === "string"
        ? response.data
        : JSON.stringify(response?.data, null, 2);
    await navigator.clipboard.writeText(text ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const validateBody = (val: string) => {
    setBody(val);
    if (!val.trim()) {
      setBodyError("");
      return;
    }
    try {
      JSON.parse(val);
      setBodyError("");
    } catch {
      setBodyError("Invalid JSON");
    }
  };

  const responseBody = response
    ? typeof response.data === "string"
      ? response.data
      : JSON.stringify(response.data, null, 2)
    : "";

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-4rem)] flex-col md:h-screen overflow-hidden">
        {/* Page Header */}
        <div className="shrink-0 border-b border-slate-700 px-4 py-4">
          <h1 className="text-lg font-semibold text-white">API Tester</h1>
          <p className="text-xs text-slate-500">
            Send HTTP requests and inspect responses
          </p>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
          {/* ── Left Panel: Request ─────────────────────────────────────── */}
          <div className="flex flex-1 flex-col overflow-hidden border-b border-slate-700 lg:border-b-0 lg:border-r">
            {/* URL Bar */}
            <div className="shrink-0 flex gap-2 border-b border-slate-700 px-4 py-3">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as HTTPMethod)}
                className="input w-28 shrink-0 font-mono text-xs font-bold"
                style={{ color: methodColor(method) }}
              >
                {HTTP_METHODS.map((m) => (
                  <option
                    key={m}
                    value={m}
                    className="bg-slate-800 text-slate-100"
                  >
                    {m}
                  </option>
                ))}
              </select>

              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="input flex-1 font-mono text-sm"
                placeholder="https://api.example.com/endpoint"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
              />

              <button
                onClick={handleSend}
                disabled={loading}
                className="btn-primary shrink-0"
              >
                {loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send
              </button>
            </div>

            {/* Tabs */}
            <div className="shrink-0 flex border-b border-slate-700 px-4">
              {(["params", "headers", "body"] as ReqTab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setReqTab(t)}
                  className={`px-3 py-2.5 text-xs font-medium capitalize transition-colors ${
                    reqTab === t
                      ? "border-b-2 border-blue-500 text-blue-400"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {t}
                  {t === "params" &&
                    params.filter((p) => p.enabled && p.key).length > 0 && (
                      <span className="ml-1.5 rounded-full bg-blue-700 px-1.5 py-0.5 text-[10px]">
                        {params.filter((p) => p.enabled && p.key).length}
                      </span>
                    )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {reqTab === "params" && (
                <KVTable
                  pairs={params}
                  onChange={setParams}
                  placeholder="param"
                />
              )}
              {reqTab === "headers" && (
                <KVTable
                  pairs={headers}
                  onChange={setHeaders}
                  placeholder="header"
                />
              )}
              {reqTab === "body" && (
                <div>
                  {!["POST", "PUT", "PATCH"].includes(method) && (
                    <div className="mb-3 flex items-center gap-2 rounded-lg border border-yellow-700/50 bg-yellow-900/20 px-3 py-2 text-xs text-yellow-400">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      Body is typically not used with {method} requests
                    </div>
                  )}
                  <div className="relative">
                    <textarea
                      value={body}
                      onChange={(e) => validateBody(e.target.value)}
                      className={`input font-mono text-xs resize-none ${bodyError ? "border-red-600 focus:ring-red-500" : ""}`}
                      rows={16}
                      placeholder='{\n  "key": "value"\n}'
                      spellCheck={false}
                    />
                    {bodyError && (
                      <p className="mt-1 text-xs text-red-400">{bodyError}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Right Panel: Response ────────────────────────────────────── */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {response ? (
              <>
                {/* Status Bar */}
                <div className="shrink-0 flex items-center gap-4 border-b border-slate-700 px-4 py-3">
                  <span
                    className={`text-sm font-bold ${statusColor(response.status)}`}
                  >
                    {response.status} {response.statusText}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="h-3 w-3" />
                    {response.duration}ms
                  </span>
                  {response.error && (
                    <span className="ml-auto flex items-center gap-1 text-xs text-red-400">
                      <AlertTriangle className="h-3 w-3" />
                      {response.error}
                    </span>
                  )}
                </div>

                {/* Response Tabs */}
                <div className="shrink-0 flex items-center justify-between border-b border-slate-700 px-4">
                  <div className="flex">
                    {(["body", "headers"] as ResTab[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setResTab(t)}
                        className={`px-3 py-2.5 text-xs font-medium capitalize transition-colors ${
                          resTab === t
                            ? "border-b-2 border-blue-500 text-blue-400"
                            : "text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  {resTab === "body" && (
                    <button
                      onClick={handleCopy}
                      className="btn-ghost p-1.5 text-xs"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>

                {/* Response Content */}
                <div className="flex-1 overflow-auto p-4">
                  {resTab === "body" ? (
                    <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap break-words leading-relaxed">
                      {responseBody}
                    </pre>
                  ) : (
                    <div className="space-y-1">
                      {Object.entries(response.headers).map(([k, v]) => (
                        <div
                          key={k}
                          className="flex gap-4 rounded px-2 py-1 hover:bg-slate-800/50"
                        >
                          <span className="w-48 shrink-0 truncate text-xs text-blue-300 font-mono">
                            {k}
                          </span>
                          <span className="text-xs text-slate-300 font-mono break-all">
                            {v}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center text-center p-8">
                {loading ? (
                  <LoadingSpinner size="lg" />
                ) : (
                  <>
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 border border-slate-700">
                      <ChevronDown className="h-6 w-6 text-slate-600 rotate-[-90deg]" />
                    </div>
                    <p className="text-sm text-slate-500">
                      Send a request to see the response
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

// ─── Method color ─────────────────────────────────────────────────────────────

function methodColor(method: string) {
  const map: Record<string, string> = {
    GET: "#6ee7b7",
    POST: "#93c5fd",
    PUT: "#fcd34d",
    PATCH: "#fdba74",
    DELETE: "#fca5a5",
  };
  return map[method.toUpperCase()] ?? "#94a3b8";
}

// ─── KV Table ─────────────────────────────────────────────────────────────────

interface KVTableProps {
  pairs: KeyValuePair[];
  onChange: (pairs: KeyValuePair[]) => void;
  placeholder: string;
}

function KVTable({ pairs, onChange, placeholder }: KVTableProps) {
  const update = (
    i: number,
    field: keyof KeyValuePair,
    val: string | boolean,
  ) => {
    const next = pairs.map((p, idx) =>
      idx === i ? { ...p, [field]: val } : p,
    );
    onChange(next);
  };

  const add = () => onChange([...pairs, emptyPair()]);

  const remove = (i: number) => {
    if (pairs.length === 1) {
      onChange([emptyPair()]);
      return;
    }
    onChange(pairs.filter((_, idx) => idx !== i));
  };

  return (
    <div className="space-y-2">
      {pairs.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={p.enabled}
            onChange={(e) => update(i, "enabled", e.target.checked)}
            className="h-3.5 w-3.5 shrink-0 accent-blue-500"
          />
          <input
            value={p.key}
            onChange={(e) => update(i, "key", e.target.value)}
            className="input flex-1 py-1.5 text-xs font-mono"
            placeholder={`${placeholder} name`}
          />
          <input
            value={p.value}
            onChange={(e) => update(i, "value", e.target.value)}
            className="input flex-1 py-1.5 text-xs font-mono"
            placeholder="value"
          />
          <button
            onClick={() => remove(i)}
            className="shrink-0 text-slate-600 hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        onClick={add}
        className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 mt-2"
      >
        <Plus className="h-3.5 w-3.5" />
        Add {placeholder}
      </button>
    </div>
  );
}
