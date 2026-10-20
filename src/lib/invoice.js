function pdfText(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[^\x20-\x7e]/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wrap(value, maxLength = 86) {
  const words = String(value ?? '').split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    if (line && `${line} ${word}`.length > maxLength) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function createPdf(lines) {
  const pageLines = Array.from({ length: Math.ceil(lines.length / 48) }, (_, index) =>
    lines.slice(index * 48, (index + 1) * 48),
  );
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${pageLines.map((_, index) => `${4 + index * 2} 0 R`).join(' ')}] /Count ${pageLines.length} >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];

  pageLines.forEach((page, index) => {
    const pageId = 4 + index * 2;
    const contentId = pageId + 1;
    const commands = [
      'BT',
      '/F1 10 Tf',
      '50 748 Td',
      '14 TL',
      ...page.flatMap((line, lineIndex) => [
        `${lineIndex ? 'T* ' : ''}(${pdfText(line)}) Tj`,
      ]),
      'ET',
    ].join('\n');
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`,
      `<< /Length ${commands.length} >>\nstream\n${commands}\nendstream`,
    );
  });

  let document = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(document.length);
    document += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = document.length;
  document += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    document += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  document += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([document], { type: 'application/pdf' });
}

export function downloadInvoice(order) {
  const date = new Date(order.createdAt).toLocaleDateString('en-IN');
  const address = order.address;
  const lines = [
    'MEGAMART',
    'INVOICE',
    '',
    `Invoice / Order number: ${order.orderNumber}`,
    `Order date: ${date}`,
    `Payment method: ${order.paymentMethod === 'cash_on_delivery' ? 'Cash on delivery' : order.paymentMethod}`,
    '',
    `Deliver to: ${address.fullName}`,
    `Phone: ${address.phone}`,
    ...wrap(`${address.addressLine1} ${address.addressLine2 ?? ''}`),
    ...wrap(`${address.city}, ${address.state} ${address.postalCode}`),
    '',
    'ITEM                                      QTY       UNIT PRICE       AMOUNT',
    ...order.items.flatMap((item) => [
      ...wrap(item.name, 42),
      `                                          ${item.quantity}         INR ${item.unitPrice.toFixed(2)}     INR ${(item.unitPrice * item.quantity).toFixed(2)}`,
    ]),
    '',
    `TOTAL: INR ${order.total.toFixed(2)}`,
    '',
    'Thank you for shopping with MegaMart.',
  ];

  const url = URL.createObjectURL(createPdf(lines));
  const link = document.createElement('a');
  link.href = url;
  link.download = `MegaMart-invoice-${order.orderNumber}.pdf`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
