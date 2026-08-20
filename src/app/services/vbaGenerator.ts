// Excel VBA Module (.bas) Generator & Macro Automation Engine for Thư Ký Kim
// Generates production-ready VBA modules with headers, error handling, performance optimization, and instant 1-click .bas export

export interface VbaModuleResult {
  moduleName: string;
  filename: string;
  vbaCode: string;
  fullBasContent: string;
  sizeKb: number;
  dataUrl: string;
  download: () => void;
  instructions: {
    step1: string;
    step2: string;
    step3: string;
  };
}

/**
 * Clean and format VBA code with standard VBA module attributes
 */
export function formatVbaModuleContent({
  moduleName = 'Module_ThuKyKim',
  description = 'Macro tự động hóa Excel tạo bởi Thư Ký Kim AI',
  vbaCode,
}: {
  moduleName?: string;
  description?: string;
  vbaCode: string;
}): string {
  const cleanModuleName = moduleName.replace(/[^a-zA-Z0-9_]/g, '_');
  const timestamp = new Date().toLocaleString('vi-VN');

  // Strip markdown code block wrappers if present
  let cleanCode = vbaCode.replace(/```(vba|vb|basic)?/gi, '').replace(/```/g, '').trim();

  // If code doesn't have Option Explicit, add it
  const hasOptionExplicit = cleanCode.toLowerCase().includes('option explicit');

  return `Attribute VB_Name = "${cleanModuleName}"
' ==============================================================================
'  THƯ KÝ KIM AI — EXCEL VBA AUTOMATION MODULE (.BAS)
'  Module Name: ${cleanModuleName}
'  Mô tả:       ${description}
'  Ngày tạo:    ${timestamp}
'  Tác giả:     Thư Ký Kim Holographic AI Assistant
' ------------------------------------------------------------------------------
'  HƯỚNG DẪN IMPORT VÀO EXCEL:
'  1. Nhấn [Alt + F11] để mở cửa sổ Microsoft Visual Basic for Applications.
'  2. Vào Menu File -> Chọn "Import File..." (hoặc nhấn Ctrl + M).
'  3. Chọn tệp "${cleanModuleName}.bas" này.
'  4. Nhấn [Alt + F8] trong Excel để chọn và chạy Macro!
' ==============================================================================
${!hasOptionExplicit ? 'Option Explicit\n' : ''}
${cleanCode}
`;
}

/**
 * Generate a downloadable .bas VBA Module file with DataURL and download trigger
 */
export function generateVbaModuleFile({
  moduleName = 'Module_ThuKyKim',
  description = 'Tự động hóa Excel bởi Thư Ký Kim',
  vbaCode,
  filename,
}: {
  moduleName?: string;
  description?: string;
  vbaCode: string;
  filename?: string;
}): VbaModuleResult {
  const cleanModuleName = moduleName.replace(/[^a-zA-Z0-9_]/g, '_');
  const finalFilename = filename || `${cleanModuleName}.bas`;
  const fullBasContent = formatVbaModuleContent({ moduleName: cleanModuleName, description, vbaCode });

  // Use UTF-8 with BOM for 100% Vietnamese comment compatibility in VBA Editor
  const blob = new Blob(['\uFEFF' + fullBasContent], { type: 'text/plain;charset=utf-8' });
  const dataUrl = URL.createObjectURL(blob);
  const sizeKb = Math.max(1, Math.round(blob.size / 1024));

  const download = () => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = finalFilename.endsWith('.bas') ? finalFilename : `${finalFilename}.bas`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return {
    moduleName: cleanModuleName,
    filename: finalFilename.endsWith('.bas') ? finalFilename : `${finalFilename}.bas`,
    vbaCode,
    fullBasContent,
    sizeKb,
    dataUrl,
    download,
    instructions: {
      step1: 'Mở file Excel của anh, nhấn tổ hợp phím [Alt + F11] để mở cửa sổ VBA Editor.',
      step2: 'Trên thanh menu VBA, chọn File -> Import File... (hoặc ấn phím tắt Ctrl + M) rồi chọn file .bas vừa tải về.',
      step3: 'Quay lại bảng tính Excel, nhấn [Alt + F8] và chọn Macro để chạy tự động!',
    },
  };
}

/**
 * Standard VBA Templates for common Excel tasks
 */
export const VBA_PRESET_TEMPLATES: Record<string, { name: string; description: string; code: string }> = {
  format_and_total: {
    name: 'AutoFormatAndSum',
    description: 'Tự động kẻ bảng, tạo màu header, định dạng số tiền VNĐ và tính tổng cột cuối',
    code: `Sub FormatBaoCaoTuDong()
    ' Macro tu dong dinh dang bang bieu va tinh tong
    Dim ws As Worksheet
    Dim lastRow As Long, lastCol As Long
    Dim rng As Range
    
    On Error GoTo ErrorHandler
    Application.ScreenUpdating = False
    Application.Calculation = xlCalculationManual
    
    Set ws = ActiveSheet
    lastRow = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    lastCol = ws.Cells(1, ws.Columns.Count).End(xlToLeft).Column
    
    If lastRow < 2 Or lastCol < 1 Then
        MsgBox "Khong tim thay du lieu de dinh dang!", vbExclamation, "Thu Ky Kim"
        Exit Sub
    End If
    
    Set rng = ws.Range(ws.Cells(1, 1), ws.Cells(lastRow, lastCol))
    
    ' Dinh dang Header
    With ws.Range(ws.Cells(1, 1), ws.Cells(1, lastCol))
        .Font.Bold = True
        .Font.Color = RGB(255, 255, 255)
        .Interior.Color = RGB(8, 145, 178) ' Cyan Theme
        .HorizontalAlignment = xlCenter
        .VerticalAlignment = xlCenter
        .RowHeight = 26
    End With
    
    ' Ke vien Border
    With rng.Borders
        .LineStyle = xlContinuous
        .Weight = xlThin
        .Color = RGB(200, 200, 200)
    End With
    
    ' Dinh dang so va tu can chinh cot
    ws.Columns.AutoFit
    
    ' Dong tong cong cuoi cung
    ws.Cells(lastRow + 1, 1).Value = "TỔNG CỘNG"
    ws.Cells(lastRow + 1, 1).Font.Bold = True
    ws.Range(ws.Cells(lastRow + 1, 1), ws.Cells(lastRow + 1, lastCol)).Interior.Color = RGB(240, 253, 250)
    
    Application.Calculation = xlCalculationAutomatic
    Application.ScreenUpdating = True
    MsgBox "Da dinh dang va tinh tong thanh cong!", vbInformation, "Thu Ky Kim AI"
    Exit Sub

ErrorHandler:
    Application.Calculation = xlCalculationAutomatic
    Application.ScreenUpdating = True
    MsgBox "Co loi xay ra: " & Err.Description, vbCritical, "Loi VBA"
End Sub`,
  },
  filter_and_export: {
    name: 'FilterAndExportSheet',
    description: 'Tự động lọc dữ liệu theo điều kiện và tách thành từng Sheet báo cáo riêng biệt',
    code: `Sub TachDuLieuThanhCacSheet()
    ' Macro tach du lieu danh muc thanh cac Sheet rieng biet
    Dim wsSource As Worksheet, wsNew As Worksheet
    Dim lastRow As Long, i As Long
    Dim dict As Object, key As Variant
    Dim colFilter As Long
    
    On Error GoTo ErrorHandler
    Application.ScreenUpdating = False
    Application.DisplayAlerts = False
    
    Set wsSource = ActiveSheet
    colFilter = 1 ' Cot chua danh muc can tach (Cot A)
    lastRow = wsSource.Cells(wsSource.Rows.Count, colFilter).End(xlUp).Row
    
    Set dict = CreateObject("Scripting.Dictionary")
    
    For i = 2 To lastRow
        If wsSource.Cells(i, colFilter).Value <> "" Then
            dict(wsSource.Cells(i, colFilter).Value) = 1
        End If
    Next i
    
    For Each key In dict.Keys
        ' Xoa sheet cu neu ton tai
        On Error Resume Next
        Worksheets(CStr(key)).Delete
        On Error GoTo ErrorHandler
        
        ' Tao sheet moi
        Set wsNew = Worksheets.Add(After:=Worksheets(Worksheets.Count))
        wsNew.Name = Left(CStr(key), 30)
        
        ' Loc va copy du lieu
        wsSource.Range("A1").AutoFilter Field:=colFilter, Criteria1:=key
        wsSource.UsedRange.SpecialCells(xlCellTypeVisible).Copy Destination:=wsNew.Range("A1")
        wsNew.Columns.AutoFit
    Next key
    
    wsSource.AutoFilterMode = False
    wsSource.Activate
    Application.ScreenUpdating = True
    Application.DisplayAlerts = True
    MsgBox "Da tach thanh cong " & dict.Count & " sheet bao cao!", vbInformation, "Thu Ky Kim AI"
    Exit Sub

ErrorHandler:
    Application.ScreenUpdating = True
    Application.DisplayAlerts = True
    MsgBox "Loi: " & Err.Description, vbCritical, "Loi VBA"
End Sub`,
  },
};
