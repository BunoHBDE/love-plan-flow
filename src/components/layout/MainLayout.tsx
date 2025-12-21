import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { useSidebarContext } from "@/contexts/SidebarContext";
import { Button } from "@/components/ui/button";
import { Menu, ChevronRight } from "lucide-react";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { collapsed, setCollapsed, isMobile, mobileOpen, setMobileOpen } = useSidebarContext();

  const showSwipeIndicator = (isMobile && !mobileOpen) || (!isMobile && collapsed);

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Sidebar />
      
      {/* Swipe Indicator */}
      {showSwipeIndicator && (
        <div 
          className={`fixed top-1/2 -translate-y-1/2 z-50 flex items-center cursor-pointer group ${
            isMobile ? 'left-0' : 'left-20'
          }`}
          onClick={() => isMobile ? setMobileOpen(true) : setCollapsed(false)}
        >
          <div className="w-1.5 h-24 bg-gradient-to-b from-transparent via-primary/40 to-transparent rounded-r-full transition-all duration-300 group-hover:via-primary/70 group-hover:w-2" />
          <div className="absolute left-0 flex items-center justify-center w-8 h-14 bg-primary/20 rounded-r-xl opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm border border-l-0 border-primary/30 shadow-lg">
            <ChevronRight className="h-5 w-5 text-primary animate-pulse" />
          </div>
        </div>
      )}
      
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
            Espaço Noiva
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
