import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { useSidebarContext } from "@/contexts/SidebarContext";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { collapsed, isMobile, setMobileOpen } = useSidebarContext();

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Sidebar />
      
      {/* Mobile Header */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 z-30 bg-sidebar border-b border-sidebar-border px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            className="text-sidebar-foreground"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="font-display text-lg font-semibold text-sidebar-foreground">
            Ayllah
          </h1>
        </header>
      )}
      
      <main 
        className={`min-h-screen p-4 md:p-8 transition-all duration-300 ${
          isMobile 
            ? "ml-0 pt-20" 
            : collapsed 
              ? "ml-20" 
              : "ml-64"
        }`}
      >
        {children}
      </main>
    </div>
  );
}
