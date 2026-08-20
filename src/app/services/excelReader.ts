// Binary Excel (.xlsx, .xls, .ods, .csv) & Document Parser for Thư Ký Kim
// Uses SheetJS (xlsx) to parse binary spreadsheet files into structured JSON, Markdown tables, and statistical summaries

import * as XLSX from 'xlsx';

export interface ParsedSheetData {
  sheetName: string;
  totalRows: number;
  totalCols: number;
  headers: string[];
  rows: (string | number)[][];
  jsonData: Record<string, any>[];
  markdownTable: string;
  columnStats: Record<string, { count: number; sum: number; mean: number; min: number; max: number }>;
}

export interface ParsedExcelWorkbook {
  filename: string;
  sheetNames: string[];
  totalSheets: number;
  sheets: Record<string, ParsedSheetData>;
  fullMarkdown: string;
  textSummary: string;
  rawCsv: string;
}

/**
 * Parse an Excel file (File object, ArrayBuffer, or Base64 string) into structured data
 */
export async function parseExcelFile(
  input: File | ArrayBuffer | Uint8Array | string,
  filename: string = 'workbook.xlsx'
): Promise<ParsedExcelWorkbook> {
  let arrayBuffer: ArrayBuffer;

  if (input instanceof File) {
    filename = input.name;
    arrayBuffer = await input.arrayBuffer();
  } else if (input instanceof ArrayBuffer) {
    arrayBuffer = input;
  } else if (input instanceof Uint8Array) {
    arrayBuffer = input.buffer as ArrayBuffer;
  } else if (typeof input === 'string') {
    // If it's a data URL or base64
    if (input.startsWith('data:')) {
      const base64 = input.split(',')[1];
      const binaryStr = atob(base64);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      arrayBuffer = bytes.buffer;
    } else {
      // Plain text CSV or string
      const workbook = XLSX.read(input, { type: 'string' });
      return processWorkbook(workbook, filename);
    }
  } else {
    throw new Error('Định dạng dữ liệu không hợp lệ.');
  }

  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  return processWorkbook(workbook, filename);
}

/**
 * Internal processor for SheetJS Workbook
 */
function processWorkbook(workbook: XLSX.WorkBook, filename: string): ParsedExcelWorkbook {
  const sheetNames = workbook.SheetNames || [];
  const sheets: Record<string, ParsedSheetData> = {};
  let fullMarkdown = `# BẢNG TÍNH EXCEL: ${filename}\nTổng số trang tính (Sheets): ${sheetNames.length}\n\n`;
  let textSummary = `Bảng tính "${filename}" gồm ${sheetNames.length} sheet: ${sheetNames.join(', ')}.\n`;
  let rawCsvCombined = '';

  for (const name of sheetNames) {
    const sheet = workbook.Sheets[name];
    if (!sheet) continue;

    // Convert to 2D Array
    const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    // Convert to JSON objects
    const jsonData: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    // Convert to CSV
    const csv = XLSX.utils.sheet_to_csv(sheet);
    rawCsvCombined += `--- SHEET: ${name} ---\n${csv}\n\n`;

    const headers: string[] = rawRows.length > 0 ? rawRows[0].map((h: any) => String(h || '').trim()) : [];
    const dataRows = rawRows.slice(1);

    // Compute numerical column statistics
    const columnStats: Record<string, { count: number; sum: number; mean: number; min: number; max: number }> = {};
    if (jsonData.length > 0) {
      headers.forEach(header => {
        const nums = jsonData
          .map(row => Number(row[header]))
          .filter(val => !isNaN(val) && val !== null && val !== undefined);

        if (nums.length > 0) {
          const sum = nums.reduce((a, b) => a + b, 0);
          const mean = sum / nums.length;
          const min = Math.min(...nums);
          const max = Math.max(...nums);
          columnStats[header] = {
            count: nums.length,
            sum: Math.round(sum * 100) / 100,
            mean: Math.round(mean * 100) / 100,
            min,
            max,
          };
        }
      });
    }

    // Build Markdown Table (max 50 rows preview for performance)
    let md = `## 📄 Sheet: ${name} (${dataRows.length} dòng dữ liệu, ${headers.length} cột)\n\n`;
    if (headers.length > 0) {
      md += `| ${headers.join(' | ')} |\n`;
      md += `| ${headers.map(() => '---').join(' | ')} |\n`;

      const previewRows = dataRows.slice(0, 50);
      for (const row of previewRows) {
        const formattedCells = headers.map((_, idx) => {
          const val = row[idx];
          if (val === undefined || val === null || val === '') return '-';
          if (typeof val === 'number') return val.toLocaleString('vi-VN');
          return String(val).replace(/\|/g, '\\|').trim();
        });
        md += `| ${formattedCells.join(' | ')} |\n`;
      }

      if (dataRows.length > 50) {
        md += `\n*(Đã hiển thị 50/${dataRows.length} dòng đầu tiên của sheet ${name})*\n`;
      }
    } else {
      md += `*(Trang tính trống hoặc không có tiêu đề)*\n`;
    }

    // Add stats summary to markdown if any
    const statKeys = Object.keys(columnStats);
    if (statKeys.length > 0) {
      md += `\n**Thống kê số liệu sheet "${name}":**\n`;
      statKeys.forEach(k => {
        const st = columnStats[k];
        md += `- Cột **${k}**: Tổng = ${st.sum.toLocaleString('vi-VN')} | Trung bình = ${st.mean.toLocaleString('vi-VN')} | Min = ${st.min.toLocaleString('vi-VN')} | Max = ${st.max.toLocaleString('vi-VN')}\n`;
      });
    }

    md += `\n---\n\n`;
    fullMarkdown += md;

    sheets[name] = {
      sheetName: name,
      totalRows: dataRows.length,
      totalCols: headers.length,
      headers,
      rows: dataRows,
      jsonData,
      markdownTable: md,
      columnStats,
    };
  }

  return {
    filename,
    sheetNames,
    totalSheets: sheetNames.length,
    sheets,
    fullMarkdown,
    textSummary,
    rawCsv: rawCsvCombined,
  };
}

/**
 * Universal File Reader that handles both Text & Binary (.xlsx, .xls, .ods, .csv, .json, .txt)
 */
export async function readUploadedFile(file: File): Promise<{
  name: string;
  size: number;
  type: string;
  content: string;
  excelData?: ParsedExcelWorkbook;
}> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const isExcel = ext === 'xlsx' || ext === 'xls' || ext === 'ods' || ext === 'csv' || ext === 'xlsm';

  if (isExcel) {
    const excelParsed = await parseExcelFile(file);
    return {
      name: file.name,
      size: file.size,
      type: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      content: excelParsed.fullMarkdown,
      excelData: excelParsed,
    };
  }

  // Text / Code / JSON / Markdown
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      resolve({
        name: file.name,
        size: file.size,
        type: file.type || 'text/plain',
        content: (e.target?.result as string) || '',
      });
    };
    reader.onerror = err => reject(err);
    reader.readAsText(file);
  });
}
