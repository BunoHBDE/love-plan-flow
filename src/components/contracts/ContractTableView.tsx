import React from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollText, User, Eye, ChevronRight, Calendar, Users, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import type { Contract, ContractStatus } from "@/types/contract.types";
import { CONTRACT_STATUS_LABELS, CONTRACT_STATUS_STYLES, CONTRACT_STATUS_OPTIONS } from "@/constants/contracts";

// ==========================================
// TIPOS
// ==========================================

interface ContractTableViewProps {
  contracts: Contract[];
  onUpdateStatus: (contractId: string, status: ContractStatus) => void;
  onViewDetails: (contract: Contract) => void;
}

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return "Não definida";
  try {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return dateString;
  }
};

// ==========================================
// COMPONENTE DE CARD MOBILE
// ==========================================

function ContractCard({
  contract,
  onUpdateStatus,
  onViewDetails,
}: {
  contract: Contract;
  onUpdateStatus: (contractId: string, status: ContractStatus) => void;
  onViewDetails: (contract: Contract) => void;
}) {
  return (
    <div
      className="bg-card border border-border rounded-lg p-4 hover:shadow-md hover:border-gold/30 transition-all cursor-pointer active:scale-[0.99]"
      onClick={() => onViewDetails(contract)}
    >
      {/* Header: Nome + Status */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-champagne flex-shrink-0">
            <User className="h-5 w-5 text-gold" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate">
              {contract.dados_cliente.nome}
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              {contract.contract_number}
            </p>
          </div>
        </div>
        
        {/* Status Badge */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "font-medium border transition-all text-xs px-2 py-1 h-auto flex-shrink-0",
                CONTRACT_STATUS_STYLES[contract.status]
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {CONTRACT_STATUS_LABELS[contract.status]}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {CONTRACT_STATUS_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateStatus(contract.id, option.value);
                }}
                className={contract.status === option.value ? "bg-accent" : ""}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Info Grid */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-foreground">
            {formatDate(contract.data_evento)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-foreground">
            {contract.dados_evento.n_convidados} convidados
          </span>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className="font-semibold text-primary">
            {formatCurrency(contract.dados_pagamento.valor_total)}
          </span>
        </div>
      </div>

      {/* Footer: Ver detalhes */}
      <div className="flex items-center justify-end mt-3 pt-3 border-t border-border">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          Ver detalhes
          <ChevronRight className="h-3 w-3" />
        </span>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export function ContractTableView({
  contracts,
  onUpdateStatus,
  onViewDetails,
}: ContractTableViewProps) {
  
  if (contracts.length === 0) {
    return (
      <div className="bg-card rounded-xl p-8 shadow-soft border border-border text-center">
        <ScrollText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          Nenhum contrato encontrado
        </h3>
        <p className="text-muted-foreground">
          Crie um contrato a partir de um orçamento aceito.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* MOBILE: Cards */}
      <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
        {contracts.map((contract) => (
          <ContractCard
            key={contract.id}
            contract={contract}
            onUpdateStatus={onUpdateStatus}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>

      {/* DESKTOP: Tabela */}
      <div className="hidden md:block bg-card rounded-xl shadow-soft border border-border overflow-hidden animate-fade-in">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="font-semibold">Contrato</TableHead>
              <TableHead className="font-semibold">Cliente</TableHead>
              <TableHead className="font-semibold">Data Evento</TableHead>
              <TableHead className="font-semibold">Convidados</TableHead>
              <TableHead className="font-semibold">Valor</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.map((contract) => (
              <TableRow 
                key={contract.id} 
                className="hover:bg-muted/20 transition-colors cursor-pointer"
                onClick={() => onViewDetails(contract)}
              >
                {/* Número do Contrato */}
                <TableCell>
                  <span className="font-mono text-sm text-muted-foreground">
                    {contract.contract_number}
                  </span>
                </TableCell>

                {/* Cliente */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-champagne">
                      <User className="h-4 w-4 text-gold" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {contract.dados_cliente.nome}
                      </p>
                      {contract.dados_cliente.telefone && (
                        <p className="text-xs text-muted-foreground">
                          {contract.dados_cliente.telefone}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Data do Evento */}
                <TableCell>
                  <span className="text-foreground">
                    {formatDate(contract.data_evento)}
                  </span>
                </TableCell>

                {/* Convidados */}
                <TableCell>
                  <span className="text-foreground">
                    {contract.dados_evento.n_convidados}
                  </span>
                </TableCell>

                {/* Valor */}
                <TableCell>
                  <span className="font-semibold text-primary">
                    {formatCurrency(contract.dados_pagamento.valor_total)}
                  </span>
                </TableCell>

                {/* Status */}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "font-medium border transition-all",
                          CONTRACT_STATUS_STYLES[contract.status]
                        )}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {CONTRACT_STATUS_LABELS[contract.status]}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {CONTRACT_STATUS_OPTIONS.map((option) => (
                        <DropdownMenuItem
                          key={option.value}
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateStatus(contract.id, option.value);
                          }}
                          className={contract.status === option.value ? "bg-accent" : ""}
                        >
                          {option.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>

                {/* Ações */}
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetails(contract);
                    }}
                    className="hover:bg-primary/10"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
