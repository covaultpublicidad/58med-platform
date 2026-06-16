import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { MustChangePasswordModal } from "@/components/MustChangePasswordModal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          <MustChangePasswordModal />
          {children}
        </main>
      </div>
    </div>
  );
}
