"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Clock,
  DollarSign,
  User,
  Users,
  FileText,
  Settings,
  Search,
  LogOut,
  Activity,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { appConfig } from "@/config/app.config";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/types";

const navItems: Record<UserRole, { href: string; label: string; icon: React.ElementType }[]> = {
  CLIENT: [
    { href: "/dashboard/client", label: "Inicio", icon: LayoutDashboard },
    { href: "/dashboard/client/search", label: `Buscar ${appConfig.roles.provider.plural}`, icon: Search },
    { href: "/dashboard/client/bookings", label: "Mis reservas", icon: Calendar },
    { href: "/dashboard/client/profile", label: "Mi perfil", icon: User },
  ],
  PROVIDER: [
    { href: "/dashboard/provider", label: "Inicio", icon: LayoutDashboard },
    { href: "/dashboard/provider/bookings", label: "Mis reservas", icon: Calendar },
    { href: "/dashboard/provider/availability", label: "Disponibilidad", icon: Clock },
    { href: "/dashboard/provider/earnings", label: "Mis ingresos", icon: DollarSign },
    { href: "/dashboard/provider/profile", label: "Mi perfil", icon: User },
  ],
  ADMIN: [
    { href: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/admin/users", label: "Usuarios", icon: Users },
    { href: "/dashboard/admin/bookings", label: "Reservas", icon: Calendar },
    { href: "/dashboard/admin/invoices", label: "Comprobantes", icon: FileText },
    { href: "/dashboard/admin/logs", label: "Logs del sistema", icon: Activity },
    { href: "/dashboard/admin/settings", label: "Configuración", icon: Settings },
  ],
};

interface SidebarProps {
  role:       UserRole;
  userName:   string;
  avatarUrl?: string | null;
}

export function Sidebar({ role, userName, avatarUrl }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const items = navItems[role];

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-64 min-h-screen bg-card border-r flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <p className="font-bold text-sm mb-3" style={{ color: appConfig.theme.primaryColor }}>
          {appConfig.name}
        </p>
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 shrink-0">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={userName} />}
            <AvatarFallback className="text-xs">
              {userName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <p className="text-sm font-medium truncate">{userName}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              pathname === href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground w-full transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
