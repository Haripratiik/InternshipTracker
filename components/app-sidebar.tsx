"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Kanban,
  Calendar,
  Building2,
  BarChart3,
  MessageSquare,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Discovery", icon: LayoutDashboard },
  { href: "/tracker", label: "Tracker", icon: Kanban },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/assistant", label: "Assistant", icon: MessageSquare },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 border-r bg-card flex flex-col min-h-screen">
      <div className="p-4 border-b">
        <Link href="/dashboard" className="font-semibold text-lg text-foreground">
          Internship Tracker
        </Link>
        <p className="text-xs text-muted-foreground mt-0.5">Hari</p>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary/15 text-primary font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
