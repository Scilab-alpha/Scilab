"use client";

import { useState } from "react";
import { FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";

type DashboardExportActionsProps = {
  disabled?: boolean;
  onExportCsv: () => void;
  onExportPng: () => Promise<void>;
};

export default function DashboardExportActions({
  disabled,
  onExportCsv,
  onExportPng,
}: DashboardExportActionsProps) {
  const [exporting, setExporting] = useState<"csv" | "png" | null>(null);

  const handleCsv = () => {
    try {
      setExporting("csv");
      onExportCsv();
      toast.success("CSV downloaded");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not export CSV.",
      );
    } finally {
      setExporting(null);
    }
  };

  const handlePng = async () => {
    try {
      setExporting("png");
      await onExportPng();
      toast.success("PNG downloaded");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not export PNG.",
      );
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap" data-export-ignore="true">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9"
        disabled={disabled || exporting !== null}
        onClick={() => void handlePng()}
      >
        {exporting === "png" ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <ImageIcon className="w-4 h-4 mr-2" />
        )}
        Export PNG
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9"
        disabled={disabled || exporting !== null}
        onClick={handleCsv}
      >
        {exporting === "csv" ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <FileText className="w-4 h-4 mr-2" />
        )}
        Export CSV
      </Button>
    </div>
  );
}
