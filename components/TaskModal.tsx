import React, { useState, useEffect, useRef } from 'react';
import { Task, CAPITAL_CATEGORIES, CapitalCategory } from '../types';
import { useApp } from '../context/AppContext';
import { getTaskStatus } from '../utils/helpers';
import { X, Check, Trash2, Clock, Plus, Calendar, ChevronDown, Bell } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { CategoryIcon } from './CategoryIcon';

interface TaskModalProps {
  date: Date;
  isOpen: boolean;
  onClose: () => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ date, isOpen, onClose }) => {
  const { tasks, addTask, updateTask, deleteTask } = useApp();
  const [selectedDate, setSelectedDate] = useState(format(date, 'yyyy-MM-dd'));
  const [isAdding, setIsAdding] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Dropdown state
  const [isCapitalOpen, setIsCapitalOpen] = useState(false);
  const capitalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedDate(format(date, 'yyyy-MM-dd'));
      setIsAdding(false);
      setIsCapitalOpen(false);
    }
  }, [isOpen, date]);

  useEffect(() => {
    if (isAdding && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [isAdding]);

  // Click outside listener for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (capitalRef.current && !capitalRef.current.contains(event.target as Node)) {
        setIsCapitalOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // New task state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<CapitalCategory>('Skill');
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskReminder, setNewTaskReminder] = useState('');

  const dayTasks = tasks.filter(t => t.assignedDate === selectedDate);

  const startAdding = () => {
    setNewTaskDate(selectedDate);
    setNewTaskTitle('');
    setNewTaskCategory('Skill');
    setNewTaskNotes('');
    setNewTaskDuration('');
    setNewTaskReminder('');
    setIsAdding(true);
    setIsCapitalOpen(false);
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: newTaskTitle,
      category: newTaskCategory,
      assignedDate: newTaskDate || selectedDate,
      completedDate: null,
      notes: newTaskNotes,
      duration: newTaskDuration,
      reminderTime: newTaskReminder || undefined,
      createdAt: Date.now()
    };
    
    addTask(newTask);
    setIsAdding(false);
  };

  const toggleComplete = (task: Task) => {
    const updated: Task = {
      ...task,
      completedDate: task.completedDate ? null : format(new Date(), 'yyyy-MM-dd')
    };
    updateTask(updated);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020617]/80 backdrop-blur-md transition-all">
      <div className="bg-[#0f172a] w-full max-w-md rounded-3xl shadow-2xl border border-slate-800 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#0f172a] rounded-t-3xl">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              {format(parseISO(selectedDate), 'MMMM do, yyyy')}
            </h3>
            <p className="text-xs font-medium text-slate-400 mt-0.5 uppercase tracking-wide">Daily Routine</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#0f172a]">
          
          {/* Task List */}
          {dayTasks.length > 0 ? (
            <div className="space-y-3">
              {dayTasks.map(task => {
                const status = getTaskStatus(task);
                const isCompleted = !!task.completedDate;
                
                return (
                  <div key={task.id} className="group relative bg-[#1e293b]/50 hover:bg-[#1e293b] rounded-2xl p-4 border border-slate-800 hover:border-indigo-500/30 transition-all duration-200">
                    <div className="flex items-start gap-4">
                       <button 
                         onClick={() => toggleComplete(task)}
                         className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm ${
                           isCompleted 
                             ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                             : status === 'FAILED'
                               ? 'bg-rose-500/10 text-rose-500 border-2 border-rose-500'
                               : 'bg-slate-800 border-2 border-slate-600 hover:border-emerald-500 text-transparent hover:text-emerald-500'
                         }`}
                       >
                         {(isCompleted || status === 'FAILED') && <Check className={`w-3.5 h-3.5 ${status === 'FAILED' && !isCompleted ? 'rotate-45' : ''}`} />}
                         {!isCompleted && status !== 'FAILED' && <Check className="w-3.5 h-3.5" />}
                       </button>
                       
                       <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1.5">
                            <h4 className={`text-base font-medium truncate ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                              {task.title}
                            </h4>
                            <button 
                              onClick={() => deleteTask(task.id)}
                              className="text-slate-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2">
                             <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/50">
                                <CategoryIcon category={task.category} className="w-3 h-3 text-indigo-400" />
                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">{task.category}</span>
                             </div>
                             
                             {task.duration && (
                               <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/50">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span className="text-[10px] font-bold text-slate-400">{task.duration}</span>
                               </div>
                             )}

                             {task.reminderTime && (
                               <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30">
                                  <Bell className="w-3 h-3 text-indigo-400" />
                                  <span className="text-[10px] font-bold text-indigo-300">
                                    {format(parseISO(task.reminderTime), 'h:mm a')}
                                  </span>
                               </div>
                             )}

                             {status === 'FAILED' && !isCompleted && (
                               <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-1 rounded-full">Missed</span>
                             )}
                          </div>
                          
                          {task.notes && (
                            <div className="mt-3 text-xs text-slate-400 bg-slate-900/50 p-3 rounded-xl border border-slate-800/50 leading-relaxed">
                              {task.notes}
                            </div>
                          )}
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            !isAdding && (
              <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
                  <Calendar className="w-8 h-8 opacity-20" />
                </div>
                <p className="text-sm font-medium">No tasks for today</p>
                <button onClick={startAdding} className="mt-2 text-indigo-400 text-sm hover:underline">Add one now</button>
              </div>
            )
          )}

          {/* Add Task Form (Inline) */}
          {isAdding && (
            <div className="bg-[#1e293b]/30 rounded-2xl p-5 border border-indigo-500/20 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-200">
              <div className="space-y-4">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Title</label>
                  <input 
                    autoFocus
                    className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    placeholder="What needs to be done?"
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                  />
                </div>

                {/* Date & Capital Row */}
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Date</label>
                      <input 
                        type="date"
                        className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                        value={newTaskDate}
                        onChange={e => setNewTaskDate(e.target.value)}
                      />
                   </div>
                   
                   {/* Custom Animated Dropdown for Capital */}
                   <div className="space-y-1.5" ref={capitalRef}>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Capital</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsCapitalOpen(!isCapitalOpen)}
                          className={`w-full bg-[#0f172a] border rounded-xl px-4 py-3 text-sm text-white flex items-center justify-between focus:outline-none transition-all duration-200 ${
                            isCapitalOpen 
                              ? 'border-indigo-500 ring-2 ring-indigo-500/20' 
                              : 'border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                             <CategoryIcon category={newTaskCategory} className="w-4 h-4 text-indigo-400" />
                             <span>{newTaskCategory}</span>
                          </div>
                          <ChevronDown 
                             className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isCapitalOpen ? 'rotate-180' : ''}`} 
                          />
                        </button>

                        {/* Dropdown Menu */}
                        <div 
                           className={`absolute z-20 left-0 right-0 top-full mt-2 bg-[#1e293b] border border-slate-700 rounded-xl shadow-2xl shadow-black/50 overflow-hidden transition-all duration-200 origin-top ${
                              isCapitalOpen 
                                ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' 
                                : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                           }`}
                        >
                          <div className="p-1 max-h-48 overflow-y-auto custom-scrollbar">
                            {CAPITAL_CATEGORIES.map((cat) => (
                              <button
                                key={cat}
                                onClick={() => { setNewTaskCategory(cat); setIsCapitalOpen(false); }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                                   newTaskCategory === cat 
                                     ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                                     : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                                }`}
                              >
                                 <CategoryIcon category={cat} className={`w-4 h-4 ${newTaskCategory === cat ? 'text-white' : 'text-slate-400'}`} />
                                 <span className="font-medium">{cat}</span>
                                 {newTaskCategory === cat && <Check className="w-3.5 h-3.5 ml-auto" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                   </div>
                </div>

                {/* Duration & Reminder */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Duration</label>
                    <input 
                      className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                      placeholder="e.g. 30m"
                      value={newTaskDuration}
                      onChange={e => setNewTaskDuration(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Reminder</label>
                    <input 
                      type="datetime-local"
                      className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                      value={newTaskReminder}
                      onChange={e => setNewTaskReminder(e.target.value)}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                   <div className="flex items-center justify-between pl-1 pr-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Notes (Opt)</label>
                   </div>
                   <textarea 
                      className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all min-h-[80px] resize-none"
                      placeholder="Add details, links, or checklist..."
                      value={newTaskNotes}
                      onChange={e => setNewTaskNotes(e.target.value)}
                   />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                   <button 
                     onClick={() => setIsAdding(false)}
                     className="flex-1 px-4 py-3 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                   >
                     Cancel
                   </button>
                   <button 
                     onClick={handleAddTask}
                     disabled={!newTaskTitle.trim()}
                     className="flex-1 px-4 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:shadow-none transition-all"
                   >
                     Save Task
                   </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Add Button */}
        {!isAdding && (
          <div className="p-5 border-t border-slate-800 bg-[#0f172a] rounded-b-3xl">
            <button 
              onClick={startAdding}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-5 h-5" />
              Add Task
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskModal;