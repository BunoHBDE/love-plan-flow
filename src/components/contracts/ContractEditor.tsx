import { useRef, useEffect, useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Code, Eye, Palette } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

interface ContractEditorProps {
  value: string;
  onChange: (value: string) => void;
  cssValue: string;
  onCssChange: (value: string) => void;
  previewContent: string;
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

// Default CSS for contract styling
export const DEFAULT_CONTRACT_CSS = `/* Estilos do Contrato */
.contract {
  font-family: 'Times New Roman', serif;
  font-size: 12pt;
  line-height: 1.6;
  color: #333;
  max-width: 210mm;
  margin: 0 auto;
  padding: 20mm;
  background: white;
}

.contract h1 {
  font-size: 16pt;
  font-weight: bold;
  text-align: center;
  margin-bottom: 20px;
  text-transform: uppercase;
}

.contract h2 {
  font-size: 14pt;
  font-weight: bold;
  margin-top: 20px;
  margin-bottom: 10px;
}

.contract p {
  text-align: justify;
  margin-bottom: 10px;
}

.contract .section {
  margin-bottom: 20px;
}

.contract .signature-area {
  margin-top: 40px;
  display: flex;
  justify-content: space-between;
}

.contract .signature-line {
  width: 45%;
  text-align: center;
  border-top: 1px solid #333;
  padding-top: 10px;
}

.contract table {
  width: 100%;
  border-collapse: collapse;
  margin: 15px 0;
}

.contract th, .contract td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.contract th {
  background-color: #f5f5f5;
  font-weight: bold;
}
`;

function CodeEditor({ 
  value, 
  onChange, 
  placeholder 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  placeholder?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

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

  const renderHighlightedContent = () => {
    if (!value) {
      return <span className="text-muted-foreground">{placeholder}</span>;
    }

    const parts = value.split(PLACEHOLDER_REGEX);
    
    return parts.map((part, index) => {
      if (PLACEHOLDER_REGEX.test(part)) {
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
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="relative w-full h-full">
      <div
        ref={highlightRef}
        className="absolute inset-0 overflow-auto pointer-events-none font-mono text-sm leading-relaxed p-3 whitespace-pre-wrap break-words"
        aria-hidden="true"
      >
        {renderHighlightedContent()}
      </div>
      
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "absolute inset-0 w-full h-full resize-none font-mono text-sm leading-relaxed p-3",
          "bg-transparent caret-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "border rounded-md",
          "text-transparent selection:bg-primary/20 selection:text-transparent"
        )}
        placeholder=""
        spellCheck={false}
      />
    </div>
  );
}

function CssEditor({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (value: string) => void;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "w-full h-full resize-none font-mono text-xs leading-relaxed p-3",
        "bg-muted/50 text-foreground",
        "focus:outline-none focus:ring-2 focus:ring-ring",
        "border rounded-md"
      )}
      spellCheck={false}
      placeholder="/* Adicione estilos CSS aqui */"
    />
  );
}

function PreviewPane({ 
  content, 
  css 
}: { 
  content: string; 
  css: string;
}) {
  // Convert plain text content to HTML with basic formatting
  const formatContentToHtml = (text: string): string => {
    // Escape HTML
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Convert double newlines to paragraph breaks
    html = html.split(/\n\n+/).map(p => `<p>${p}</p>`).join('');
    
    // Convert single newlines within paragraphs to <br>
    html = html.replace(/\n/g, '<br>');
    
    // Convert lines that look like headers (all caps, short)
    html = html.replace(/<p>([A-ZÀÁÂÃÉÊÍÓÔÕÚÇ\s\d\-\.]+)<\/p>/g, (match, content) => {
      if (content.length < 60 && content === content.toUpperCase()) {
        return `<h2>${content}</h2>`;
      }
      return match;
    });
    
    // Detect first line as title
    html = html.replace(/^<p>([^<]+)<\/p>/, '<h1>$1</h1>');
    
    return html;
  };

  const htmlContent = formatContentToHtml(content);

  return (
    <div className="h-full overflow-auto bg-white rounded-md border">
      <style>{css}</style>
      <div 
        className="contract"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
}

export function ContractEditor({ 
  value, 
  onChange, 
  cssValue,
  onCssChange,
  previewContent,
  placeholder, 
  className 
}: ContractEditorProps) {
  const [activeTab, setActiveTab] = useState<string>("code");
  const [cssOpen, setCssOpen] = useState(false);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <TabsList className="grid w-fit grid-cols-2">
            <TabsTrigger value="code" className="gap-2">
              <Code className="h-4 w-4" />
              <span className="hidden sm:inline">Código</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Visualização</span>
            </TabsTrigger>
          </TabsList>
          
          <Button
            variant={cssOpen ? "secondary" : "outline"}
            size="sm"
            onClick={() => setCssOpen(!cssOpen)}
            className="gap-2"
          >
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Estilos CSS</span>
          </Button>
        </div>

        <div className="flex-1 flex gap-2 min-h-0">
          <div className="flex-1 min-h-0">
            <TabsContent value="code" className="h-full m-0 data-[state=inactive]:hidden">
              <CodeEditor
                value={value}
                onChange={onChange}
                placeholder={placeholder}
              />
            </TabsContent>
            
            <TabsContent value="preview" className="h-full m-0 data-[state=inactive]:hidden">
              <PreviewPane content={previewContent} css={cssValue} />
            </TabsContent>
          </div>

          {/* CSS Editor Panel */}
          {cssOpen && (
            <div className="w-80 min-h-0 flex flex-col border rounded-md bg-card">
              <div className="px-3 py-2 border-b bg-muted/50 rounded-t-md">
                <span className="text-sm font-medium">Estilos CSS</span>
              </div>
              <div className="flex-1 p-2 min-h-0">
                <CssEditor value={cssValue} onChange={onCssChange} />
              </div>
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
}