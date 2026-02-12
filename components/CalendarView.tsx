import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addMonths, subMonths, isSameMonth, isToday, isFuture, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { getDayStatusSummary } from '../utils/helpers';
import TaskModal from './TaskModal';

interface CalendarViewProps {
  onNavigateToDashboard: () => void;
  onOpenExport: () => void;
  onOpenImport: () => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ onNavigateToDashboard, onOpenExport, onOpenImport }) => {
  const { tasks } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToday = () => setCurrentDate(new Date());

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setIsTaskModalOpen(true);
  };

  const closeModal = () => {
    setIsTaskModalOpen(false);
    setSelectedDate(null);
  }

  return (
    <div className="flex flex-col h-full bg-[#020617] text-slate-100">
      {/* Header */}
      <div className="flex-none p-6 border-b border-slate-800 bg-[#0f172a]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-1">
          <div>
            <h2 className="text-2xl font-bold text-white">Calendar View</h2>
            <p className="text-slate-400 mt-1">Track your progress day by day</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setSelectedDate(new Date());
                setIsTaskModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
            >
              <Plus className="w-4 h-4" /> Add Task
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Container */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto">
         <div className="max-w-4xl mx-auto">
            
            {/* Controls */}
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-bold text-white capitalize pl-2">
                 {format(currentDate, 'MMMM yyyy')}
               </h3>
               <div className="flex items-center gap-2">
                 <button onClick={goToday} className="px-3 py-1.5 text-xs font-bold bg-slate-800 rounded-md text-slate-300 hover:bg-slate-700 transition-colors border border-slate-700">
                   Today
                 </button>
                 <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                   <button onClick={prevMonth} className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 transition-all">
                     <ChevronLeft className="w-4 h-4" />
                   </button>
                   <button onClick={nextMonth} className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 transition-all">
                     <ChevronRight className="w-4 h-4" />
                   </button>
                 </div>
               </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 mb-6">
               {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                 <div key={day} className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                   {day}
                 </div>
               ))}
            </div>

            <div className="grid grid-cols-7 gap-y-2 md:gap-y-4">
              {calendarDays.map(day => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const dayTasks = tasks.filter(t => t.assignedDate === dayStr);
                const status = getDayStatusSummary(dayTasks, dayStr);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === dayStr;
                const isDayToday = isToday(day);
                const isFutureDate = isFuture(startOfDay(day)) && !isDayToday;

                // --- Status Styling Logic ---
                let borderClass = 'border-transparent';
                let textClass = !isCurrentMonth ? 'text-slate-700' : 'text-slate-300';
                let bgClass = 'hover:bg-slate-800/50';
                let shadowClass = '';

                // 1. Determine Status Styling (Base) - Future dates excluded from status rings
                if (!isFutureDate && status !== 'EMPTY') {
                  if (status === 'ALL_COMPLETED') {
                    borderClass = 'border-emerald-500';
                    textClass = 'text-emerald-400 font-bold';
                    shadowClass = 'shadow-[0_0_12px_rgba(16,185,129,0.3)]';
                    bgClass = 'bg-emerald-500/5 hover:bg-emerald-500/10';
                  } else if (status === 'HAS_FAILED') {
                    borderClass = 'border-rose-500';
                    textClass = 'text-rose-400 font-bold';
                    shadowClass = 'shadow-[0_0_12px_rgba(244,63,94,0.3)]';
                    bgClass = 'bg-rose-500/5 hover:bg-rose-500/10';
                  } else if (status === 'IN_GRACE' || status === 'PENDING') {
                    borderClass = 'border-amber-500';
                    textClass = 'text-amber-400 font-bold';
                    shadowClass = 'shadow-[0_0_12px_rgba(245,158,11,0.3)]';
                    bgClass = 'bg-amber-500/5 hover:bg-amber-500/10';
                  }
                }

                // 2. Today Overrides
                if (isDayToday) {
                  textClass = 'text-indigo-400 font-extrabold';
                  if (status === 'EMPTY') {
                     borderClass = 'border-indigo-500/30';
                     shadowClass = 'shadow-[0_0_15px_rgba(99,102,241,0.2)]';
                     bgClass = 'bg-slate-800/30';
                  }
                }

                // 3. Selection Overrides (Highest Priority)
                if (isSelected) {
                  bgClass = 'bg-indigo-600';
                  textClass = 'text-white font-bold';
                  shadowClass = 'shadow-xl shadow-indigo-500/40';
                  // Keep status border if exists, otherwise indigo border
                  if (borderClass === 'border-transparent' || (isDayToday && status === 'EMPTY')) {
                     borderClass = 'border-indigo-600';
                  }
                }

                return (
                  <div 
                    key={day.toISOString()}
                    onClick={() => handleDayClick(day)}
                    className="flex flex-col items-center justify-start py-1 cursor-pointer group"
                  >
                    <div className={`
                      relative w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-sm md:text-base border-[2.5px] transition-all duration-300
                      ${borderClass}
                      ${bgClass}
                      ${textClass}
                      ${shadowClass}
                      ${isSelected ? 'scale-110 z-10' : ''}
                    `}>
                      {format(day, 'd')}
                    </div>
                  </div>
                );
              })}
            </div>
         </div>
      </div>

      <TaskModal 
        date={selectedDate || new Date()} 
        isOpen={isTaskModalOpen} 
        onClose={closeModal} 
      />
    </div>
  );
};

export default CalendarView;