import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

type PdfPreviewProps = {
  file: Blob;
  fileName: string;
};

export function PdfPreview({ file, fileName }: PdfPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<number>(0);

  useEffect(() => {
    let active = true;
    let currentDoc: { destroy?: () => Promise<void> | void } | null = null;

    const render = async () => {
      if (!containerRef.current) return;

      setLoading(true);
      setError(null);
      setPages(0);
      containerRef.current.innerHTML = "";

      try {
        const [{ default: workerSrc }, pdfjsLib] = await Promise.all([
          import("pdfjs-dist/build/pdf.worker.mjs?url"),
          import("pdfjs-dist"),
        ]);

        pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

        const bytes = new Uint8Array(await file.arrayBuffer());
        const task = pdfjsLib.getDocument({ data: bytes });
        const pdf = await task.promise;
        currentDoc = pdf;

        if (!active || !containerRef.current) {
          await pdf.destroy();
          return;
        }

        setPages(pdf.numPages);

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber);
          if (!active || !containerRef.current) break;

          const wrapper = document.createElement("div");
          wrapper.className = "mx-auto mb-4 w-fit rounded-md border bg-card shadow-sm";

          const canvas = document.createElement("canvas");
          canvas.className = "block max-w-full h-auto";

          const containerWidth = Math.max((containerRef.current.clientWidth || 900) - 32, 320);
          const initialViewport = page.getViewport({ scale: 1 });
          const scale = Math.min(2, containerWidth / initialViewport.width);
          const viewport = page.getViewport({ scale });
          const context = canvas.getContext("2d");

          if (!context) throw new Error("Canvas indisponível para renderizar o PDF.");

          canvas.width = viewport.width;
          canvas.height = viewport.height;

          wrapper.appendChild(canvas);
          containerRef.current.appendChild(wrapper);

          await page.render({
            canvas,
            canvasContext: context,
            viewport,
          }).promise;
        }
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || "Não foi possível renderizar este PDF.");
      } finally {
        if (active) setLoading(false);
      }
    };

    render();

    return () => {
      active = false;
      if (currentDoc) {
        void currentDoc.destroy();
      }
    };
  }, [file]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
        <div>
          <p className="font-medium text-foreground">Não foi possível exibir {fileName}.</p>
          <p className="mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-auto bg-muted/20 p-4">
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Renderizando PDF...
          </div>
        </div>
      ) : null}

      <div ref={containerRef} className="min-h-full" />

      {!loading && pages > 0 ? (
        <p className="mt-2 text-center text-xs text-muted-foreground">{pages} página(s)</p>
      ) : null}
    </div>
  );
}