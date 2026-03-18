import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import AccountForm from "./form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">My Account</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your account information.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription>Role</CardDescription>
            <CardTitle>
              <Badge variant="secondary">{user.role}</Badge>
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Status</CardDescription>
            <CardTitle>
              {user.isActive ? (
                <Badge>Active</Badge>
              ) : (
                <Badge variant="destructive">Inactive</Badge>
              )}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Current Email</CardDescription>
            <CardTitle className="text-lg">{user.email}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Member Since</CardDescription>
            <CardTitle className="text-lg">
              {new Date(user.createdAt).toLocaleDateString()}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Edit Account</CardTitle>
          <CardDescription>
            Update your name and email address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AccountForm
            name={user.name ?? ""}
            email={user.email}
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/change-password"
          className="inline-block rounded-md border px-4 py-2 text-sm hover:bg-accent"
        >
          Change My Password
        </Link>

        <Link
          href="/dashboard"
          className="inline-block rounded-md border px-4 py-2 text-sm hover:bg-accent"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}