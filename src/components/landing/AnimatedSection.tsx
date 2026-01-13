import { ReactNode, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

// Hook para detectar quando elemento entra na viewport
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: '-50px' }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
}

export function FadeInUp({ children, className = '', delay = 0 }: AnimatedSectionProps) {
  const { ref, isInView } = useInView();
  
  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700 ease-out',
        isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
        className
      )}
      style={{ transitionDelay: `${delay * 1000}ms` }}
    >
      {children}
    </div>
  );
}

export function FadeIn({ children, className = '', delay = 0 }: AnimatedSectionProps) {
  const { ref, isInView } = useInView();
  
  return (
    <div
      ref={ref}
      className={cn(
        'transition-opacity duration-500 ease-out',
        isInView ? 'opacity-100' : 'opacity-0',
        className
      )}
      style={{ transitionDelay: `${delay * 1000}ms` }}
    >
      {children}
    </div>
  );
}

export function ScaleIn({ children, className = '', delay = 0 }: AnimatedSectionProps) {
  const { ref, isInView } = useInView();
  
  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-500 ease-out',
        isInView ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
        className
      )}
      style={{ transitionDelay: `${delay * 1000}ms` }}
    >
      {children}
    </div>
  );
}

export function SlideInLeft({ children, className = '', delay = 0 }: AnimatedSectionProps) {
  const { ref, isInView } = useInView();
  
  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-600 ease-out',
        isInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12',
        className
      )}
      style={{ transitionDelay: `${delay * 1000}ms` }}
    >
      {children}
    </div>
  );
}

export function SlideInRight({ children, className = '', delay = 0 }: AnimatedSectionProps) {
  const { ref, isInView } = useInView();
  
  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-600 ease-out',
        isInView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12',
        className
      )}
      style={{ transitionDelay: `${delay * 1000}ms` }}
    >
      {children}
    </div>
  );
}

// Stagger container for list items
interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggerContainer({ children, className = '' }: StaggerContainerProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  index?: number;
}

export function StaggerItem({ children, className = '', index = 0 }: StaggerItemProps) {
  const { ref, isInView } = useInView();
  
  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-500 ease-out',
        isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5',
        className
      )}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {children}
    </div>
  );
}
