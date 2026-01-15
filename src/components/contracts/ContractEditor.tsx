import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Edit3, Eye } from 'lucide-react';
import { EditorToolbar } from './EditorToolbar';
import { PlaceholderDecorator } from '@/lib/tiptap/placeholderMark';
import './editor.css';

interface ContractEditorProps {
  value: string;
  onChange: (value: string) => void;
  previewContent: string;
  placeholder?: string;
  className?: string;
}

// Convert plain text to HTML for initial content
const textToHtml = (text: string): string => {
  if (!text) return '<p></p>';
  
  // If it's already HTML, return as-is
  if (text.trim().startsWith('<')) return text;
  
  // Split into paragraphs and wrap
  const paragraphs = text.split(/\n\n+/);
  return paragraphs
    .map(p => {
      const lines = p.split('\n').join('<br>');
      // Check if it looks like a title (all caps, short)
      if (lines.length < 60 && lines === lines.toUpperCase() && !lines.includes('<br>')) {
        return `<h2>${lines}</h2>`;
      }
      return `<p>${lines}</p>`;
    })
    .join('');
};

// Convert HTML back to plain text for storage
const htmlToText = (html: string): string => {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // Convert h1, h2, h3 to text with double line breaks
  temp.querySelectorAll('h1, h2, h3').forEach(h => {
    h.innerHTML = h.innerHTML + '\n\n';
  });
  
  // Convert p to text with double line breaks
  temp.querySelectorAll('p').forEach(p => {
    p.innerHTML = p.innerHTML + '\n\n';
  });
  
  // Convert br to single line breaks
  temp.querySelectorAll('br').forEach(br => {
    br.replaceWith('\n');
  });
  
  // Convert li to text with line breaks
  temp.querySelectorAll('li').forEach(li => {
    li.innerHTML = '• ' + li.innerHTML + '\n';
  });
  
  return temp.textContent?.trim() || '';
};

export function ContractEditor({ 
  value, 
  onChange, 
  previewContent,
  placeholder = 'Digite o conteúdo do contrato aqui...', 
  className 
}: ContractEditorProps) {
  const initialContent = useMemo(() => textToHtml(value), []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'tiptap-editor prose prose-sm max-w-none focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
  });

  // Register the placeholder decorator plugin
  useEffect(() => {
    if (editor) {
      editor.registerPlugin(PlaceholderDecorator(true));
    }
  }, [editor]);

  // Update editor content when value changes from outside
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      const currentHtml = editor.getHTML();
      const newHtml = textToHtml(value);
      // Only update if content actually changed (prevents cursor jump)
      if (htmlToText(currentHtml) !== htmlToText(newHtml)) {
        editor.commands.setContent(newHtml, { emitUpdate: false });
      }
    }
  }, [value, editor]);

  // Preview content with styling
  const previewHtml = useMemo(() => {
    if (!previewContent) return '';
    return textToHtml(previewContent);
  }, [previewContent]);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <Tabs defaultValue="edit" className="flex-1 flex flex-col">
        <TabsList className="grid w-fit grid-cols-2 mb-2">
          <TabsTrigger value="edit" className="gap-2">
            <Edit3 className="h-4 w-4" />
            <span className="hidden sm:inline">Edição</span>
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Visualização</span>
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 min-h-0">
          <TabsContent value="edit" className="h-full m-0 data-[state=inactive]:hidden">
            <div className="h-full flex flex-col border rounded-md bg-card overflow-hidden">
              <EditorToolbar editor={editor} />
              <ScrollArea className="flex-1">
                <EditorContent editor={editor} className="min-h-full" />
              </ScrollArea>
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="h-full m-0 data-[state=inactive]:hidden">
            <ScrollArea className="h-full border rounded-md bg-slate-100 dark:bg-slate-900 overflow-auto">
              <div className="p-4">
                <div 
                  className="contract-preview"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
