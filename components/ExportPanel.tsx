import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import { getTaskStatus } from '../utils/helpers';
import { Download, X, FileSpreadsheet, FileJson, FileText, CheckCircle2 } from 'lucide-react';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { CAPITAL_CATEGORIES, CapitalCategory } from '../types';

interface ExportPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type ExportFormat = 'EXCEL' | 'CSV' | 'JSON';

const ExportPanel: React.FC<ExportPanelProps> = ({ isOpen, onClose }) => {
  const { tasks } = useApp();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [category, setCategory] = useState<CapitalCategory | 'All'>('All');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('EXCEL');

  const getFilteredData = () => {
    let filtered = tasks;

    // Filter by Date
    if (startDate && endDate) {
      filtered = filtered.filter(t => {
        const assigned = parseISO(t.assignedDate);
        return isWithinInterval(assigned, {
          start: startOfDay(parseISO(startDate)),
          end: endOfDay(parseISO(endDate))
        });
      });
    }

    // Filter by Category
    if (category !== 'All') {
      filtered = filtered.filter(t => t.category === category);
    }

    return filtered.map(t => ({
      id: t.id,
      date: t.assignedDate,
      taskName: t.title,
      capital: t.category,
      status: getTaskStatus(t) === 'COMPLETED' ? 'completed' : getTaskStatus(t) === 'FAILED' ? 'failed' : 'pending',
      completedDate: t.completedDate || null,
      notes: t.notes || '',
      duration: t.duration || ''
    }));
  };

  const handleExport = () => {
    const data = getFilteredData();
    const fileName = `capital_compass_export_${format(new Date(), 'yyyyMMdd')}`;

    if (exportFormat === 'EXCEL') {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Tasks");
      XLSX.writeFile(wb, `${fileName}.xlsx`);
    } else if (exportFormat === 'CSV') {
      const ws = XLSX.utils.json_to_sheet(data);
      const csv = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${fileName}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (exportFormat === 'JSON') {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${fileName}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-500" /> Export Data
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        <div className="space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-3">File Format</label>
            <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => setExportFormat('EXCEL')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${exportFormat === 'EXCEL' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
              >
                <FileSpreadsheet className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">Excel</span>
              </button>
              <button 
                onClick={() => setExportFormat('CSV')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${exportFormat === 'CSV' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
              >
                <FileText className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">CSV</span>
              </button>
              <button 
                onClick={() => setExportFormat('JSON')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${exportFormat === 'JSON' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
              >
                <FileJson className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">JSON</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Start Date</label>
                <input 
                  type="date" 
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm dark:text-white focus:ring-2 focus:ring-indigo-500"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">End Date</label>
                <input 
                  type="date" 
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm dark:text-white focus:ring-2 focus:ring-indigo-500"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div>
               <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Category</label>
               <select 
                 className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm dark:text-white focus:ring-2 focus:ring-indigo-500"
                 value={category}
                 onChange={e => setCategory(e.target.value as any)}
               >
                 <option value="All">All Categories</option>
                 {CAPITAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
            </div>
          </div>

          <button 
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
          >
            <Download className="w-5 h-5" />
            Download {exportFormat}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportPanel;