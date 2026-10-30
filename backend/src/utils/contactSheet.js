/*
 * Reads contacts from a spreadsheet, whatever the layout:
 *  - with headings (full names, short forms, any order)
 *  - without headings
 *  - phone numbers only
 *
 * Input: matrix = array of rows, each row an array of cell values
 *        (XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })).
 */

export function looksLikePhone(value) {
  const text = String(value ?? '').trim();
  if (!text || !/^[\d\s+\-().]+$/.test(text)) return false;
  const digits = text.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15;
}

function cleanHeader(value) {
  return String(value ?? '')
    .replace(/^\uFEFF/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const hasLetters = (value) => /[a-zA-Z\u0900-\u097F]/.test(String(value ?? ''));

// What a heading probably means (names and short forms).
function headerHint(header) {
  if (!header) return null;

  if (/\bsource\b/.test(header)) return 'source';
  if (/\b(opt|opted|consent)\b/.test(header)) return 'consent';
  if (/\b(email|e mail|em|mail|mail id|emailid|eml)\b/.test(header)) return 'email';
  if (/^(s no|sno|sr no|srno|sl no|slno|serial|serial no|sr|id|no|index)$/.test(header)) return 'serial';
  if (/\b(name|nm|patient|customer|student|person|client|member|guest|party)\b/.test(header)) return 'name';
  if (
    /\b(phone|ph|phn|ph no|mob|mobile|mbl|cell|tel|telephone|whatsapp|whats app|wa|wp|wapp|contact|number|num|no)\b/.test(header) ||
    /(phone|mobile|whatsapp|contact)/.test(header)
  ) {
    return 'phone';
  }
  return null;
}

export function parseContactSheet(matrix) {
  const rows = matrix
    .map((cells, i) => ({ cells, rowNumber: i + 1 }))
    .filter(({ cells }) => cells.some((c) => String(c ?? '').trim() !== ''));

  if (rows.length === 0) {
    return { error: 'The spreadsheet contains no contact rows.' };
  }

  // Row 1 is a heading row when no cell in it looks like a phone number.
  const hasHeader = !rows[0].cells.some(looksLikePhone);
  const headers = hasHeader ? rows[0].cells.map(cleanHeader) : [];
  const dataRows = hasHeader ? rows.slice(1) : rows;

  if (dataRows.length === 0) {
    return { error: 'The spreadsheet has headings but no contact rows.' };
  }

  const columnCount = Math.max(...rows.map((r) => r.cells.length));
  const cols = Array.from({ length: columnCount }, (_, c) => c);
  const column = (c) => dataRows.map((r) => r.cells[c]);

  const hints = cols.map((c) => headerHint(headers[c]));
  const phoneScore = cols.map((c) => column(c).filter(looksLikePhone).length);

  // Phone column: best phone-like column among those with a phone heading,
  // otherwise the column with the most phone-like values.
  const bestOf = (candidates) =>
    candidates.sort((a, b) => phoneScore[b] - phoneScore[a])[0];

  let phoneCol = bestOf(cols.filter((c) => hints[c] === 'phone' && phoneScore[c] > 0));
  if (phoneCol === undefined) phoneCol = bestOf(cols.filter((c) => phoneScore[c] > 0));

  if (phoneCol === undefined) {
    return {
      error:
        'No phone number column was found. Each contact needs a phone number of 8 to 15 digits.',
    };
  }

  const isEmailCol = (c) => {
    if (c === phoneCol) return false;
    if (hints[c] === 'email') return true;
    const filled = column(c).filter((v) => String(v ?? '').trim() !== '');
    const withAt = filled.filter((v) => String(v).includes('@'));
    return withAt.length > 0 && withAt.length >= filled.length / 2;
  };
  const emailCol = cols.find(isEmailCol);

  const consentCol = cols.find((c) => hints[c] === 'consent' && c !== phoneCol);
  const sourceCol = cols.find((c) => hints[c] === 'source' && c !== phoneCol);

  const used = new Set([phoneCol, emailCol, consentCol, sourceCol]);
  const textCount = (c) => column(c).filter((v) => hasLetters(v)).length;

  // Name column: by heading, otherwise the first mostly-text column.
  let nameCol = cols.find(
    (c) => !used.has(c) && hints[c] === 'name' && textCount(c) > 0
  );
  if (nameCol === undefined) {
    nameCol = cols.find(
      (c) =>
        !used.has(c) &&
        hints[c] !== 'serial' &&
        textCount(c) > dataRows.length / 2
    );
  }

  const contacts = dataRows.map(({ cells, rowNumber }) => ({
    rowNumber,
    name: String(nameCol !== undefined ? cells[nameCol] ?? '' : '').trim(),
    rawPhone: cells[phoneCol],
    email: String(emailCol !== undefined ? cells[emailCol] ?? '' : '').trim(),
    optedInValue: consentCol !== undefined ? cells[consentCol] : '',
    consentSource: String(
      sourceCol !== undefined ? cells[sourceCol] ?? '' : ''
    ).trim(),
  }));

  return { contacts, hasHeader };
}