import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import { Task, CapitalCategory, CAPITAL_CATEGORIES } from '../types';
import { Upload, X, FileSpreadsheet, AlertCircle, CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import { format, parse, isValid } from 'date-fns';

interface ImportPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ImportSummary {
  total: number;
  valid: number;
  skipped: number;
  duplicates: number;
}

const ImportPanel: React.FC<ImportPanelProps> = ({ isOpen, onClose }) => {
  const { tasks, addTask } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<Task[]>([]);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) processFile(files[0]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const normalizeDate = (dateVal: any): string | null => {
    if (!dateVal) return null;
    try {
      // Handle Excel numeric dates
      if (typeof dateVal === 'number') {
        const date = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
        return format(date, 'yyyy-MM-dd');
      }
      // Handle string formats
      const d = new Date(dateVal);
      if (isValid(d)) return format(d, 'yyyy-MM-dd');
      
      // Attempt parse YYYY-MM-DD
      if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) return dateVal;
      
    } catch (e) {
      return null;
    }
    return null;
  };

  const normalizeCapital = (cap: string): CapitalCategory => {
    const normalized = cap.trim();
    // Case insensitive match
    const found = CAPITAL_CATEGORIES.find(c => c.toLowerCase() === normalized.toLowerCase());
    return found || 'Skill'; // Default fallback
  };

  const processFile = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setPreviewData([]);
    setSummary(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        let jsonData: any[] = [];

        if (file.name.endsWith('.json')) {
            jsonData = JSON.parse(data as string);
        } else {
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        }

        if (!Array.isArray(jsonData) || jsonData.length === 0) {
          throw new Error("File is empty or invalid format.");
        }

        // Validate headers roughly
        const firstRow = jsonData[0];
        const hasDate = 'date' in firstRow || 'assignedDate' in firstRow || 'Date' in firstRow;
        const hasTask = 'taskName' in firstRow || 'title' in firstRow || 'Task Title' in firstRow;

        if (!hasDate || !hasTask) {
          throw new Error("Missing required columns: 'date' and 'taskName' (or 'title').");
        }

        const newTasks: Task[] = [];
        let duplicates = 0;
        let skipped = 0;

        jsonData.forEach((row: any) => {
          // Mapping Logic
          const title = row.taskName || row.title || row['Task Title'] || 'Untitled Task';
          const rawDate = row.date || row.assignedDate || row['Date'] || row['Assigned Date'];
          const categoryRaw = row.capital || row.category || row['Category'] || row['Capital'] || 'Skill';
          const statusRaw = row.status || row.Status || 'pending';
          const notes = row.notes || row.Notes || '';
          const duration = row.duration || row.Duration || '';
          
          const dateStr = normalizeDate(rawDate);
          if (!dateStr) {
            skipped++;
            return;
          }

          const category = normalizeCapital(categoryRaw);
          const isCompleted = statusRaw.toLowerCase().includes('complete');
          
          // Duplicate Check: Same Title + Same Date + Same Category
          const exists = tasks.some(t => 
             t.title.toLowerCase() === title.toLowerCase() && 
             t.assignedDate === dateStr &&
             t.category === category
          );

          if (exists) {
            duplicates++;
            return;
          }

          newTasks.push({
            id: crypto.randomUUID(),
            title: String(title),
            category: category,
            assignedDate: dateStr,
            completedDate: isCompleted ? dateStr : null,
            notes: String(notes),
            duration: String(duration),
            createdAt: Date.now()
          });
        });

        setPreviewData(newTasks);
        setSummary({
          total: jsonData.length,
          valid: newTasks.length,
          skipped,
          duplicates
        });

      } catch (err: any) {
        setError(err.message || "Failed to parse file.");
      } finally {
        setIsLoading(false);
      }
    };

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
        reader.readAsBinaryString(file);
    } else if (file.name.endsWith('.json')) {
        reader.readAsText(file);
    } else {
        setError("Unsupported file format. Please use .xlsx, .csv, or .json");
        setIsLoading(false);
    }
  };

  const confirmImport = () => {
    previewData.forEach(t => addTask(t));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-500" /> Import Tasks
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Supports Excel, CSV, and JSON</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!previewData.length && !summary ? (
            <div 
              className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer
                ${isDragging ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10' : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500'}
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                 <FileSpreadsheet className="w-8 h-8 text-indigo-500" />
              </div>
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Click or drag file to upload</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-4">
                Accepted formats: .xlsx, .csv, .json. Ensure columns like "date", "taskName", "capital" exist.
              </p>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".xlsx,.xls,.csv,.json" 
                onChange={handleFileSelect}
              />
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                Select File
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Stats */}
              {summary && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 p-4 rounded-xl">
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{summary.valid}</div>
                    <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-500 uppercase">To Import</div>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-4 rounded-xl">
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{summary.duplicates}</div>
                    <div className="text-xs font-semibold text-amber-700 dark:text-amber-500 uppercase">Duplicates (Skip)</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl">
                     <div className="text-2xl font-bold text-slate-600 dark:text-slate-400">{summary.total}</div>
                     <div className="text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase">Total Rows</div>
                  </div>
                </div>
              )}

              {/* Preview Table */}
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Preview (First 5 Items)</h4>
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                      <tr>
                        <th className="px-4 py-2">Date</th>
                        <th className="px-4 py-2">Capital</th>
                        <th className="px-4 py-2">Task</th>
                        <th className="px-4 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {previewData.slice(0, 5).map((task) => (
                        <tr key={task.id} className="bg-white dark:bg-slate-900">
                           <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{task.assignedDate}</td>
                           <td className="px-4 py-2 text-slate-700 dark:text-slate-300">
                             <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium">{task.category}</span>
                           </td>
                           <td className="px-4 py-2 text-slate-900 dark:text-white font-medium">{task.title}</td>
                           <td className="px-4 py-2">
                             {task.completedDate ? (
                               <span className="text-emerald-500 flex items-center gap-1 text-xs font-bold"><CheckCircle className="w-3 h-3" /> Done</span>
                             ) : (
                               <span className="text-slate-400 text-xs">Pending</span>
                             )}
                           </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {previewData.length > 5 && (
                    <div className="p-2 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50">
                      ...and {previewData.length - 5} more
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/30 rounded-xl flex items-center gap-3 text-rose-600 dark:text-rose-400">
               <AlertCircle className="w-5 h-5 flex-shrink-0" />
               <p className="text-sm">{error}</p>
            </div>
          )}

          {isLoading && (
            <div className="mt-4 flex items-center justify-center gap-2 text-indigo-500">
               <Loader2 className="w-5 h-5 animate-spin" />
               <span className="text-sm font-medium">Processing File...</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          {previewData.length > 0 && (
            <button 
              onClick={confirmImport}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              Import {previewData.length} Tasks <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportPanel;