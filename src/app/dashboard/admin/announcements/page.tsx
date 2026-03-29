"use client";

import { useState } from "react";
import DashboardTopbar from "@/components/layout/dashboard-topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Megaphone, Plus } from "lucide-react";

type Announcement = {
  id: number;
  title: string;
  content: string;
  date: string;
};

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleAdd = () => {
    if (!title || !content) return;

    const newItem = {
      id: Date.now(),
      title,
      content,
      date: new Date().toLocaleDateString("en-PH"),
    };

    setAnnouncements([newItem, ...announcements]);
    setTitle("");
    setContent("");
  };

  return (
    <div className="portal-shell space-y-6">
      <DashboardTopbar
        title="Announcements"
        subtitle="Create and manage school announcements"
      />

      {/* CREATE */}
      <Card className="portal-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Announcement
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <Input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Textarea
            placeholder="Write announcement..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <Button onClick={handleAdd}>Publish</Button>
        </CardContent>
      </Card>

      {/* LIST */}
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