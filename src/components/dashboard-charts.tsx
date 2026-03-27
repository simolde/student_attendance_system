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

const PIE_COLORS = ["#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6"];

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
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Attendance Status Overview</CardTitle>
          <CardDescription>
            Distribution of attendance records by status.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {showPie ? (
            <div className="min-w-0 w-full overflow-x-auto">
              <PieChart width={420} height={300}>
                <Pie
                  data={attendanceStatusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
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
            <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
              No attendance status data available.
            </div>
          )}
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
          {showBar ? (
            <div className="min-w-0 w-full overflow-x-auto">
              <BarChart
                width={520}
                height={300}
                data={sectionAttendanceData}
                margin={{ top: 10, right: 10, bottom: 10, left: 0 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="name"
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Total" />
              </BarChart>
            </div>
          ) : (
            <div className="flex h-75 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
              No section attendance data available.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}