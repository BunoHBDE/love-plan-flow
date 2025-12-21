import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  isMobile: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Swipe gesture state
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  const minSwipeDistance = 50;
  const edgeThreshold = 30; // pixels from edge to trigger open

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const onTouchStart = useCallback((e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = Math.abs(touchStart.y - touchEnd.y);
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    const isHorizontalSwipe = Math.abs(distanceX) > distanceY;

    if (!isHorizontalSwipe) return;

    if (isMobile) {
      // Mobile: swipe from left edge opens, swipe left closes
      if (isRightSwipe && touchStart.x < edgeThreshold && !mobileOpen) {
        setMobileOpen(true);
      } else if (isLeftSwipe && mobileOpen) {
        setMobileOpen(false);
      }
    } else {
      // Desktop: swipe from left edge expands, swipe left collapses
      if (isRightSwipe && touchStart.x < edgeThreshold && collapsed) {
        setCollapsed(false);
      } else if (isLeftSwipe && !collapsed && touchStart.x < 280) {
        setCollapsed(true);
      }
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  }, [touchStart, touchEnd, isMobile, mobileOpen, collapsed]);

  // Mouse swipe support for desktop
  const [mouseStart, setMouseStart] = useState<{ x: number; y: number; isDown: boolean } | null>(null);

  const onMouseDown = useCallback((e: MouseEvent) => {
    // Only track if starting from edge
    if (e.clientX < edgeThreshold || (!collapsed && e.clientX < 280)) {
      setMouseStart({ x: e.clientX, y: e.clientY, isDown: true });
    }
  }, [collapsed]);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!mouseStart?.isDown) return;
    
    const distanceX = mouseStart.x - e.clientX;
    const distanceY = Math.abs(mouseStart.y - e.clientY);
    const isHorizontalSwipe = Math.abs(distanceX) > distanceY;
    
    if (!isHorizontalSwipe) return;
    
    if (distanceX < -minSwipeDistance && mouseStart.x < edgeThreshold) {
      // Swipe right from edge
      if (isMobile && !mobileOpen) {
        setMobileOpen(true);
      } else if (!isMobile && collapsed) {
        setCollapsed(false);
      }
      setMouseStart(null);
    } else if (distanceX > minSwipeDistance) {
      // Swipe left
      if (isMobile && mobileOpen) {
        setMobileOpen(false);
      } else if (!isMobile && !collapsed && mouseStart.x < 280) {
        setCollapsed(true);
      }
      setMouseStart(null);
    }
  }, [mouseStart, isMobile, mobileOpen, collapsed]);

  const onMouseUp = useCallback(() => {
    setMouseStart(null);
  }, []);

  useEffect(() => {
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [onTouchStart, onTouchMove, onTouchEnd, onMouseDown, onMouseMove, onMouseUp]);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, mobileOpen, setMobileOpen, isMobile }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarContext must be used within SidebarProvider");
  }
  return context;
}
