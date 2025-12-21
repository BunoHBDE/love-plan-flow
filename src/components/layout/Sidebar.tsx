import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Calendar,
  FileText,
  Users,
  CreditCard,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Heart,
  LogOut,
  CalendarCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useSidebarContext } from "@/contexts/SidebarContext";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/", disabled: false },
  { icon: CalendarCheck, label: "Disponibilidade", path: "/disponibilidade", disabled: false },
  { icon: Calendar, label: "Visitas", path: "/visitas", disabled: false },
  { icon: FileText, label: "Orçamentos", path: "/orcamentos", disabled: false },
  { icon: Users, label: "Clientes", path: "/clientes", disabled: false },
  { icon: FileText, label: "Contratos", path: "/contratos", disabled: true },
  { icon: CreditCard, label: "Pagamentos", path: "/pagamentos", disabled: true },
];

export function Sidebar() {
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen, isMobile } = useSidebarContext();
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao sair da conta',
        variant: 'destructive',
      });
    } else {
      navigate('/auth');
    }
  };

  const handleNavClick = () => {
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  // Mobile overlay
  if (isMobile) {
    return (
      <>
        {/* Overlay */}
        {mobileOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
        
        {/* Mobile Sidebar */}
        <aside
          className={cn(
            "fixed left-0 top-0 z-50 h-screen bg-sidebar border-r border-sidebar-border transition-transform duration-300 flex flex-col w-64",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Header with close button */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-gold shadow-gold">
                <Heart className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display text-lg font-semibold text-sidebar-foreground">
                  Espaço Noiva
                </h1>
                <p className="text-xs text-muted-foreground">Gestão de Eventos</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(false)}
              className="text-muted-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              item.disabled ? (
                <div
                  key={item.path}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium cursor-not-allowed opacity-40 text-muted-foreground"
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </div>
              ) : (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-primary shadow-soft"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                    )
                  }
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              )
            ))}
          </nav>

          {/* User & Logout */}
          <div className="p-3 border-t border-sidebar-border space-y-2">
            {profile && (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                {profile.full_name || profile.email}
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              <span className="ml-2">Sair</span>
            </Button>
          </div>
        </aside>
      </>
    );
  }

  // Desktop Sidebar
  return (
    <div className="group/sidebar">
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
          collapsed ? "w-20" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-gold shadow-gold">
            <Heart className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="font-display text-lg font-semibold text-sidebar-foreground">
                Espaço Noiva
              </h1>
              <p className="text-xs text-muted-foreground">Gestão de Eventos</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {navItems.map((item) => (
            item.disabled ? (
              <div
                key={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium cursor-not-allowed opacity-40",
                  "text-muted-foreground",
                  collapsed && "justify-center px-3"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="animate-fade-in">{item.label}</span>
                )}
              </div>
            ) : (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary shadow-soft"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                    collapsed && "justify-center px-3"
                  )
                }
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="animate-fade-in">{item.label}</span>
                )}
              </NavLink>
            )
          ))}
        </nav>

        {/* User & Logout */}
        <div className="p-3 border-t border-sidebar-border space-y-2">
          {!collapsed && profile && (
            <div className="px-3 py-2 text-sm text-muted-foreground animate-fade-in">
              {profile.full_name || profile.email}
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className={cn("w-full text-destructive hover:text-destructive hover:bg-destructive/10", collapsed && "justify-center")}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Sair</span>}
          </Button>
          {!collapsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(true)}
              className="w-full"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Recolher</span>
            </Button>
          )}
        </div>

        {/* Expand edge - curved clickable area on the right side when collapsed */}
        {collapsed && (
          <div
            onClick={() => setCollapsed(false)}
            className="absolute right-0 top-0 h-full w-3 cursor-pointer opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 flex items-center justify-center"
          >
            <div className="h-full w-full bg-gradient-to-r from-transparent to-primary/10 group-hover/sidebar:to-primary/20 transition-all duration-300" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-32 bg-primary/50 rounded-l-full transition-all duration-300 group-hover/sidebar:h-48 group-hover/sidebar:bg-primary/70" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center">
              <ChevronRight className="h-4 w-4 text-primary opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300" />
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
