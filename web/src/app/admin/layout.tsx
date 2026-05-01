import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminSidebar } from "./admin-sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
	const session = await auth();

	if (!session?.user) {
		redirect("/login");
	}

	if (session.user.role !== "admin") {
		redirect("/");
	}

	return (
		<div className="flex min-h-[calc(100vh-4rem)]">
			<AdminSidebar />
			<main className="flex-1 p-4 sm:p-6 min-w-0">{children}</main>
		</div>
	);
}
