import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

export default function StatCard({
  label,
  value,
  description,
  icon,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  description?: string;
  icon?: React.ReactNode;
  tone?: "default" | "success" | "warning" | "danger" | "info";
}) {
  const toneClasses: Record<string, string> = {
    default: "bg-white border-slate-200",
    success: "bg-emerald-50 border-emerald-200",
    warning: "bg-amber-50 border-amber-200",
    danger: "bg-rose-50 border-rose-200",
    info: "bg-sky-50 border-sky-200",
  };

  return (
    <Card className={cn("shadow-sm", toneClasses[tone])}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
        </div>

        {icon ? (
          <div className="rounded-xl bg-white/70 p-2 shadow-sm">
            {icon}
          </div>
        ) : null}
      </CardHeader>

      <CardContent>
        <div className="text-3xl font-bold tracking-tight text-slate-900">
          {value}
        </div>

        {description ? (
          <p className="mt-2 text-xs text-slate-500">{description}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}