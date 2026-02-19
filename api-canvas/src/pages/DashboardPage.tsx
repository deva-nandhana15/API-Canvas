import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  FolderOpen,
  Trash2,
  ChevronRight,
  Clock,
  AlertCircle,
} from "lucide-react";
import { getAllProjects, deleteProject, createProject } from "../services/api";
import type { APIProject } from "../types";
import AppLayout from "../components/layout/AppLayout";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import MethodBadge from "../components/ui/MethodBadge";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const [projects, setProjects] = useState<APIProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllProjects();
      setProjects(data);
    } catch {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const created = await createProject({
        name: newName.trim(),
        description: newDesc.trim(),
        endpoints: [],
      });
      setProjects((prev) => [created, ...prev]);
      setShowNewModal(false);
      setNewName("");
      setNewDesc("");
      toast.success("Project created");
    } catch {
      toast.error("Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (
    e: React.MouseEvent,
    id: string,
    name: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete project "${name}"? This cannot be undone.`)) return;
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      toast.success("Project deleted");
    } catch {
      toast.error("Failed to delete project");
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Projects</h1>
            <p className="mt-0.5 text-sm text-slate-400">
              Manage your API projects and endpoints
            </p>
          </div>
          <button onClick={() => setShowNewModal(true)} className="btn-primary">
            <Plus className="h-4 w-4" />
            New Project
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
            placeholder="Search projects..."
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 py-20 text-center">
            <FolderOpen className="mb-4 h-12 w-12 text-slate-600" />
            <h3 className="text-base font-medium text-slate-300">
              {search ? "No projects match your search" : "No projects yet"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {search
                ? "Try a different search term"
                : "Create your first project to get started"}
            </p>
            {!search && (
              <button
                onClick={() => setShowNewModal(true)}
                className="btn-primary mt-4"
              >
                <Plus className="h-4 w-4" />
                New Project
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="group relative flex flex-col rounded-xl border border-slate-700 bg-slate-800 p-4 transition-all hover:border-slate-500 hover:shadow-lg hover:shadow-black/30"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600/20 border border-blue-700/30">
                    <FolderOpen className="h-4 w-4 text-blue-400" />
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, project.id, project.name)}
                    className="hidden shrink-0 rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-red-900/30 hover:text-red-400 group-hover:flex"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <h2 className="mb-1 line-clamp-1 font-semibold text-slate-100">
                  {project.name}
                </h2>
                {project.description && (
                  <p className="mb-3 line-clamp-2 text-xs text-slate-500">
                    {project.description}
                  </p>
                )}

                {/* Endpoint preview */}
                {project.endpoints.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1">
                    {project.endpoints.slice(0, 3).map((ep) => (
                      <MethodBadge key={ep.id} method={ep.method} />
                    ))}
                    {project.endpoints.length > 3 && (
                      <span className="inline-block rounded border border-slate-600 bg-slate-700 px-1.5 py-0.5 text-xs text-slate-400">
                        +{project.endpoints.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-auto flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(project.updatedAt)}
                  </span>
                  <span className="flex items-center gap-0.5">
                    {project.endpoints.length} endpoints
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* New Project Modal */}
      {showNewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowNewModal(false);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-2xl">
            <h2 className="mb-5 text-lg font-semibold text-white">
              New Project
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300">
                  Project name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="input"
                  placeholder="My API Project"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                  }}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300">
                  Description
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="input resize-none"
                  rows={3}
                  placeholder="Optional description..."
                />
              </div>
              {!newName.trim() && newName !== "" && (
                <p className="flex items-center gap-1 text-xs text-red-400">
                  <AlertCircle className="h-3.5 w-3.5" /> Project name is
                  required
                </p>
              )}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => {
                    setShowNewModal(false);
                    setNewName("");
                    setNewDesc("");
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating || !newName.trim()}
                  className="btn-primary flex-1"
                >
                  {creating ? <LoadingSpinner size="sm" /> : null}
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
