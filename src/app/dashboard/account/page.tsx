import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import PageHeader from "@/components/layout/page-header";
import AccountForm from "./form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

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
      image: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const displayName = user.name ?? user.email;
  const initials = getInitials(displayName ?? "U");

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Account"
        description="Manage your personal account details and profile image."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "My Account" },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle>Profile Summary</CardTitle>
            <CardDescription>
              Your account information at a glance.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.image ?? undefined} alt={displayName ?? "User"} />
                <AvatarFallback className="text-xl">{initials}</AvatarFallback>
              </Avatar>

              <h2 className="mt-4 text-xl font-semibold text-slate-900">
                {displayName}
              </h2>

              <p className="mt-1 text-sm text-slate-500">{user.email}</p>
            </div>

            <div className="grid gap-4">
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Role
                </p>
                <div className="mt-2">
                  <Badge variant="secondary">{user.role}</Badge>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Status
                </p>
                <div className="mt-2">
                  {user.isActive ? (
                    <Badge>Active</Badge>
                  ) : (
                    <Badge variant="destructive">Inactive</Badge>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Member Since
                </p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Edit Account</CardTitle>
            <CardDescription>
              Update your name, email, and profile image.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <AccountForm
              name={user.name ?? ""}
              email={user.email}
              image={user.image ?? null}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}