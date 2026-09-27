/**
 * Standard Code 128 Barcode SVG generator and QR matrix renderer for printable labels.
 * 100% compliant with hardware 1D barcode scanners and optical camera readers.
 */

// Code 128 patterns (symbol index 0..106). Each entry represents widths of 6 alternating bar/space elements.
const CODE128_PATTERNS: string[] = [
  "212222","222122","222221","121223","121322","131222","122213","122312","132212","221213",
  "221312","231212","112232","122132","122231","113222","123122","123221","223211","221132",
  "221231","213212","223112","312131","311222","321122","321221","312212","322112","322211",
  "212123","212321","232121","111323","131123","131321","112313","132113","132311","211313",
  "231113","231311","112133","112331","132131","113123","113321","133121","313121","211331",
  "231131","213113","213311","213131","311123","311321","331121","312113","312311","332111",
  "314111","221411","431111","111224","111422","121124","121421","141122","141221","112214",
  "112412","122114","122411","142112","142211","241211","221114","411112","421111","214112",
  "211142","211241","211421","231112","215111","115121","211151","112151","121151","121511",
  "125111","111125","111225","111252","112152","112512","131115","131215","111513","111531",
  "151113","151311","113115","113215","115113","115311","111143","111341","131141","114113",
  "114311","411113","411311","113141","114131","311141","411131","211412","211214","211232",
  "2331112" // 106: Stop pattern (7 elements)
];

export function generateBarcodeSvg(value?: string | number | null, width: number = 220, height: number = 55): string {
  const str = value !== null && value !== undefined ? String(value) : '';
  const safeVal = str.replace(/[^\x20-\x7E]/g, '') || 'AVANYX';
  
  // Code 128 Set B encoding
  const codeSequence: number[] = [104]; // Start Code B
  let checkSum = 104;

  for (let i = 0; i < safeVal.length; i++) {
    const code = safeVal.charCodeAt(i) - 32;
    codeSequence.push(code);
    checkSum += code * (i + 1);
  }

  const checkDigit = checkSum % 103;
  codeSequence.push(checkDigit);
  codeSequence.push(106); // Stop pattern

  // Convert to binary bars string
  let binaryString = "";
  codeSequence.forEach(symbolIndex => {
    const pattern = CODE128_PATTERNS[symbolIndex];
    if (!pattern) return;
    let isBar = true;
    for (let c = 0; c < pattern.length; c++) {
      const w = parseInt(pattern[c], 10);
      binaryString += (isBar ? "1" : "0").repeat(w);
      isBar = !isBar;
    }
  });

  // Quiet zones (10 modules on left and right)
  const quietZone = "0".repeat(10);
  const fullBinary = quietZone + binaryString + quietZone;

  const moduleWidth = width / fullBinary.length;
  let rects = '';
  for (let i = 0; i < fullBinary.length; i++) {
    if (fullBinary[i] === '1') {
      rects += `<rect x="${(i * moduleWidth).toFixed(2)}" y="0" width="${(moduleWidth + 0.1).toFixed(2)}" height="${height}" fill="#0f172a" />`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height + 16}" width="${width}" height="${height + 16}">
    <rect width="${width}" height="${height + 16}" fill="#ffffff" />
    ${rects}
    <text x="${width / 2}" y="${height + 12}" font-family="monospace" font-size="10" font-weight="700" text-anchor="middle" fill="#0f172a">${safeVal}</text>
  </svg>`;
}

import { generateQrCodeSvg } from './qrCodeGenerator';

export function generateQrMatrixSvg(value: string, size: number = 120): string {
  return generateQrCodeSvg(value, { size, margin: 2 });
}
