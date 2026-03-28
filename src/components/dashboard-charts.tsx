"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Bar,
  Legend,
  Cell,
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

const PIE_COLORS = ["#2563eb", "#f59e0b", "#ef4444", "#06b6d4", "#8b5cf6"];

function hasPieData(data: AttendanceStatusData[]) {
  return data.some((item) => Number(item.value) > 0);
}

function hasBarData(data: SectionAttendanceData[]) {
  return data.some((item) => Number(item.total) > 0);
}

export default function DashboardCharts({
  attendanceStatusData,
  sectionAttendanceData,
}: {
  attendanceStatusData: AttendanceStatusData[];
  sectionAttendanceData: SectionAttendanceData[];
}) {
  const showPie = hasPieData(attendanceStatusData);
  const showBar = hasBarData(sectionAttendanceData);

  return (
    <div className="grid gap-6 2xl:grid-cols-2">
      <Card className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-slate-900">
            Attendance Status Overview
          </CardTitle>
          <CardDescription>
            Distribution of attendance records by status.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {showPie ? (
            <div className="h-85 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 10, right: 10, bottom: 30, left: 10 }}>
                  <Pie
                    data={attendanceStatusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={68}
                    outerRadius={102}
                    paddingAngle={3}
                    stroke="#ffffff"
                    strokeWidth={4}
                  >
                    {attendanceStatusData.map((entry, index) => (
                      <Cell
                        key={`pie-cell-${entry.name}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-85 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 text-sm text-muted-foreground">
              No attendance status data available.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-slate-900">
            Attendance by Section
          </CardTitle>
          <CardDescription>
            Compare total attendance records across sections.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {showBar ? (
            <div className="h-85 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sectionAttendanceData}
                  margin={{ top: 10, right: 10, bottom: 20, left: -10 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e5e7eb"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="total"
                    fill="#2563eb"
                    radius={[10, 10, 0, 0]}
                    name="Total"
                    maxBarSize={56}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-85 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 text-sm text-muted-foreground">
              No section attendance data available.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}