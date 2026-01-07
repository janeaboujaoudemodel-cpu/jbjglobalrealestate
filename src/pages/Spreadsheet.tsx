import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Bold, 
  Italic, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Plus,
  Trash2,
  Download,
  Upload,
  Undo,
  Redo,
  Copy,
  Clipboard,
  FileSpreadsheet
} from "lucide-react";
import { toast } from "sonner";
import MainLayout from "@/components/MainLayout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CellData {
  value: string;
  formula?: string;
  bold?: boolean;
  italic?: boolean;
  align?: 'left' | 'center' | 'right';
}

type SpreadsheetData = Record<string, CellData>;

const INITIAL_ROWS = 50;
const INITIAL_COLS = 26;

const getColumnLabel = (index: number): string => {
  let label = '';
  while (index >= 0) {
    label = String.fromCharCode(65 + (index % 26)) + label;
    index = Math.floor(index / 26) - 1;
  }
  return label;
};

const getCellId = (row: number, col: number): string => {
  return `${getColumnLabel(col)}${row + 1}`;
};

const Spreadsheet = () => {
  const [data, setData] = useState<SpreadsheetData>({});
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [rows, setRows] = useState(INITIAL_ROWS);
  const [cols, setCols] = useState(INITIAL_COLS);
  const [history, setHistory] = useState<SpreadsheetData[]>([{}]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [clipboard, setClipboard] = useState<CellData | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const formulaInputRef = useRef<HTMLInputElement>(null);

  const saveToHistory = useCallback((newData: SpreadsheetData) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newData);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const evaluateFormula = useCallback((formula: string, currentData: SpreadsheetData): string => {
    if (!formula.startsWith('=')) return formula;
    
    try {
      let expression = formula.substring(1).toUpperCase();
      
      // Handle SUM function
      const sumMatch = expression.match(/SUM\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)/);
      if (sumMatch) {
        const [, startCol, startRow, endCol, endRow] = sumMatch;
        let sum = 0;
        const startColIndex = startCol.charCodeAt(0) - 65;
        const endColIndex = endCol.charCodeAt(0) - 65;
        for (let r = parseInt(startRow); r <= parseInt(endRow); r++) {
          for (let c = startColIndex; c <= endColIndex; c++) {
            const cellId = getCellId(r - 1, c);
            const cellValue = parseFloat(currentData[cellId]?.value || '0');
            if (!isNaN(cellValue)) sum += cellValue;
          }
        }
        return sum.toString();
      }
      
      // Handle AVERAGE function
      const avgMatch = expression.match(/AVERAGE\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)/);
      if (avgMatch) {
        const [, startCol, startRow, endCol, endRow] = avgMatch;
        let sum = 0;
        let count = 0;
        const startColIndex = startCol.charCodeAt(0) - 65;
        const endColIndex = endCol.charCodeAt(0) - 65;
        for (let r = parseInt(startRow); r <= parseInt(endRow); r++) {
          for (let c = startColIndex; c <= endColIndex; c++) {
            const cellId = getCellId(r - 1, c);
            const cellValue = parseFloat(currentData[cellId]?.value || '0');
            if (!isNaN(cellValue)) {
              sum += cellValue;
              count++;
            }
          }
        }
        return count > 0 ? (sum / count).toString() : '0';
      }
      
      // Replace cell references with values
      expression = expression.replace(/([A-Z]+)(\d+)/g, (match) => {
        const cellValue = currentData[match]?.value || '0';
        return isNaN(parseFloat(cellValue)) ? '0' : cellValue;
      });
      
      // Evaluate simple math expressions
      const result = Function(`"use strict"; return (${expression})`)();
      return result.toString();
    } catch {
      return '#ERROR';
    }
  }, []);

  const updateCell = useCallback((cellId: string, value: string) => {
    const newData = { ...data };
    const existingCell = newData[cellId] || { value: '' };
    
    if (value.startsWith('=')) {
      newData[cellId] = {
        ...existingCell,
        value: evaluateFormula(value, newData),
        formula: value
      };
    } else {
      newData[cellId] = {
        ...existingCell,
        value,
        formula: undefined
      };
    }
    
    setData(newData);
    saveToHistory(newData);
  }, [data, evaluateFormula, saveToHistory]);

  const handleCellClick = (cellId: string) => {
    setSelectedCell(cellId);
    setEditingCell(null);
  };

  const handleCellDoubleClick = (cellId: string) => {
    setSelectedCell(cellId);
    setEditingCell(cellId);
    const cell = data[cellId];
    setEditValue(cell?.formula || cell?.value || '');
  };

  const handleCellBlur = () => {
    if (editingCell && editValue !== undefined) {
      updateCell(editingCell, editValue);
    }
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellBlur();
      // Move to next row
      if (selectedCell) {
        const match = selectedCell.match(/([A-Z]+)(\d+)/);
        if (match) {
          const [, col, row] = match;
          const nextCell = `${col}${parseInt(row) + 1}`;
          setSelectedCell(nextCell);
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleCellBlur();
      // Move to next column
      if (selectedCell) {
        const match = selectedCell.match(/([A-Z]+)(\d+)/);
        if (match) {
          const [, col, row] = match;
          const colIndex = col.charCodeAt(0) - 65;
          if (colIndex < cols - 1) {
            const nextCell = `${getColumnLabel(colIndex + 1)}${row}`;
            setSelectedCell(nextCell);
          }
        }
      }
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const toggleBold = () => {
    if (!selectedCell) return;
    const newData = { ...data };
    const cell = newData[selectedCell] || { value: '' };
    newData[selectedCell] = { ...cell, bold: !cell.bold };
    setData(newData);
    saveToHistory(newData);
  };

  const toggleItalic = () => {
    if (!selectedCell) return;
    const newData = { ...data };
    const cell = newData[selectedCell] || { value: '' };
    newData[selectedCell] = { ...cell, italic: !cell.italic };
    setData(newData);
    saveToHistory(newData);
  };

  const setAlignment = (align: 'left' | 'center' | 'right') => {
    if (!selectedCell) return;
    const newData = { ...data };
    const cell = newData[selectedCell] || { value: '' };
    newData[selectedCell] = { ...cell, align };
    setData(newData);
    saveToHistory(newData);
  };

  const addRow = () => {
    setRows(rows + 1);
    toast.success("Row added");
  };

  const addColumn = () => {
    setCols(cols + 1);
    toast.success("Column added");
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setData(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setData(history[historyIndex + 1]);
    }
  };

  const copyCell = () => {
    if (!selectedCell || !data[selectedCell]) return;
    setClipboard(data[selectedCell]);
    toast.success("Cell copied");
  };

  const pasteCell = () => {
    if (!selectedCell || !clipboard) return;
    const newData = { ...data };
    newData[selectedCell] = { ...clipboard };
    setData(newData);
    saveToHistory(newData);
    toast.success("Cell pasted");
  };

  const exportToCSV = () => {
    let csv = '';
    for (let r = 0; r < rows; r++) {
      const rowData: string[] = [];
      for (let c = 0; c < cols; c++) {
        const cellId = getCellId(r, c);
        const value = data[cellId]?.value || '';
        rowData.push(`"${value.replace(/"/g, '""')}"`);
      }
      csv += rowData.join(',') + '\n';
    }
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'spreadsheet.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported to CSV");
  };

  const importCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const newData: SpreadsheetData = {};
      
      lines.forEach((line, rowIndex) => {
        const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
        values.forEach((value, colIndex) => {
          const cleanValue = value.replace(/^"|"$/g, '').replace(/""/g, '"');
          if (cleanValue) {
            const cellId = getCellId(rowIndex, colIndex);
            newData[cellId] = { value: cleanValue };
          }
        });
      });
      
      setData(newData);
      saveToHistory(newData);
      setRows(Math.max(rows, lines.length));
      toast.success("CSV imported successfully");
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingCell]);

  const selectedCellData = selectedCell ? data[selectedCell] : null;

  return (
    <MainLayout>
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-full mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-4">
            <FileSpreadsheet className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Spreadsheet</h1>
          </div>

          {/* Toolbar */}
          <div className="bg-card border border-border rounded-lg p-2 mb-4 flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" onClick={undo} disabled={historyIndex <= 0}>
              <Undo className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}>
              <Redo className="h-4 w-4" />
            </Button>
            
            <div className="w-px h-6 bg-border mx-1" />
            
            <Button 
              variant={selectedCellData?.bold ? "secondary" : "ghost"} 
              size="sm" 
              onClick={toggleBold}
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button 
              variant={selectedCellData?.italic ? "secondary" : "ghost"} 
              size="sm" 
              onClick={toggleItalic}
            >
              <Italic className="h-4 w-4" />
            </Button>
            
            <div className="w-px h-6 bg-border mx-1" />
            
            <Button 
              variant={selectedCellData?.align === 'left' ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => setAlignment('left')}
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant={selectedCellData?.align === 'center' ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => setAlignment('center')}
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button 
              variant={selectedCellData?.align === 'right' ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => setAlignment('right')}
            >
              <AlignRight className="h-4 w-4" />
            </Button>
            
            <div className="w-px h-6 bg-border mx-1" />
            
            <Button variant="ghost" size="sm" onClick={copyCell}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={pasteCell}>
              <Clipboard className="h-4 w-4" />
            </Button>
            
            <div className="w-px h-6 bg-border mx-1" />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Insert
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={addRow}>Add Row</DropdownMenuItem>
                <DropdownMenuItem onClick={addColumn}>Add Column</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div className="flex-1" />
            
            <Button variant="ghost" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-1" /> Export
            </Button>
            <label>
              <Button variant="ghost" size="sm" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-1" /> Import
                </span>
              </Button>
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                onChange={importCSV}
              />
            </label>
          </div>

          {/* Formula Bar */}
          <div className="bg-card border border-border rounded-lg p-2 mb-4 flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground w-16">
              {selectedCell || 'A1'}
            </span>
            <div className="w-px h-6 bg-border" />
            <Input
              ref={formulaInputRef}
              value={selectedCell ? (data[selectedCell]?.formula || data[selectedCell]?.value || '') : ''}
              onChange={(e) => {
                if (selectedCell) {
                  setEditValue(e.target.value);
                  updateCell(selectedCell, e.target.value);
                }
              }}
              placeholder="Enter value or formula (e.g., =SUM(A1:A10))"
              className="flex-1 border-0 focus-visible:ring-0"
            />
          </div>

          {/* Spreadsheet */}
          <div className="bg-card border border-border rounded-lg overflow-auto max-h-[70vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 bg-muted text-center sticky left-0 z-10">#</TableHead>
                  {Array.from({ length: cols }).map((_, i) => (
                    <TableHead 
                      key={i} 
                      className="min-w-[100px] bg-muted text-center border-l border-border"
                    >
                      {getColumnLabel(i)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: rows }).map((_, rowIndex) => (
                  <TableRow key={rowIndex}>
                    <TableCell className="bg-muted text-center font-medium sticky left-0 z-10">
                      {rowIndex + 1}
                    </TableCell>
                    {Array.from({ length: cols }).map((_, colIndex) => {
                      const cellId = getCellId(rowIndex, colIndex);
                      const cell = data[cellId];
                      const isSelected = selectedCell === cellId;
                      const isEditing = editingCell === cellId;
                      
                      return (
                        <TableCell
                          key={colIndex}
                          className={`
                            min-w-[100px] p-0 border-l border-border cursor-cell
                            ${isSelected ? 'ring-2 ring-primary ring-inset' : ''}
                          `}
                          onClick={() => handleCellClick(cellId)}
                          onDoubleClick={() => handleCellDoubleClick(cellId)}
                        >
                          {isEditing ? (
                            <Input
                              ref={inputRef}
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={handleCellBlur}
                              onKeyDown={handleKeyDown}
                              className="h-8 border-0 rounded-none focus-visible:ring-0"
                            />
                          ) : (
                            <div 
                              className={`
                                px-2 py-1 min-h-[32px] text-sm
                                ${cell?.bold ? 'font-bold' : ''}
                                ${cell?.italic ? 'italic' : ''}
                                ${cell?.align === 'center' ? 'text-center' : ''}
                                ${cell?.align === 'right' ? 'text-right' : ''}
                              `}
                            >
                              {cell?.value || ''}
                            </div>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Help Text */}
          <div className="mt-4 text-sm text-muted-foreground">
            <p><strong>Tips:</strong> Double-click to edit • Use formulas like =SUM(A1:A10), =AVERAGE(B1:B5), =A1+B1 • Press Tab to move right, Enter to move down</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Spreadsheet;
