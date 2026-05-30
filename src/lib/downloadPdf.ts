import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

export async function downloadElementAsPdf(el: HTMLElement, fileName: string) {
  const target = el.querySelector<HTMLElement>("[data-capture-target]") ?? el;
  const canvas = await html2canvas(target, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true,
  });
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: canvas.width > canvas.height ? "l" : "p",
    unit: "px",
    format: [canvas.width, canvas.height],
  });
  pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
  const name = fileName.toLowerCase().endsWith(".pdf") ? fileName : `${fileName}.pdf`;
  pdf.save(name);
}
