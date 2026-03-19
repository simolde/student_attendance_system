import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, ROLES } from "@/lib/rbac";
import { redirect } from "next/navigation";
import Link from "next/link";
import UserManagementForms from "./forms";
import UserTableActions from "./user-table-actions";
import PageHeader from "@/components/layout/page-header";
import TableToolbar from "@/components/layout/table-toolbar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 10;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; page?: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasRole(session.user.role, [ROLES.SUPER_ADMIN, ROLES.ADMIN])) {
    redirect("/unauthorized");
  }

  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const role = params.role?.trim() ?? "";
  const page = Math.max(Number(params.page || "1"), 1);

  const where = {
    AND: [
      q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { email: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {},
      role
        ? {
            role: role as
              | "SUPER_ADMIN"
              | "ADMIN"
              | "TEACHER"
              | "STAFF"
              | "STUDENT",
          }
        : {},
    ],
  };

  const [users, totalUsers] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.max(Math.ceil(totalUsers / PAGE_SIZE), 1);

  function buildUrl(nextPage: number) {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (role) sp.set("role", role);
    sp.set("page", String(nextPage));
    return `/dashboard/admin/users?${sp.toString()}`;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="User Management"
        description="Create admin, teacher, staff, and student accounts."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Admin", href: "/dashboard/admin" },
          { label: "User Management" },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Create User</CardTitle>
          <CardDescription>Add new users and assign their roles.</CardDescription>
        </CardHeader>
        <CardContent>
          <UserManagementForms />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Page {page} of {totalPages} • {totalUsers} total users
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <TableToolbar>
            <form method="GET" className="grid flex-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium">Search</label>
                <Input
                  name="q"
                  defaultValue={q}
                  placeholder="Search name or email"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Role</label>
                <select
                  name="role"
                  defaultValue={role}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="">All roles</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="TEACHER">TEACHER</option>
                  <option value="STAFF">STAFF</option>
                  <option value="STUDENT">STUDENT</option>
                </select>
              </div>

              <input type="hidden" name="page" value="1" />

              <div className="flex items-end gap-2">
                <Button type="submit">Apply</Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/dashboard/admin/users">Reset</Link>
                </Button>
              </div>
            </form>
          </TableToolbar>

          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users found.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name ?? "-"}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        {user.isActive ? (
                          <Badge>Active</Badge>
                        ) : (
                          <Badge variant="destructive">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <UserTableActions
                          user={{
                            id: user.id,
                            email: user.email,
                            role: user.role,
                            isActive: user.isActive,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  asChild
                  disabled={page <= 1}
                >
                  <Link href={buildUrl(page - 1)}>Previous</Link>
                </Button>

                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  asChild
                  disabled={page >= totalPages}
                >
                  <Link href={buildUrl(page + 1)}>Next</Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}