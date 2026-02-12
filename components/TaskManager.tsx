import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Task, CAPITAL_CATEGORIES, CapitalCategory } from '../types';
import { getTaskStatus } from '../utils/helpers';
import { Search, Filter, Plus, Upload, Download, Trash2, Check, X, Edit2, CheckCircle, XCircle, Calendar, ChevronDown, Layers, Activity, ArrowUpDown, Bell, Square, CheckSquare } from 'lucide-react';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import TaskModal from './TaskModal';
import { CategoryIcon } from './CategoryIcon';

interface TaskManagerProps {
  onOpenExport?: () => void;
  onOpenImport?: () => void;
}

// Reusable Custom Dropdown Component with Animation
interface DropdownProps {
  label: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
  icon?: React.ReactNode;
  renderOption?: (opt: string) => React.ReactNode;
  alignRight?: boolean;
}

const CustomDropdown: React.FC<DropdownProps> = ({ label, value, options, onChange, icon, renderOption, alignRight }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const displayValue = value === 'All' ? label : value;

  return (
    <div className="relative w-full" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-2.5 bg-white dark:bg-slate-900 border rounded-xl text-sm transition-all duration-200 ${isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}
      >
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
          {icon}
          <span className="font-medium truncate">{displayValue}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <div 
        className={`absolute z-50 ${alignRight ? 'right-0' : 'left-0'} ${alignRight ? 'w-48' : 'right-0'} top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden transition-all duration-200 ease-out origin-top ${
          isOpen ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
        }`}
      >
        <div className="p-1 max-h-64 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setIsOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                value === opt 
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                 {renderOption ? renderOption(opt) : (
                   <span>{opt === 'All' ? 'All' : opt}</span>
                 )}
              </div>
              {value === opt && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

type SortOption = 'Date (Newest)' | 'Date (Oldest)' | 'Title (A-Z)' | 'Category';

const TaskManager: React.FC<TaskManagerProps> = ({ onOpenExport, onOpenImport }) => {
  const { tasks, deleteTask, addTask, updateTask } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortOption, setSortOption] = useState<SortOption>('Date (Newest)');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  
  // Selection State
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());

  // Edit State
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    date: '',
    category: 'Skill' as CapitalCategory,
    duration: '',
    notes: '',
    reminder: ''
  });
  
  const filteredTasks = useMemo(() => {
    let result = tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || task.category === selectedCategory;
      
      const status = getTaskStatus(task);
      let matchesStatus = true;
      if (selectedStatus === 'Completed') matchesStatus = status === 'COMPLETED';
      if (selectedStatus === 'Pending') matchesStatus = status === 'GRACE';
      if (selectedStatus === 'Failed') matchesStatus = status === 'FAILED';

      let matchesDate = true;
      if (startDate && endDate) {
        matchesDate = isWithinInterval(parseISO(task.assignedDate), {
          start: startOfDay(parseISO(startDate)),
          end: endOfDay(parseISO(endDate))
        });
      }

      return matchesSearch && matchesCategory && matchesStatus && matchesDate;
    });

    // Sort Logic
    result.sort((a, b) => {
      if (sortOption === 'Date (Newest)') return new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime();
      if (sortOption === 'Date (Oldest)') return new Date(a.assignedDate).getTime() - new Date(b.assignedDate).getTime();
      if (sortOption === 'Title (A-Z)') return a.title.localeCompare(b.title);
      if (sortOption === 'Category') return a.category.localeCompare(b.category);
      return 0;
    });

    return result;
  }, [tasks, searchQuery, selectedCategory, selectedStatus, startDate, endDate, sortOption]);

  const toggleComplete = (task: Task) => {
    const updated: Task = {
      ...task,
      completedDate: task.completedDate ? null : format(new Date(), 'yyyy-MM-dd')
    };
    updateTask(updated);
  };

  const startEditing = (task: Task) => {
    setEditingTask(task);
    setEditForm({
      title: task.title,
      date: task.assignedDate,
      category: task.category,
      duration: task.duration || '',
      notes: task.notes || '',
      reminder: task.reminderTime || ''
    });
  };

  const saveEdit = () => {
    if (editingTask && editForm.title.trim()) {
      updateTask({
        ...editingTask,
        title: editForm.title,
        assignedDate: editForm.date,
        category: editForm.category,
        duration: editForm.duration,
        notes: editForm.notes,
        reminderTime: editForm.reminder || undefined
      });
      setEditingTask(null);
    }
  };

  // Bulk Selection Handlers
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedTaskIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedTaskIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedTaskIds.size === filteredTasks.length && filteredTasks.length > 0) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(filteredTasks.map(t => t.id)));
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedTaskIds.size} tasks?`)) {
      selectedTaskIds.forEach(id => deleteTask(id));
      setSelectedTaskIds(new Set());
    }
  };

  const handleBulkComplete = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    tasks.forEach(task => {
      if (selectedTaskIds.has(task.id)) {
        updateTask({ ...task, completedDate: today });
      }
    });
    setSelectedTaskIds(new Set());
  };

  const handleBulkUncomplete = () => {
    tasks.forEach(task => {
      if (selectedTaskIds.has(task.id)) {
        updateTask({ ...task, completedDate: null });
      }
    });
    setSelectedTaskIds(new Set());
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Task Manager</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Create, edit, and manage all your tasks</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onOpenImport} 
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Upload className="w-4 h-4" /> Import
            </button>
            <button 
              onClick={onOpenExport} 
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Download className="w-4 h-4" /> Export
            </button>
            <button 
              onClick={() => setIsTaskModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
            >
              <Plus className="w-4 h-4" /> Add Task
            </button>
          </div>
        </div>

        {/* Updated Filters */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 relative">
          
          {/* Top: Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all placeholder-slate-400"
            />
          </div>
          
          {/* Middle: Dates & Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 transition-all hover:border-slate-300 dark:hover:border-slate-700">
                 <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                 <input 
                   type="text" 
                   onFocus={(e) => e.target.type = 'date'}
                   onBlur={(e) => !e.target.value && (e.target.type = 'text')}
                   value={startDate} 
                   onChange={(e) => setStartDate(e.target.value)}
                   className="bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none w-full min-w-0 placeholder-slate-500" 
                   placeholder="Start Date"
                 />
                 <span className="text-slate-400 text-sm">-</span>
                 <input 
                   type="text" 
                   onFocus={(e) => e.target.type = 'date'}
                   onBlur={(e) => !e.target.value && (e.target.type = 'text')}
                   value={endDate} 
                   onChange={(e) => setEndDate(e.target.value)}
                   className="bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none w-full min-w-0 placeholder-slate-500 text-right md:text-left" 
                   placeholder="End Date"
                 />
                 {(startDate || endDate) && (
                   <button 
                     onClick={() => { setStartDate(''); setEndDate(''); }}
                     className="ml-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                   >
                     <X className="w-3 h-3" />
                   </button>
                 )}
             </div>

             <CustomDropdown 
               label="All Categories"
               value={selectedCategory}
               options={['All', ...CAPITAL_CATEGORIES]}
               onChange={setSelectedCategory}
               icon={<Layers className="w-4 h-4 text-slate-400" />}
               renderOption={(opt) => (
                 opt === 'All' ? <span>All Categories</span> : (
                   <div className="flex items-center gap-2">
                     <CategoryIcon category={opt as CapitalCategory} className="w-3.5 h-3.5 text-slate-500" />
                     <span>{opt}</span>
                   </div>
                 )
               )}
             />
          </div>

          {/* Bottom: Status & Sorting */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CustomDropdown 
               label="All Status"
               value={selectedStatus}
               options={['All', 'Completed', 'Pending', 'Failed']}
               onChange={setSelectedStatus}
               icon={<Activity className="w-4 h-4 text-slate-400" />}
            />
            
            <CustomDropdown 
               label="Sort By"
               value={sortOption}
               options={['Date (Newest)', 'Date (Oldest)', 'Title (A-Z)', 'Category']}
               onChange={(val) => setSortOption(val as SortOption)}
               icon={<ArrowUpDown className="w-4 h-4 text-slate-400" />}
               alignRight={false}
            />
          </div>
        </div>
        
        {/* Bulk Action Bar & Stats */}
        <div className="mt-4 flex items-center justify-between h-10">
           {selectedTaskIds.size > 0 ? (
             <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-200 w-full">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded-lg">
                  {selectedTaskIds.size} Selected
                </span>
                <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />
                <button 
                  onClick={handleBulkComplete}
                  className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 px-2 py-1 rounded-md transition-colors"
                >
                  Mark Complete
                </button>
                <button 
                  onClick={handleBulkUncomplete}
                  className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 rounded-md transition-colors"
                >
                  Unmark
                </button>
                <button 
                  onClick={handleBulkDelete}
                  className="text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 px-2 py-1 rounded-md transition-colors ml-auto md:ml-0"
                >
                  Delete Selected
                </button>
             </div>
           ) : (
             <div className="text-xs text-slate-500">
                Showing {filteredTasks.length} of {tasks.length} tasks
             </div>
           )}
           
           {/* Select All Toggle (only show if tasks exist) */}
           {filteredTasks.length > 0 && (
             <button 
               onClick={toggleSelectAll}
               className="ml-auto text-xs font-medium text-indigo-500 hover:text-indigo-600 flex items-center gap-1"
             >
               {selectedTaskIds.size === filteredTasks.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
               {selectedTaskIds.size === filteredTasks.length ? 'Deselect All' : 'Select All'}
             </button>
           )}
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Filter className="w-12 h-12 mb-4 opacity-20" />
            <p>No tasks found matching your filters</p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const status = getTaskStatus(task);
            const isSelected = selectedTaskIds.has(task.id);
            return (
              <div 
                key={task.id} 
                className={`group flex items-center justify-between p-4 border rounded-xl transition-all ${
                  isSelected 
                    ? 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-500/50' 
                    : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-indigo-500/30'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Selection Checkbox */}
                  <div className="mt-1.5 flex items-center justify-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSelection(task.id); }}
                      className={`w-5 h-5 rounded border transition-colors flex items-center justify-center ${
                         isSelected 
                           ? 'bg-indigo-600 border-indigo-600 text-white' 
                           : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Status Toggle */}
                  <div className="mt-1">
                    <button 
                      onClick={() => toggleComplete(task)}
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors border-2 ${
                         status === 'COMPLETED' 
                            ? 'bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600 hover:border-emerald-600'
                            : status === 'FAILED'
                              ? 'border-rose-500 text-rose-500 bg-rose-500/10 hover:bg-rose-500 hover:text-white'
                              : 'border-amber-500 text-amber-500 bg-amber-500/10 hover:bg-emerald-500 hover:border-emerald-500 hover:text-white'
                      }`}
                      title={status === 'COMPLETED' ? "Mark as Incomplete" : "Mark as Completed"}
                    >
                      {status === 'COMPLETED' && <Check className="w-3.5 h-3.5" />}
                      {status === 'FAILED' && <X className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  
                  {/* Task Content */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-medium ${status === 'COMPLETED' ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}>
                        {task.title}
                      </h3>
                      <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        <CategoryIcon category={task.category} className="w-3 h-3" />
                        {task.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <span>Assigned: {format(parseISO(task.assignedDate), 'MMM d, yyyy')}</span>
                      {task.completedDate && (
                        <span>• Completed: {format(parseISO(task.completedDate), 'MMM d, yyyy')}</span>
                      )}
                      {task.reminderTime && !task.completedDate && (
                         <span className="flex items-center gap-1 text-indigo-500"><Bell className="w-3 h-3" /> {format(parseISO(task.reminderTime), 'h:mm a')}</span>
                      )}
                      {status === 'GRACE' && !task.completedDate && (
                         <span className="text-amber-600 dark:text-amber-500 font-medium">• 3-Day Grace Period Active</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                     onClick={() => startEditing(task)}
                     className="p-2 text-slate-400 hover:text-indigo-500 transition-colors"
                     title="Edit Task"
                   >
                     <Edit2 className="w-4 h-4" />
                   </button>
                   <button 
                     onClick={() => deleteTask(task.id)}
                     className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                     title="Delete Task"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <TaskModal 
        date={new Date()} 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)} 
      />

      {/* Edit Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit Task</h3>
              <button onClick={() => setEditingTask(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Title</label>
                <input 
                  autoFocus
                  className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  value={editForm.title}
                  onChange={e => setEditForm({...editForm, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Date</label>
                    <input 
                      type="date"
                      className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      value={editForm.date}
                      onChange={e => setEditForm({...editForm, date: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Capital</label>
                    <select 
                      className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 appearance-none"
                      value={editForm.category}
                      onChange={e => setEditForm({...editForm, category: e.target.value as CapitalCategory})}
                    >
                      {CAPITAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Duration (opt)</label>
                    <input 
                      className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      value={editForm.duration}
                      onChange={e => setEditForm({...editForm, duration: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Reminder</label>
                    <input 
                      type="datetime-local"
                      className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      value={editForm.reminder}
                      onChange={e => setEditForm({...editForm, reminder: e.target.value})}
                    />
                 </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Notes (opt)</label>
                <textarea 
                  className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  value={editForm.notes}
                  onChange={e => setEditForm({...editForm, notes: e.target.value})}
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 bg-slate-50 dark:bg-slate-900/50">
              <button 
                onClick={() => setEditingTask(null)}
                className="px-4 py-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button 
                onClick={saveEdit}
                disabled={!editForm.title.trim()}
                className="px-6 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManager;