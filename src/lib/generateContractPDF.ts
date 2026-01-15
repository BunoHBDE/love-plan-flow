import jsPDF from 'jspdf';
import type { Contract } from '@/types/contract.types';
import { replacePlaceholders, DEFAULT_CONTRACT_TEMPLATE } from '@/lib/contractPlaceholders';

// Função para converter HTML para texto plano mantendo formatação
function htmlToText(html: string): string {
  // Remove scripts e styles
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  // Converte tags para quebras de linha e formatação
  text = text
    // Headings → MAIÚSCULAS com quebras
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n\n$1\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n\n$1\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n$1\n')
    
    // Parágrafos → quebra de linha
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    
    // Quebras de linha
    .replace(/<br\s*\/?>/gi, '\n')
    
    // Listas
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<\/ol>/gi, '\n')
    
    // Remove tags HTML restantes
    .replace(/<[^>]+>/g, '')
    
    // Decodifica entidades HTML
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    
    // Limpa espaços extras
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Máximo 2 quebras seguidas
    .trim();
  
  return text;
}

export const generateContractPDF = (contract: Contract): void => {
  const doc = new jsPDF();
  
  const templateContent = contract.modelo_contrato || DEFAULT_CONTRACT_TEMPLATE;
  
  const renderedContent = replacePlaceholders(
    templateContent,
    contract.contract_number,
    contract.dados_cliente,
    contract.dados_evento,
    contract.dados_pagamento,
    contract.dados_empresa
  );

  // 🔧 CORREÇÃO: Converter HTML para texto plano
  const plainText = htmlToText(renderedContent);

  // PDF settings
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - (margin * 2);
  let yPosition = 20;

  // Split content into lines
  const lines = plainText.split('\n');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  for (const line of lines) {
    // Check if we need a new page
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 20;
    }

    // Handle title lines (uppercase or starting with numbers)
    if (line.match(/^[A-ZÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ0-9\s]+$/) && line.trim().length > 0 && line.trim().length < 80) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
    } else if (line.match(/^\d+\.\s/)) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
    }

    // Wrap text if too long
    const wrappedLines = doc.splitTextToSize(line, maxWidth);
    
    for (const wrappedLine of wrappedLines) {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.text(wrappedLine, margin, yPosition);
      yPosition += 5;
    }

    // Add extra space after empty lines
    if (line.trim() === '') {
      yPosition += 2;
    }
  }

  // Add signature lines at the bottom if not on last page with little space
  if (yPosition > 220) {
    doc.addPage();
    yPosition = 100;
  } else {
    yPosition = Math.max(yPosition + 30, 220);
  }

  // Signature section
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  const leftX = margin;
  const rightX = pageWidth / 2 + 10;
  
  // Left signature line
  doc.line(leftX, yPosition, leftX + 70, yPosition);
  doc.text('CONTRATADA', leftX + 25, yPosition + 5);
  
  // Right signature line
  doc.line(rightX, yPosition, rightX + 70, yPosition);
  doc.text('CONTRATANTE', rightX + 22, yPosition + 5);

  // Save the PDF
  const fileName = `contrato-${contract.contract_number}.pdf`;
  doc.save(fileName);
};