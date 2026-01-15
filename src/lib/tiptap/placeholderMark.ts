import { Mark, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

// Regex to match placeholders like {{placeholder_name}}
const PLACEHOLDER_REGEX = /\{\{[a-zA-Z_]+\}\}/g;

// Get category-based color classes for placeholders
const getPlaceholderClass = (placeholder: string): string => {
  if (placeholder.includes('cliente')) return 'placeholder-cliente';
  if (placeholder.includes('evento')) return 'placeholder-evento';
  if (placeholder.includes('valor') || placeholder.includes('parcela') || placeholder.includes('sinal') || placeholder.includes('numero_parcelas') || placeholder.includes('percentual')) return 'placeholder-valor';
  if (placeholder.includes('empresa')) return 'placeholder-empresa';
  if (placeholder.includes('contrato') || placeholder.includes('data_atual')) return 'placeholder-contrato';
  return 'placeholder-default';
};

export const PlaceholderHighlight = Mark.create({
  name: 'placeholderHighlight',
  
  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },
  
  parseHTML() {
    return [
      {
        tag: 'span[data-placeholder]',
      },
    ];
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-placeholder': 'true' }), 0];
  },
});

export const PlaceholderDecorator = (enabled: boolean = true) => {
  return new Plugin({
    key: new PluginKey('placeholderDecorator'),
    props: {
      decorations(state) {
        if (!enabled) return DecorationSet.empty;
        
        const decorations: Decoration[] = [];
        const doc = state.doc;
        
        doc.descendants((node, pos) => {
          if (!node.isText || !node.text) return;
          
          const text = node.text;
          let match;
          
          while ((match = PLACEHOLDER_REGEX.exec(text)) !== null) {
            const start = pos + match.index;
            const end = start + match[0].length;
            const className = getPlaceholderClass(match[0]);
            
            decorations.push(
              Decoration.inline(start, end, {
                class: `placeholder-highlight ${className}`,
              })
            );
          }
          
          // Reset regex lastIndex
          PLACEHOLDER_REGEX.lastIndex = 0;
        });
        
        return DecorationSet.create(doc, decorations);
      },
    },
  });
};
