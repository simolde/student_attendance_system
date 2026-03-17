import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

function getStatusVariant(status: string) {
  switch (status) {
    case "PRESENT":
      return "default";
    case "LATE":
      return "secondary";
    case "ABSENT":
      return "destructive";
    case "EXCUSED":
      return "outline";
    default:
      return "secondary";
  }
}

export default async function StudentAttendancePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasRole(session.user.role, [ROLES.STUDENT])) {
    redirect("/unauthorized");
  }

  const student = await prisma.student.findUnique({
    where: {
      userId: session.user.id,
    },
    include: {
      user: true,
      section: true,
      attendances: {
        orderBy: {
          date: "desc",
        },
      },
    },
  });

  if (!student) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Student Record Not Found</CardTitle>
            <CardDescription>
              Your account does not have a linked student profile yet.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">My Attendance</h1>
        <p className="mt-2 text-muted-foreground">
          View your attendance history only.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Student Name</CardDescription>
            <CardTitle className="text-xl">
              {student.user.name ?? student.user.email}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Student Number</CardDescription>
            <CardTitle className="text-xl">{student.studentNo}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Section</CardDescription>
            <CardTitle className="text-xl">
              {student.section?.name ?? "-"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>
            Your saved attendance history.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {student.attendances.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No attendance records found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {student.attendances.map((attendance) => (
                  <TableRow key={attendance.id}>
                    <TableCell>
                      {new Date(attendance.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(attendance.status)}>
                        {attendance.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{attendance.remarks ?? "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div>
        <Link
          href="/dashboard/student"
          className="inline-block rounded-md border px-4 py-2 text-sm hover:bg-accent"
        >
          Back to Student Dashboard
        </Link>
      </div>
    </div>
  );
}