import { jsPDF } from 'jspdf';

export interface DailyMenuPdfDish {
  name: string;
  price: number;
  description?: string | null;
  ingredients?: string[];
  imageDataUrl?: string | null;
}

export interface DailyMenuPdfGroup {
  name: string;
  dishes: DailyMenuPdfDish[];
}

export interface DailyMenuPdfSection {
  title: string;
  layout: 'cards' | 'grid';
  groups: DailyMenuPdfGroup[];
}

export interface DailyMenuPdfInput {
  restaurantName: string;
  dateLabel: string;
  rateNote: string;
  templateDataUrl: string | null;
  sections: DailyMenuPdfSection[];
}

type RGB = [number, number, number];

const PAPER: RGB = [255, 251, 245];
const INK: RGB = [38, 1, 1];
const GOLD: RGB = [242, 174, 46];
const CREAM: RGB = [247, 236, 214];
const PRICE: RGB = [140, 48, 12];
const BODY: RGB = [74, 52, 40];
const SOFT: RGB = [122, 96, 78];
const LINE: RGB = [226, 208, 180];
const ROW: RGB = [255, 255, 255];
const LABEL: RGB = [176, 78, 16];

const TPL_INK: RGB = [28, 28, 28];
const TPL_PRICE: RGB = [22, 104, 46];
const TPL_BODY: RGB = [55, 55, 55];
const TPL_SOFT: RGB = [90, 90, 90];
const TPL_LINE: RGB = [214, 214, 206];
const TPL_LABEL: RGB = [22, 104, 46];

const PILL_H = 5.6;
const PILL_BLOCK = PILL_H + 3.6;
const LABEL_H = 6.5;
const ROW_H = 11;
const ROW_GAP = 2;

function imageFormat(dataUrl: string): 'PNG' | 'JPEG' | 'WEBP' {
  if (dataUrl.startsWith('data:image/png')) return 'PNG';
  if (dataUrl.startsWith('data:image/webp')) return 'WEBP';
  return 'JPEG';
}

function money(amount: number, prefix = ''): string {
  return `${prefix}$${amount.toFixed(2)}`;
}

export function buildDailyMenuPdf(input: DailyMenuPdfInput): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const hasTemplate = Boolean(input.templateDataUrl);

  const marginX = hasTemplate ? 18 : 14;
  const contentW = pageW - marginX * 2;
  const headerH = hasTemplate ? 46 : 30;
  const footerH = hasTemplate ? 22 : 14;
  const contentTop = headerH + (hasTemplate ? 4 : 8);
  const contentBottom = pageH - footerH - (hasTemplate ? 2 : 4);

  const ink = hasTemplate ? TPL_INK : INK;
  const price = hasTemplate ? TPL_PRICE : PRICE;
  const body = hasTemplate ? TPL_BODY : BODY;
  const soft = hasTemplate ? TPL_SOFT : SOFT;
  const line = hasTemplate ? TPL_LINE : LINE;
  const label = hasTemplate ? TPL_LABEL : LABEL;
  const pillFill = hasTemplate ? TPL_PRICE : GOLD;
  const pillInk: RGB = hasTemplate ? [255, 255, 255] : INK;

  doc.setProperties({
    title: `Menú del día — ${input.dateLabel}`,
    subject: input.restaurantName,
  });

  function paint(color: RGB) {
    doc.setFillColor(color[0], color[1], color[2]);
  }
  function stroke(color: RGB) {
    doc.setDrawColor(color[0], color[1], color[2]);
  }
  function write(color: RGB) {
    doc.setTextColor(color[0], color[1], color[2]);
  }

  function paintPage() {
    if (input.templateDataUrl) {
      try {
        doc.addImage(input.templateDataUrl, imageFormat(input.templateDataUrl), 0, 0, pageW, pageH);
      } catch {
        paint(PAPER);
        doc.rect(0, 0, pageW, pageH, 'F');
      }
      return;
    }

    paint(PAPER);
    doc.rect(0, 0, pageW, pageH, 'F');
    paint(INK);
    doc.rect(0, 0, pageW, headerH, 'F');
    paint(GOLD);
    doc.rect(0, headerH, pageW, 1.3, 'F');
    paint(INK);
    doc.rect(0, pageH - footerH + 1, pageW, footerH - 1, 'F');
    paint(GOLD);
    doc.rect(0, pageH - footerH, pageW, 1, 'F');
  }

  function drawHeader() {
    if (hasTemplate) return;

    doc.setFont('helvetica', 'bold');
    write(GOLD);
    let size = 13;
    doc.setFontSize(size);
    while (size > 10 && doc.getTextWidth(input.restaurantName) > contentW) {
      size -= 0.5;
      doc.setFontSize(size);
    }
    doc.text(input.restaurantName, pageW / 2, 12, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    write(CREAM);
    doc.text(input.dateLabel, pageW / 2, 18, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    write(GOLD);
    doc.text('MENÚ DEL DÍA', pageW / 2, 23.5, { align: 'center' });
  }

  function drawFooter(pageNum: number, total: number) {
    if (hasTemplate) return;
    doc.setFont('helvetica', 'normal');
    const footer = `Precios en USD   ·   ${input.rateNote}   ·   Página ${pageNum} de ${total}`;
    let size = 7.5;
    doc.setFontSize(size);
    while (size > 6 && doc.getTextWidth(footer) > contentW) {
      size -= 0.5;
      doc.setFontSize(size);
    }
    write(CREAM);
    doc.text(footer, pageW / 2, pageH - 5, { align: 'center' });
  }

  function nextPage(): number {
    doc.addPage();
    paintPage();
    drawHeader();
    return contentTop;
  }

  function ensure(y: number, needed: number): number {
    if (y + needed <= contentBottom) return y;
    return nextPage();
  }

  function fitText(text: string, maxWidth: number): string {
    if (maxWidth <= 0) return '';
    if (doc.getTextWidth(text) <= maxWidth) return text;
    let cut = text.trimEnd();
    while (cut.length > 1 && doc.getTextWidth(`${cut}...`) > maxWidth) {
      cut = cut.slice(0, -1).trimEnd();
    }
    return cut.length > 0 ? `${cut}...` : '';
  }

  function wrapLines(text: string, maxWidth: number, maxLines: number): string[] {
    const raw = doc.splitTextToSize(text, maxWidth);
    const lines = (Array.isArray(raw) ? raw : [raw]).filter((line) => line.length > 0);
    if (lines.length <= maxLines) return lines;
    const kept = lines.slice(0, maxLines);
    const last = kept[maxLines - 1].replace(/\.+$/, '');
    kept[maxLines - 1] = fitText(`${last}...`, maxWidth);
    return kept;
  }

  function drawPill(title: string, y: number): number {
    const pillText = title.toUpperCase();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    const textW = doc.getTextWidth(pillText);
    const h = PILL_H;
    const w = Math.min(contentW, textW + 7);
    paint(pillFill);
    doc.roundedRect(marginX, y, w, h, h / 2, h / 2, 'F');
    write(pillInk);
    doc.text(fitText(pillText, w - 6), marginX + 3.5, y + 3.8);
    return y + PILL_BLOCK;
  }

  function drawGroupLabel(name: string, y: number): number {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    write(label);
    const shown = fitText(name.toUpperCase(), contentW * 0.62);
    doc.text(shown, marginX, y + 3.4);
    const textW = doc.getTextWidth(shown);
    if (textW + 6 < contentW) {
      stroke(line);
      doc.setLineWidth(0.35);
      doc.line(marginX + textW + 3, y + 2.3, marginX + contentW, y + 2.3);
    }
    return y + LABEL_H;
  }

  function drawGridCell(
    dish: DailyMenuPdfDish,
    x: number,
    w: number,
    y: number,
    h: number,
  ) {
    const priceLabel = money(dish.price, '+');
    const pad = 4.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    const priceW = doc.getTextWidth(priceLabel);
    doc.setFontSize(10.5);
    const nameMax = w - pad * 2 - priceW - 3;
    const name = fitText(dish.name, Math.max(8, nameMax));
    const baseline = y + h * 0.66;

    write(ink);
    doc.text(name, x + pad, baseline);

    const nameW = doc.getTextWidth(name);
    const leaderStart = x + pad + nameW + 1.6;
    const leaderEnd = x + w - pad - priceW - 1.6;
    if (leaderEnd - leaderStart > 6) {
      stroke(line);
      doc.setLineWidth(0.25);
      doc.setLineDashPattern([0.3, 1.1], 0);
      doc.line(leaderStart, baseline - 0.8, leaderEnd, baseline - 0.8);
      doc.setLineDashPattern([], 0);
    }

    doc.setFontSize(9);
    write(price);
    doc.text(priceLabel, x + w - pad, baseline, { align: 'right' });
  }

  function drawGridRow(
    left: DailyMenuPdfDish,
    right: DailyMenuPdfDish | null,
    y: number,
    single: boolean,
  ) {
    const h = ROW_H;
    paint(ROW);
    stroke(line);
    doc.setLineWidth(0.3);
    doc.roundedRect(marginX, y, contentW, h, 1.8, 1.8, 'FD');

    const mid = marginX + contentW / 2;
    if (!single) {
      stroke(line);
      doc.setLineWidth(0.25);
      doc.line(mid, y + 2.2, mid, y + h - 2.2);
      drawGridCell(left, marginX, contentW / 2, y, h);
      if (right) drawGridCell(right, mid, contentW / 2, y, h);
      return;
    }

    drawGridCell(left, marginX, contentW, y, h);
  }

  function cardLayout(dish: DailyMenuPdfDish) {
    const padX = 5;
    const hasImage = Boolean(dish.imageDataUrl);
    const imgSize = 18;
    const textX = marginX + padX + (hasImage ? imgSize + 4 : 0);
    const textW = contentW - (textX - marginX) - padX;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    const priceLabel = money(dish.price);
    const priceW = doc.getTextWidth(priceLabel);
    doc.setFontSize(11);
    const name = fitText(dish.name, Math.max(24, textW - priceW - 4));

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const descLines = dish.description?.trim()
      ? wrapLines(dish.description.trim(), textW, 3)
      : [];
    doc.setFontSize(8);
    const ingText = (dish.ingredients ?? []).filter(Boolean).join('  ·  ');
    const ingLines = ingText ? wrapLines(ingText, textW, 2) : [];
    const compact = descLines.length === 0 && ingLines.length === 0;

    let textH = 8;
    if (compact) {
      textH = 14;
    } else {
      textH = 8 + 6;
      if (descLines.length) textH += descLines.length * 4;
      if (ingLines.length) textH += 1.5 + ingLines.length * 3.6;
      textH += 4;
    }

    const cardH = Math.max(textH, hasImage ? imgSize + 8 : compact ? 14 : textH);
    return { cardH, textX, name, priceLabel, descLines, ingLines, hasImage, imgSize, padX, compact };
  }

  function drawCard(dish: DailyMenuPdfDish, y: number): number {
    const layout = cardLayout(dish);
    paint(ROW);
    stroke(line);
    doc.setLineWidth(0.35);
    doc.roundedRect(marginX, y, contentW, layout.cardH, 2.2, 2.2, 'FD');

    paint(hasTemplate ? TPL_PRICE : GOLD);
    doc.roundedRect(marginX + 1.6, y + 2.4, 1.15, layout.cardH - 4.8, 0.5, 0.5, 'F');

    if (layout.hasImage && dish.imageDataUrl) {
      const imgY = y + (layout.cardH - layout.imgSize) / 2;
      try {
        doc.addImage(
          dish.imageDataUrl,
          imageFormat(dish.imageDataUrl),
          marginX + layout.padX,
          imgY,
          layout.imgSize,
          layout.imgSize,
        );
      } catch {
        // Si el formato no entra en el PDF, el plato sigue con nombre y precio.
      }
    }

    const nameY = layout.compact ? y + layout.cardH * 0.64 : y + 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    write(ink);
    doc.text(layout.name, layout.textX, nameY);
    doc.setFontSize(10);
    write(price);
    doc.text(layout.priceLabel, marginX + contentW - layout.padX, nameY, { align: 'right' });

    let inner = nameY + 5.5;
    if (layout.descLines.length) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      write(body);
      for (const descLine of layout.descLines) {
        doc.text(descLine, layout.textX, inner);
        inner += 4;
      }
    }
    if (layout.ingLines.length) {
      inner += 1;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      write(soft);
      for (const ingLine of layout.ingLines) {
        doc.text(ingLine, layout.textX, inner);
        inner += 3.6;
      }
    }

    return y + layout.cardH;
  }

  paintPage();
  drawHeader();
  let y = contentTop;

  const sections = input.sections
    .map((section) => ({
      ...section,
      groups: section.groups.filter((group) => group.dishes.length > 0),
    }))
    .filter((section) => section.groups.length > 0);

  if (sections.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    write(ink);
    doc.text('No hay platos en el menú de hoy.', marginX, y + 4);
  }

  for (let s = 0; s < sections.length; s += 1) {
    const section = sections[s];
    const leadIn = section.layout === 'grid' ? LABEL_H + ROW_H : cardLayout(section.groups[0].dishes[0]).cardH;
    y = ensure(y, PILL_BLOCK + leadIn + 1);
    y = drawPill(section.title, y);

    if (section.layout === 'grid') {
      for (const group of section.groups) {
        const pairs: Array<[DailyMenuPdfDish, DailyMenuPdfDish | null]> = [];
        for (let i = 0; i < group.dishes.length; i += 2) {
          pairs.push([group.dishes[i], group.dishes[i + 1] ?? null]);
        }
        let pendingLabel = true;

        for (const [left, right] of pairs) {
          const needed = (pendingLabel ? LABEL_H : 0) + ROW_H;
          if (y + needed > contentBottom) {
            y = nextPage();
            pendingLabel = true;
          }
          if (pendingLabel) {
            y = drawGroupLabel(group.name, y);
            pendingLabel = false;
          }
          drawGridRow(left, right, y, right === null);
          y += ROW_H + ROW_GAP;
        }
        y += 1.5;
      }
    } else {
      for (const group of section.groups) {
        for (const dish of group.dishes) {
          const cardH = cardLayout(dish).cardH;
          y = ensure(y, cardH);
          y = drawCard(dish, y) + 3;
        }
      }
    }

    if (s < sections.length - 1) y += 3;
  }

  const total = doc.getNumberOfPages();
  for (let page = 1; page <= total; page += 1) {
    doc.setPage(page);
    drawFooter(page, total);
  }

  return doc;
}
