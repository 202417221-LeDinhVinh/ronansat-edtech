import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import DashboardPageClient from "@/components/dashboard/DashboardPageClient";
import { authOptions } from "@/lib/authOptions";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth");
  }

  if (session.user.role === "PARENT") {
    redirect("/parent/dashboard");
  }

  if (!session.user.hasCompletedProfile) {
    redirect("/welcome");
  }

  return <DashboardPageClient />;
}
