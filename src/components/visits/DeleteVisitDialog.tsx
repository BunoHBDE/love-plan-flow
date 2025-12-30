import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Visit } from "@/hooks/useVisitsOptimized";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DeleteVisitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visit: Visit | null;
  onConfirm: () => void;
}

export function DeleteVisitDialog({
  open,
  onOpenChange,
  visit,
  onConfirm,
}: DeleteVisitDialogProps) {
  const visitDate = visit?.visit_date
    ? format(new Date(visit.visit_date), "dd/MM/yyyy", { locale: ptBR })
    : "";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Visita</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir a visita
            {visit?.client?.nome && (
              <>
                {" "}de <span className="font-semibold">{visit.client.nome}</span>
              </>
            )}
            {visitDate && (
              <>
                {" "}agendada para <span className="font-semibold">{visitDate}</span>
              </>
            )}
            ? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
