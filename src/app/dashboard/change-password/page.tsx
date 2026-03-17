import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ChangePasswordForm from "./form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ChangePasswordPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Change My Password</h1>
        <p className="mt-2 text-muted-foreground">
          Update your account password securely.
        </p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Password Security</CardTitle>
          <CardDescription>
            Enter your current password, then choose a new one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}