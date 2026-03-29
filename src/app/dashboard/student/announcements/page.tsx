import DashboardTopbar from "@/components/layout/dashboard-topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone } from "lucide-react";

const announcements = [
  {
    id: 1,
    title: "No Classes Tomorrow",
    content: "Classes are suspended due to weather conditions.",
    date: "March 30, 2026",
  },
  {
    id: 2,
    title: "Exam Schedule",
    content: "Midterm exams will start next week.",
    date: "March 28, 2026",
  },
];

export default function StudentAnnouncementsPage() {
  return (
    <div className="portal-shell space-y-6">
      <DashboardTopbar
        title="Announcements"
        subtitle="Important school updates"
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