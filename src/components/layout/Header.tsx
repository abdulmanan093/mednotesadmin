"use client";

import { Bell, Shield, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      router.replace("/login");
    }
  };

  return (
    <header className="sticky top-0 z-10 h-14 flex items-center justify-between px-6 bg-surface border-b border-border">
      <div className="ml-10 lg:ml-0" />

      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-muted transition-colors" aria-label="Notifications">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-danger" />
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-border">
          <div className="flex items-center gap-1.5 bg-muted rounded-md px-2.5 py-1">
            <Shield className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-foreground">Admin</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            aria-label="Logout"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold select-none">
            A
          </div>
        </div>
      </div>
    </header>
  );
}
