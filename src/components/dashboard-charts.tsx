"use client";

import {
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
    <div className="grid gap-6 xl:grid-cols-2">
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
            <div className="min-w-0 w-full overflow-x-auto">
              <PieChart width={420} height={320}>
                <Pie
                  data={attendanceStatusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="44%"
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
            </div>
          ) : (
            <div className="flex h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 text-sm text-muted-foreground">
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
            <div className="min-w-0 w-full overflow-x-auto">
              <BarChart
                width={560}
                height={320}
                data={sectionAttendanceData}
                margin={{ top: 10, right: 10, bottom: 10, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  interval={0}
                  angle={-18}
                  textAnchor="end"
                  height={62}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="total"
                  fill="#2563eb"
                  radius={[10, 10, 0, 0]}
                  name="Total"
                />
              </BarChart>
            </div>
          ) : (
            <div className="flex h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 text-sm text-muted-foreground">
              No section attendance data available.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}