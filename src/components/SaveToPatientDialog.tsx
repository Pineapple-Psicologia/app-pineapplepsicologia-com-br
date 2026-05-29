import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { elementToPdf, downloadPdfBlob } from "@/lib/patientFiles";
import { Download } from "lucide-react";

export function SaveToPatientDialog({
  open,
  onOpenChange,
  targetEl,
  defaultFileName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  targetEl: HTMLElement | null;
  game?: string | null;
  defaultFileName?: string;
}) {
  const [fileName, setFileName] = useState(defaultFileName ?? "atividade.pdf");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFileName(defaultFileName ?? `atividade-${new Date().toISOString().slice(0, 10)}.pdf`);
  }, [open, defaultFileName]);

  const ensurePdf = (name: string) =>
    name.toLowerCase().endsWith(".pdf") ? name : `${name}.pdf`;

  const resolveTarget = (): HTMLElement | null => {
    if (!targetEl) return null;
    const inner = targetEl.querySelector<HTMLElement>("[data-capture-target]");
    return inner ?? targetEl;
  };

  const handleDownload = async () => {
    const el = resolveTarget();
    if (!el) return;
    setBusy(true);
    try {
      const finalName = ensurePdf(fileName);
      const { blob } = await elementToPdf(el, finalName);
      downloadPdfBlob(blob, finalName);
      toast.success("PDF baixado");
      onOpenChange(false);
    } catch (e: any) {
      toast.error("Erro ao gerar PDF", { description: e?.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Baixar atividade</DialogTitle>
          <DialogDescription>
            Gera um PDF da tela atual para download.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome do arquivo</Label>
            <Input value={fileName} onChange={(e) => setFileName(e.target.value)} />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" onClick={handleDownload} disabled={busy}>
            <Download className="w-4 h-4 mr-1" /> Baixar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
