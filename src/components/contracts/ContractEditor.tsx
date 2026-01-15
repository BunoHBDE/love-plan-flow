import { useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface ContractEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// Regex to match placeholders like {{placeholder_name}}
const PLACEHOLDER_REGEX = /(\{\{[a-zA-Z_]+\}\})/g;

// Color mapping for placeholder categories
const getPlaceholderColor = (placeholder: string): string => {
  if (placeholder.includes("cliente")) return "bg-blue-200 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200";
  if (placeholder.includes("evento")) return "bg-green-200 dark:bg-green-900/50 text-green-800 dark:text-green-200";
  if (placeholder.includes("valor") || placeholder.includes("parcela") || placeholder.includes("sinal") || placeholder.includes("numero_parcelas") || placeholder.includes("percentual")) return "bg-amber-200 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200";
  if (placeholder.includes("empresa")) return "bg-purple-200 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200";
  if (placeholder.includes("contrato") || placeholder.includes("data_atual")) return "bg-rose-200 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200";
  return "bg-muted text-muted-foreground";
};

export function ContractEditor({ value, onChange, placeholder, className }: ContractEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  // Sync scroll between textarea and highlight div
  const syncScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener("scroll", syncScroll);
      return () => textarea.removeEventListener("scroll", syncScroll);
    }
  }, [syncScroll]);

  // Render highlighted content
  const renderHighlightedContent = () => {
    if (!value) {
      return <span className="text-muted-foreground">{placeholder}</span>;
    }

    const parts = value.split(PLACEHOLDER_REGEX);
    
    return parts.map((part, index) => {
      if (PLACEHOLDER_REGEX.test(part)) {
        // Reset regex lastIndex
        PLACEHOLDER_REGEX.lastIndex = 0;
        return (
          <mark
            key={index}
            className={cn(
              "rounded px-0.5 -mx-0.5",
              getPlaceholderColor(part)
            )}
          >
            {part}
          </mark>
        );
      }
      // Preserve whitespace and newlines
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className={cn("relative w-full h-full", className)}>
      {/* Highlight layer (background) */}
      <div
        ref={highlightRef}
        className="absolute inset-0 overflow-auto pointer-events-none font-mono text-sm leading-relaxed p-3 whitespace-pre-wrap break-words"
        aria-hidden="true"
      >
        {renderHighlightedContent()}
      </div>
      
      {/* Editable textarea (foreground, transparent text) */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "absolute inset-0 w-full h-full resize-none font-mono text-sm leading-relaxed p-3",
          "bg-transparent caret-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "border rounded-md",
          // Make text transparent so highlights show through
          "text-transparent selection:bg-primary/20 selection:text-transparent"
        )}
        placeholder=""
        spellCheck={false}
      />
    </div>
  );
}