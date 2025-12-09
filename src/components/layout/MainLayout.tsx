import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <Sidebar />
      <main className="ml-64 min-h-screen p-8 transition-all duration-300">
        {children}
      </main>
    </div>
  );
}
