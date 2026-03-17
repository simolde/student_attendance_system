"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

type AttendanceStatusData = {
  name: string;
  value: number;
};

type SectionAttendanceData = {
  name: string;
  total: number;
};

export default function DashboardCharts({
  attendanceStatusData,
  sectionAttendanceData,
}: {
  attendanceStatusData: AttendanceStatusData[];
  sectionAttendanceData: SectionAttendanceData[];
}) {
  const colors = ["#22c55e", "#eab308", "#ef4444", "#3b82f6"];

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Today&apos;s Attendance Breakdown</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={attendanceStatusData}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label
              >
                {attendanceStatusData.map((entry, index) => (
                  <Cell key={entry.name} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Attendance by Section Today</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sectionAttendanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#6366f1" name="Recorded Students" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}