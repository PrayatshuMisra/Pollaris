import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Slide, Vote } from "./types";
import { tallyMultipleChoice, tallyOpenText, tallyRating, tallyWords } from "./results";

export function generateResultsPDF(slides: Slide[], allVotes: Vote[], joinCode: string) {
  const doc = new jsPDF();
  
  doc.setFontSize(22);
  doc.text(`Pollaris Presentation Results`, 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Session Code: ${joinCode}  |  Generated: ${new Date().toLocaleString()}`, 14, 30);
  
  let currentY = 40;

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const slideVotes = allVotes.filter(v => v.slide_id === slide.id);
    
    // Page break logic if getting too close to bottom
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(`Slide ${i + 1}: ${slide.question || "Untitled"}`, 14, currentY);
    currentY += 6;
    
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Type: ${slide.type.replace("_", " ")}  |  Total Votes: ${slideVotes.length}`, 14, currentY);
    currentY += 8;

    if (slideVotes.length === 0) {
      doc.setFontSize(10);
      doc.setTextColor(200, 0, 0);
      doc.text("No votes recorded for this slide.", 14, currentY);
      currentY += 15;
      continue;
    }

    // Tally based on type
    if (slide.type === "multiple_choice") {
      const { choices, total } = tallyMultipleChoice(slide, slideVotes);
      const tableData = choices.map(c => [
        c.label || "—",
        c.count.toString(),
        total === 0 ? "0%" : `${Math.round((c.count / total) * 100)}%`
      ]);
      
      autoTable(doc, {
        startY: currentY,
        head: [['Option', 'Votes', 'Percentage']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [42, 43, 95] },
        margin: { left: 14 }
      });
      currentY = (doc as any).lastAutoTable.finalY + 15;

    } else if (slide.type === "rating") {
      const { avg, count } = tallyRating(slideVotes);
      autoTable(doc, {
        startY: currentY,
        head: [['Average Rating', 'Total Responses']],
        body: [[avg.toFixed(2), count.toString()]],
        theme: 'grid',
        headStyles: { fillColor: [245, 166, 35] },
        margin: { left: 14 }
      });
      currentY = (doc as any).lastAutoTable.finalY + 15;

    } else if (slide.type === "word_cloud") {
      const words = tallyWords(slideVotes).slice(0, 30);
      const tableData = words.map(w => [w.word, w.count.toString()]);
      autoTable(doc, {
        startY: currentY,
        head: [['Word', 'Frequency']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 14 }
      });
      currentY = (doc as any).lastAutoTable.finalY + 15;

    } else if (slide.type === "open_text") {
      const items = tallyOpenText(slideVotes);
      const tableData = items.map(item => [item.text]);
      autoTable(doc, {
        startY: currentY,
        head: [['Responses']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] },
        margin: { left: 14 }
      });
      currentY = (doc as any).lastAutoTable.finalY + 15;
    }
  }

  doc.save(`Pollaris_Results_${joinCode}.pdf`);
}
