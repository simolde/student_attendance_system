"use client";

import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Bar,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Attendance Status Overview</CardTitle>
          <CardDescription>
            Distribution of attendance records by status.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="w-full h-64 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendanceStatusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                />
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Attendance by Section</CardTitle>
          <CardDescription>
            Compare total attendance records across sections.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="w-full h-64 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%" aspect={2}>
              <BarChart data={sectionAttendanceData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" radius={[6, 6, 0, 0]} name="Total" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}