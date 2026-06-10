import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

type Status = "healthy" | "warning" | "danger";

interface StatusBadgeProps {
  status: Status;
  label?: string;
  className?: string;
}

const statusConfig: Record<Status, { label: string; className: string; icon: React.ReactNode }> = {
  healthy: {
    label: "ดี",
    className: "bg-green-50 text-green-700 border border-green-200",
    icon: <TrendingUp className="w-3 h-3" />,
  },
  warning: {
    label: "ควรปรับ",
    className: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    icon: <AlertTriangle className="w-3 h-3" />,
  },
  danger: {
    label: "ขาดทุน",
    className: "bg-red-50 text-red-700 border border-red-200",
    icon: <TrendingDown className="w-3 h-3" />,
  },
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.icon}
      {label ?? config.label}
    </span>
  );
}

export function getStatusColor(status: Status) {
  if (status === "healthy") return "text-green-700";
  if (status === "warning") return "text-yellow-600";
  return "text-red-600";
}

export function getStatusBg(status: Status) {
  if (status === "healthy") return "bg-green-50 border-green-200";
  if (status === "warning") return "bg-yellow-50 border-yellow-200";
  return "bg-red-50 border-red-200";
}

export function getMarginStatus(margin: number): Status {
  if (margin >= 30) return "healthy";
  if (margin >= 15) return "warning";
  return "danger";
}
