import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Play,
  Edit2,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  GripVertical,
} from "lucide-react";
import { getProjectById, updateProject, deleteProject } from "../services/api";
import type { APIProject, APIEndpoint, HTTPMethod } from "../types";
import AppLayout from "../components/layout/AppLayout";
import LoadingSpinner from "../components/ui/LoadingSpinner";

import toast from "react-hot-toast";

const HTTP_METHODS: HTTPMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function newEndpoint(): APIEndpoint {
  return {
    id: generateId(),
    method: "GET",
    url: "",
    headers: {},
    queryParams: {},
    body: null,
    description: "",
  };
}

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<APIProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const p = await getProjectById(id);
      setProject(p);
      setName(p.name);
      setDescription(p.description ?? "");
      setEndpoints(p.endpoints);
    } catch {
      toast.error("Project not found");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const markDirty = () => setDirty(true);

  const addEndpoint = () => {
    const ep = newEndpoint();
    setEndpoints((prev) => [...prev, ep]);
    setExpandedId(ep.id);
    markDirty();
  };

  const removeEndpoint = (epId: string) => {
    setEndpoints((prev) => prev.filter((e) => e.id !== epId));
    markDirty();
  };

  const updateEndpointField = <K extends keyof APIEndpoint>(
    epId: string,
    field: K,
    value: APIEndpoint[K],
  ) => {
    setEndpoints((prev) =>
      prev.map((e) => (e.id === epId ? { ...e, [field]: value } : e)),
    );
    markDirty();
  };

  const save = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await updateProject(id, { name, description, endpoints });
      setDirty(false);
      toast.success("Saved");
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !project) return;
    if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    try {
      await deleteProject(id);
      navigate("/dashboard");
      toast.success("Project deleted");
    } catch {
      toast.error("Failed to delete project");
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-full items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Back */}
        <button
          onClick={() => navigate("/dashboard")}
          className="mb-6 flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          All Projects
        </button>

        {/* Project Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            {editName ? (
              <div className="flex items-center gap-2">
                <input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    markDirty();
                  }}
                  className="input text-lg font-bold"
                  autoFocus
                  onBlur={() => setEditName(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setEditName(false);
                  }}
                />
              </div>
            ) : (
              <div className="group flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white">{name}</h1>
                <button
                  onClick={() => setEditName(true)}
                  className="hidden text-slate-500 hover:text-slate-300 group-hover:block"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>
            )}
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                markDirty();
              }}
              className="mt-2 w-full resize-none bg-transparent text-sm text-slate-400 focus:outline-none focus:text-slate-200"
              rows={2}
              placeholder="Add a description..."
            />
          </div>
          <div className="flex shrink-0 gap-2">
            {dirty && (
              <button onClick={save} disabled={saving} className="btn-primary">
                {saving ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save
              </button>
            )}
            <button onClick={handleDelete} className="btn-danger">
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>

        {/* Endpoints */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Endpoints ({endpoints.length})
          </h2>
          <button onClick={addEndpoint} className="btn-secondary text-xs">
            <Plus className="h-3.5 w-3.5" />
            Add Endpoint
          </button>
        </div>

        {endpoints.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-700 py-12 text-center">
            <AlertCircle className="mb-3 h-8 w-8 text-slate-600" />
            <p className="text-sm text-slate-400">No endpoints yet</p>
            <button onClick={addEndpoint} className="btn-primary mt-3 text-xs">
              <Plus className="h-3.5 w-3.5" />
              Add Your First Endpoint
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {endpoints.map((ep) => (
              <div
                key={ep.id}
                className="rounded-xl border border-slate-700 bg-slate-800 overflow-hidden"
              >
                {/* Endpoint Row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <GripVertical className="h-4 w-4 shrink-0 text-slate-600 cursor-grab" />

                  <select
                    value={ep.method}
                    onChange={(e) =>
                      updateEndpointField(
                        ep.id,
                        "method",
                        e.target.value as HTTPMethod,
                      )
                    }
                    className="bg-transparent border-0 p-0 text-xs font-bold focus:outline-none focus:ring-0"
                    style={{ color: methodColor(ep.method) }}
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
                    value={ep.url}
                    onChange={(e) =>
                      updateEndpointField(ep.id, "url", e.target.value)
                    }
                    className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-600 focus:outline-none font-mono"
                    placeholder="https://api.example.com/endpoint"
                  />

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() =>
                        navigate(
                          `/tester?method=${ep.method}&url=${encodeURIComponent(ep.url)}`,
                        )
                      }
                      className="btn-ghost p-1.5 text-slate-500 hover:text-blue-400"
                      title="Test in API Tester"
                    >
                      <Play className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        setExpandedId(expandedId === ep.id ? null : ep.id)
                      }
                      className="btn-ghost p-1.5 text-slate-500"
                    >
                      {expandedId === ep.id ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => removeEndpoint(ep.id)}
                      className="btn-ghost p-1.5 text-slate-600 hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Endpoint Expanded */}
                {expandedId === ep.id && (
                  <div className="border-t border-slate-700 px-4 py-4 space-y-4">
                    <div>
                      <label className="mb-1 block text-xs text-slate-400">
                        Description
                      </label>
                      <input
                        value={ep.description ?? ""}
                        onChange={(e) =>
                          updateEndpointField(
                            ep.id,
                            "description",
                            e.target.value,
                          )
                        }
                        className="input"
                        placeholder="What does this endpoint do?"
                      />
                    </div>

                    <KeyValueEditor
                      title="Query Params"
                      value={ep.queryParams ?? {}}
                      onChange={(v) =>
                        updateEndpointField(ep.id, "queryParams", v)
                      }
                    />

                    <KeyValueEditor
                      title="Headers"
                      value={ep.headers ?? {}}
                      onChange={(v) => updateEndpointField(ep.id, "headers", v)}
                    />

                    {["POST", "PUT", "PATCH"].includes(ep.method) && (
                      <div>
                        <label className="mb-1 block text-xs text-slate-400">
                          Request Body (JSON)
                        </label>
                        <textarea
                          value={
                            ep.body ? JSON.stringify(ep.body, null, 2) : ""
                          }
                          onChange={(e) => {
                            try {
                              updateEndpointField(
                                ep.id,
                                "body",
                                JSON.parse(e.target.value),
                              );
                            } catch {
                              // allow editing invalid JSON temporarily
                            }
                          }}
                          className="input font-mono text-xs resize-none"
                          rows={5}
                          placeholder='{\n  "key": "value"\n}'
                          spellCheck={false}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {dirty && (
          <div className="fixed bottom-6 right-6 z-50">
            <button
              onClick={save}
              disabled={saving}
              className="btn-primary shadow-xl shadow-black/40"
            >
              {saving ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Changes
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function methodColor(method: string) {
  const colors: Record<string, string> = {
    GET: "#6ee7b7",
    POST: "#93c5fd",
    PUT: "#fcd34d",
    PATCH: "#fdba74",
    DELETE: "#fca5a5",
  };
  return colors[method.toUpperCase()] ?? "#94a3b8";
}

// ─── Key-Value Editor ─────────────────────────────────────────────────────────

interface KeyValueEditorProps {
  title: string;
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
}

function KeyValueEditor({ title, value, onChange }: KeyValueEditorProps) {
  const pairs = Object.entries(value);

  const update = (idx: number, part: "key" | "val", text: string) => {
    const newPairs = [...pairs];
    if (part === "key") newPairs[idx] = [text, newPairs[idx][1]];
    else newPairs[idx] = [newPairs[idx][0], text];
    onChange(Object.fromEntries(newPairs.filter(([k]) => k !== "")));
  };

  const add = () => {
    const next: Record<string, string> = { ...value, "": "" };
    onChange(next);
  };

  const remove = (key: string) => {
    const next = { ...value };
    delete next[key];
    onChange(next);
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-xs text-slate-400">{title}</label>
        <button
          onClick={add}
          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-0.5"
        >
          <Plus className="h-3 w-3" />
          Add
        </button>
      </div>
      {pairs.length === 0 ? (
        <p className="text-xs text-slate-600">No {title.toLowerCase()} set</p>
      ) : (
        <div className="space-y-1">
          {pairs.map(([k, v], i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                value={k}
                onChange={(e) => update(i, "key", e.target.value)}
                className="input flex-1 py-1 text-xs font-mono"
                placeholder="key"
              />
              <input
                value={v}
                onChange={(e) => update(i, "val", e.target.value)}
                className="input flex-1 py-1 text-xs font-mono"
                placeholder="value"
              />
              <button
                onClick={() => remove(k)}
                className="text-slate-600 hover:text-red-400 shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
