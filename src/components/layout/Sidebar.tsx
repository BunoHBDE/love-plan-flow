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
  LogOut,
  CalendarCheck,
  X,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useSidebarContext } from "@/contexts/SidebarContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
          <div className="flex items-center justify-between px-4 py-5 border-b border-sidebar-border">
            <div>
              <h1 className="font-display text-2xl font-bold text-gold tracking-wide">
                Ayllah
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">Gestão de Eventos</p>
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

          {/* User Profile & Logout */}
          <div className="p-3 border-t border-sidebar-border space-y-2">
            <NavLink
              to="/configuracoes"
              onClick={handleNavClick}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer",
                  isActive
                    ? "bg-sidebar-accent shadow-soft"
                    : "hover:bg-sidebar-accent/50"
                )
              }
            >
              <Avatar className="h-9 w-9 border-2 border-primary/20">
                <AvatarImage src="" alt={profile?.full_name || ""} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {profile?.full_name || "Usuário"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {profile?.email}
                </p>
              </div>
            </NavLink>
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
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Header with toggle */}
      <div 
        className="flex items-center justify-between px-4 py-5 border-b border-sidebar-border cursor-pointer hover:bg-sidebar-accent/30 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? (
          <div className="w-full flex justify-center">
            <ChevronRight className="h-5 w-5 text-gold" />
          </div>
        ) : (
          <>
            <div>
              <h1 className="font-display text-2xl font-bold text-gold tracking-wide">
                Ayllah
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">Gestão de Eventos</p>
            </div>
            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
          </>
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

      {/* User Profile & Logout */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        <NavLink
          to="/configuracoes"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer",
              isActive
                ? "bg-sidebar-accent shadow-soft"
                : "hover:bg-sidebar-accent/50",
              collapsed && "justify-center px-2"
            )
          }
        >
          <Avatar className={cn("border-2 border-primary/20", collapsed ? "h-8 w-8" : "h-9 w-9")}>
            <AvatarImage src="" alt={profile?.full_name || ""} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {profile?.full_name?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0 animate-fade-in">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {profile?.full_name || "Usuário"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {profile?.email}
              </p>
            </div>
          )}
        </NavLink>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className={cn("w-full text-destructive hover:text-destructive hover:bg-destructive/10", collapsed && "justify-center")}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sair</span>}
        </Button>
      </div>
    </aside>
  );
}
