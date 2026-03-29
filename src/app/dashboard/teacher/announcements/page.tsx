import DashboardTopbar from "@/components/layout/dashboard-topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone } from "lucide-react";

const announcements = [
  {
    id: 1,
    title: "Attendance Reminder",
    content: "Please submit attendance before 10:00 AM daily.",
    date: "March 30, 2026",
  },
  {
    id: 2,
    title: "Faculty Meeting",
    content: "Meeting scheduled on Friday at 3 PM.",
    date: "March 29, 2026",
  },
];

export default function TeacherAnnouncementsPage() {
  return (
    <div className="portal-shell space-y-6">
      <DashboardTopbar
        title="Announcements"
        subtitle="School and admin announcements"
      />

      <div className="space-y-4">
        {announcements.map((item) => (
          <Card key={item.id} className="portal-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Megaphone className="h-4 w-4" />
                {item.title}
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-slate-600">{item.content}</p>
              <p className="text-xs text-slate-400 mt-2">{item.date}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}