import { Loader2 } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[40vh]">
      <Loader2 className="w-7 h-7 animate-spin text-primary" aria-hidden />
      <span className="sr-only">Loading admin page…</span>
    </div>
  );
}
