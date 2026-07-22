"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Database,
  Globe2,
  Loader2,
  MoreHorizontal,
  PauseCircle,
  Pencil,
  Plus,
  RefreshCw,
  Unplug,
  Zap,
} from "lucide-react";
import AdminPageFrame from "@/shared/components/layout/AdminPageFrame";
import { RouteDataLoading } from "@/shared/components/layout/RouteDataLoading";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { PROVIDER_PRESETS } from "@/features/api-sources/api/provider-presets";
import { useApiSources } from "@/features/api-sources/hooks/use-api-sources";
import type {
  ApiProviderId,
  ApiSource,
  ApiSourceFormValues,
  ApiSourceStatus,
  ConnectionHealth,
} from "@/features/api-sources/types/api-source.types";

const providerIcons: Record<ApiProviderId, string> = {
  openalex: "OA",
  "semantic-scholar": "SS",
  crossref: "CR",
  scimago: "SJ",
  custom: "API",
};

function formatRelativeTime(iso: string | null) {
  if (!iso) return "Never synced";

  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function getStatusStyles(status: ApiSourceStatus) {
  switch (status) {
    case "active":
      return {
        badge: "bg-teal/10 text-teal border-border",
        dot: "bg-green-500",
        label: "Active",
      };
    case "disabled":
      return {
        badge: "bg-surface-raised text-muted-foreground border-border",
        dot: "bg-gray-400",
        label: "Disabled",
      };
    case "error":
      return {
        badge: "bg-red-50 text-red-700 border-red-200",
        dot: "bg-red-500",
        label: "Error",
      };
  }
}

function getHealthStyles(health: ConnectionHealth) {
  switch (health) {
    case "healthy":
      return {
        icon: CheckCircle2,
        className: "text-teal",
        bg: "bg-green-50",
        label: "Healthy",
      };
    case "degraded":
      return {
        icon: AlertTriangle,
        className: "text-amber-600",
        bg: "bg-amber-50",
        label: "Degraded",
      };
    case "down":
      return {
        icon: Unplug,
        className: "text-red-600",
        bg: "bg-red-50",
        label: "Down",
      };
    case "unknown":
      return {
        icon: Activity,
        className: "text-muted-foreground",
        bg: "bg-surface-raised",
        label: "Unknown",
      };
  }
}

const emptyForm: ApiSourceFormValues = {
  name: "",
  providerId: "openalex",
  endpoint: "",
  description: "",
  apiKey: "",
};

interface ProviderCardProps {
  source: ApiSource;
  testingId: string | null;
  onEdit: (source: ApiSource) => void;
  onDisable: (sourceId: string) => void;
  onEnable: (sourceId: string) => void;
  onTest: (sourceId: string) => void;
}

function ProviderCard({
  source,
  testingId,
  onEdit,
  onDisable,
  onEnable,
  onTest,
}: ProviderCardProps) {
  const status = getStatusStyles(source.status);
  const health = getHealthStyles(source.connectionHealth);
  const HealthIcon = health.icon;
  const isTesting = testingId === source.id;

  return (
    <Card className="group relative overflow-hidden border border-border bg-card hover:border-primary/30 transition-all">
      <div className="p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-12 h-12 rounded-[var(--radius-card)] bg-accent border border-border flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-foreground">
                {providerIcons[source.providerId]}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-heading text-base text-foreground">
                  {source.name}
                </h3>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${status.badge}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                  {status.label}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {source.description}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onEdit(source)}>
                <Pencil className="w-4 h-4" />
                Edit Source
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onTest(source.id)}
                disabled={isTesting}
              >
                <RefreshCw className="w-4 h-4" />
                Test Connection
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {source.status === "disabled" ? (
                <DropdownMenuItem onClick={() => onEnable(source.id)}>
                  <Zap className="w-4 h-4" />
                  Enable Source
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onDisable(source.id)}>
                  <PauseCircle className="w-4 h-4" />
                  Disable Source
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="rounded-lg border border-border bg-background/80 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Endpoint
            </p>
            <div className="flex items-center gap-2 min-w-0">
              <Globe2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <p className="text-sm font-mono text-foreground truncate">
                {source.endpoint}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-background/80 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Last Sync
              </p>
              <p className="text-sm font-medium text-foreground">
                {formatRelativeTime(source.lastSync)}
              </p>
            </div>

            <div className="rounded-lg border border-border bg-background/80 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Connection Health
              </p>
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-md flex items-center justify-center ${health.bg}`}
                >
                  <HealthIcon className={`w-4 h-4 ${health.className}`} />
                </div>
                <span className="text-sm font-medium text-foreground">
                  {health.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(source)}
          >
            <Pencil className="w-4 h-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onTest(source.id)}
            disabled={isTesting || source.status === "disabled"}
          >
            {isTesting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Test
              </>
            )}
          </Button>
          <Button
            variant={source.status === "disabled" ? "default" : "secondary"}
            size="sm"
            className="flex-1"
            onClick={() =>
              source.status === "disabled"
                ? onEnable(source.id)
                : onDisable(source.id)
            }
          >
            {source.status === "disabled" ? (
              <>
                <Zap className="w-4 h-4" />
                Enable
              </>
            ) : (
              <>
                <PauseCircle className="w-4 h-4" />
                Disable
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}

interface SourceFormDialogProps {
  open: boolean;
  mode: "add" | "edit";
  initialValues: ApiSourceFormValues;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ApiSourceFormValues) => void;
}

function SourceFormDialog({
  open,
  mode,
  initialValues,
  onOpenChange,
  onSubmit,
}: SourceFormDialogProps) {
  const [values, setValues] = useState(initialValues);

  const handleProviderChange = (providerId: ApiProviderId) => {
    const preset = PROVIDER_PRESETS.find((item) => item.id === providerId);

    setValues((current) => ({
      ...current,
      providerId,
      name: preset?.name ?? current.name,
      endpoint: preset?.endpoint ?? current.endpoint,
      description: preset?.description ?? current.description,
    }));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (nextOpen) setValues(initialValues);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add Source" : "Edit Source"}
          </DialogTitle>
          <DialogDescription>
            Configure an external academic data provider for Scilab ingestion
            pipelines.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(values);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <select
              id="provider"
              className="w-full h-11 px-4 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={values.providerId}
              onChange={(event) =>
                handleProviderChange(event.target.value as ApiProviderId)
              }
            >
              {PROVIDER_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
              <option value="custom">Custom Provider</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              value={values.name}
              onChange={(event) =>
                setValues({ ...values, name: event.target.value })
              }
              placeholder="OpenAlex"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endpoint">Endpoint URL</Label>
            <Input
              id="endpoint"
              value={values.endpoint}
              onChange={(event) =>
                setValues({ ...values, endpoint: event.target.value })
              }
              placeholder="https://api.example.org"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={values.description}
              onChange={(event) =>
                setValues({ ...values, description: event.target.value })
              }
              placeholder="What this provider supplies to Scilab..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key (optional)</Label>
            <Input
              id="apiKey"
              type="password"
              value={values.apiKey}
              onChange={(event) =>
                setValues({ ...values, apiKey: event.target.value })
              }
              placeholder="••••••••••••••••"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {mode === "add" ? "Add Source" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ApiSourceConfiguration() {
  const {
    sources: liveSources,
    isLoading,
    error,
    reload,
    setStatus,
    refresh,
    isMutating,
  } = useApiSources();
  const [customSources, setCustomSources] = useState<ApiSource[]>([]);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [editingSource, setEditingSource] = useState<ApiSource | null>(null);
  const [formValues, setFormValues] = useState<ApiSourceFormValues>(emptyForm);

  const sources = useMemo(
    () => [...liveSources, ...customSources],
    [liveSources, customSources],
  );

  const stats = useMemo(
    () => ({
      total: sources.length,
      active: sources.filter((source) => source.status === "active").length,
      healthy: sources.filter((source) => source.connectionHealth === "healthy")
        .length,
      disabled: sources.filter((source) => source.status === "disabled").length,
    }),
    [sources],
  );

  const openAddDialog = () => {
    setDialogMode("add");
    setEditingSource(null);
    setFormValues(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (source: ApiSource) => {
    setDialogMode("edit");
    setEditingSource(source);
    setFormValues({
      name: source.name,
      providerId: source.providerId,
      endpoint: source.endpoint,
      description: source.description,
      apiKey: "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = (values: ApiSourceFormValues) => {
    if (dialogMode === "add") {
      const newSource: ApiSource = {
        id: `src-${Date.now()}`,
        providerId: values.providerId,
        name: values.name,
        description: values.description,
        endpoint: values.endpoint,
        status: "active",
        connectionHealth: "unknown",
        lastSync: null,
        apiKeyConfigured: Boolean(values.apiKey),
      };
      setCustomSources((current) => [...current, newSource]);
    } else if (editingSource) {
      const isCustom = customSources.some(
        (source) => source.id === editingSource.id,
      );
      if (isCustom) {
        setCustomSources((current) =>
          current.map((source) =>
            source.id === editingSource.id
              ? {
                  ...source,
                  providerId: values.providerId,
                  name: values.name,
                  description: values.description,
                  endpoint: values.endpoint,
                  apiKeyConfigured: values.apiKey
                    ? true
                    : source.apiKeyConfigured,
                }
              : source,
          ),
        );
      }
    }

    setDialogOpen(false);
  };

  const handleDisable = (sourceId: string) => {
    if (customSources.some((source) => source.id === sourceId)) {
      setCustomSources((current) =>
        current.map((source) =>
          source.id === sourceId
            ? { ...source, status: "disabled", connectionHealth: "unknown" }
            : source,
        ),
      );
      return;
    }
    void setStatus(sourceId, "disabled");
  };

  const handleEnable = (sourceId: string) => {
    if (customSources.some((source) => source.id === sourceId)) {
      setCustomSources((current) =>
        current.map((source) =>
          source.id === sourceId
            ? { ...source, status: "active", connectionHealth: "unknown" }
            : source,
        ),
      );
      return;
    }
    void setStatus(sourceId, "active");
  };

  const handleTestConnection = async (sourceId: string) => {
    setTestingId(sourceId);
    try {
      if (customSources.some((source) => source.id === sourceId)) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setCustomSources((current) =>
          current.map((source) =>
            source.id === sourceId
              ? {
                  ...source,
                  connectionHealth: "healthy",
                  lastSync: new Date().toISOString(),
                  status: source.status === "error" ? "active" : source.status,
                }
              : source,
          ),
        );
      } else {
        await refresh(sourceId);
      }
    } finally {
      setTestingId(null);
    }
  };

  return (
    <AdminPageFrame
      title="API Source Configuration"
      subtitle={
        isLoading
          ? "Checking connections…"
          : `${stats.active} active · ${stats.healthy} healthy connections`
      }
      icon={
        <Database
          className="w-5 h-5 text-primary-foreground"
          strokeWidth={1.75}
        />
      }
      headerAction={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={isLoading || isMutating}
            onClick={() => void reload()}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button onClick={openAddDialog}>
            <Plus className="w-4 h-4" />
            Add Source
          </Button>
        </div>
      }
    >
      {error && (
        <Card className="p-4 border-border mb-6">
          <p className="text-sm text-destructive mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={() => void reload()}>
            Try again
          </Button>
        </Card>
      )}

      {isLoading && <RouteDataLoading label="Checking API sources…" />}

      {!isLoading && (
        <div className="space-y-6">
          <Card className="p-6 border-border bg-card">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-heading text-lg text-foreground">
                  External Data Providers
                </h2>
                <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                  Manage academic API integrations used for publication
                  metadata, journal rankings, and citation enrichment. Inspired
                  by integration marketplaces like Vercel and Supabase.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full border border-border bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                  {stats.active} Active
                </span>
                <span className="inline-flex items-center rounded-full border border-border bg-accent px-3 py-1 text-xs font-medium text-tag">
                  {stats.healthy} Healthy
                </span>
                <span className="inline-flex items-center rounded-full border border-border bg-surface-raised px-3 py-1 text-xs font-medium text-muted-foreground">
                  {stats.disabled} Disabled
                </span>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {sources.map((source) => (
              <ProviderCard
                key={source.id}
                source={source}
                testingId={testingId}
                onEdit={openEditDialog}
                onDisable={handleDisable}
                onEnable={handleEnable}
                onTest={handleTestConnection}
              />
            ))}
          </div>

          <Card className="p-5 border-dashed border-border bg-card/70">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Need another provider?
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add custom REST endpoints for institutional repositories,
                  PubMed, or internal research databases.
                </p>
                <Button
                  variant="link"
                  className="px-0 h-auto mt-2"
                  onClick={openAddDialog}
                >
                  Connect a new source
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <SourceFormDialog
        key={`${dialogMode}-${formValues.providerId}-${formValues.name}`}
        open={dialogOpen}
        mode={dialogMode}
        initialValues={formValues}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
      />
    </AdminPageFrame>
  );
}
