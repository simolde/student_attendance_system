import Link from "next/link";
import LogoutButton from "@/components/logout-button";
import { Badge } from "@/components/ui/badge";

export default function DashboardNavbar({
  userName,
  role,
}: {
  userName: string;
  role: string;
}) {
  return (
    <header className="border-b bg-background">
      <div className="flex h-16 items-center justify-between px-6">
        <div>
          <Link href="/dashboard" className="text-lg font-bold">
            Student Attendance System
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium">{userName}</p>
            <p className="text-xs text-muted-foreground">
              <Badge variant="secondary">{role}</Badge>
            </p>
          </div>

          <LogoutButton />
        </div>
      </div>
    </header>
  );
}