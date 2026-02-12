import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, AreaChart, Area } from 'recharts';
import { CAPITAL_CATEGORIES, CapitalCategory } from '../types';
import { getTaskStatus, calculateLevel, getDaysInCurrentYear } from '../utils/helpers';
import { CheckCircle, Clock, XCircle, TrendingUp, Plus } from 'lucide-react';
import { subDays, isAfter, parseISO, eachDayOfInterval, format, isSameDay } from 'date-fns';
import TaskModal from './TaskModal';
import { CategoryIcon } from './CategoryIcon';

interface CapitalDashboardProps {
  onBack: () => void;
}

const CapitalDashboard: React.FC<CapitalDashboardProps> = ({ onBack }) => {
  const { tasks } = useApp();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Filter tasks to last 366 days for consistency calculation
  const recentTasks = useMemo(() => {
    const startDate = subDays(new Date(), 366);
    return tasks.filter(t => isAfter(parseISO(t.assignedDate), startDate));
  }, [tasks]);

  // General Stats
  const generalStats = useMemo(() => {
    let completed = 0;
    let pending = 0;
    let expired = 0;
    let totalPast = 0;

    recentTasks.forEach(task => {
      const status = getTaskStatus(task);
      if (status === 'COMPLETED') completed++;
      else if (status === 'FAILED') expired++;
      else if (status === 'GRACE') pending++;

      if (status === 'COMPLETED' || status === 'FAILED') {
        totalPast++;
      }
    });

    const successRate = totalPast > 0 ? Math.round((completed / totalPast) * 100) : 0;
    const displaySuccessRate = totalPast === 0 && completed === 0 ? 100 : successRate;

    return { completed, pending, expired, successRate: displaySuccessRate };
  }, [recentTasks]);

  // Daily Success Trend for Sparkline (Last 14 Days)
  const successTrend = useMemo(() => {
    const end = new Date();
    const start = subDays(end, 14); // 2 weeks trend
    const days = eachDayOfInterval({ start, end });

    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayTasks = tasks.filter(t => t.assignedDate === dayStr);
      
      if (dayTasks.length === 0) {
        return { date: dayStr, rate: 100 }; // Default to 100% (maintenance) if no tasks
      }

      const completedCount = dayTasks.filter(t => getTaskStatus(t) === 'COMPLETED').length;
      const rate = Math.round((completedCount / dayTasks.length) * 100);
      
      return { date: dayStr, rate };
    });
  }, [tasks]);

  // Capital Stats with Daily Increasing Logic
  const capitalStats = useMemo(() => {
    const daysInYear = getDaysInCurrentYear();

    // 1. Initialize data structure
    const data = CAPITAL_CATEGORIES.map(cat => ({
      capital: cat,
      completedDays: new Set<string>(), // Store unique dates to prevent double counting
    }));

    // 2. Populate unique completed days
    recentTasks.forEach(task => {
      const catIndex = data.findIndex(d => d.capital === task.category);
      if (catIndex > -1) {
        const status = getTaskStatus(task);
        if (status === 'COMPLETED') {
           data[catIndex].completedDays.add(task.assignedDate);
        }
      }
    });

    // 3. Transform to Chart Data
    return data.map(d => {
      const uniqueCompletedCount = d.completedDays.size;
      
      // Use the master helper for consistent calculation
      const stats = calculateLevel(uniqueCompletedCount, daysInYear);

      return {
        capital: d.capital,
        completed: uniqueCompletedCount,
        total: daysInYear,
        progress: stats.progress, // Float 0-100 for smooth chart
        percentage: stats.percentage, // Int for display
        level: stats.level,
        label: stats.label,
        colors: stats.colors
      };
    });
  }, [recentTasks]);

  // Legend Items for visual reference
  const LEGEND_ITEMS = [
    { level: 1, label: 'VERY BAD', color: 'text-rose-500 bg-rose-500/10' },
    { level: 2, label: 'IMPROVEMENT', color: 'text-amber-500 bg-amber-500/10' },
    { level: 3, label: 'GOOD', color: 'text-indigo-400 bg-indigo-500/10' },
    { level: 4, label: 'VERY GOOD', color: 'text-blue-400 bg-blue-500/10' },
    { level: 5, label: 'OUTSTANDING', color: 'text-emerald-400 bg-emerald-500/10' }
  ];

  // Custom Tooltip for Radar Chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#1e293b] p-3 border border-slate-700 shadow-xl rounded-lg backdrop-blur-md bg-opacity-95">
          <p className="font-bold text-white mb-1 uppercase tracking-wider text-xs">{label}</p>
          <div className="flex items-center gap-2 text-sm">
             <span className={`${data.colors.text} font-bold`}>{data.progress.toFixed(1)}% Consistency</span>
          </div>
          <p className="text-slate-500 text-xs mt-1">Level {data.level} • {data.completed}/{data.total} Days</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-[#020617] text-white p-4 md:p-6 overflow-y-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <button onClick={onBack} className="text-slate-400 text-sm hover:text-white mb-2 md:hidden">← Back</button>
           <h2 className="text-2xl font-bold text-white tracking-tight">Dashboard</h2>
           <p className="text-slate-400 text-sm">Daily consistency tracker (Yearly View)</p>
        </div>
        <button 
           onClick={() => setIsTaskModalOpen(true)}
           className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
         >
           <Plus className="w-4 h-4" /> Add Task
         </button>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800/50 shadow-sm">
           <div className="flex items-center gap-2 mb-3">
             <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
             </div>
             <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Completed</span>
           </div>
           <p className="text-2xl md:text-3xl font-bold text-white pl-1">{generalStats.completed}</p>
        </div>
        
        <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800/50 shadow-sm">
           <div className="flex items-center gap-2 mb-3">
             <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-500" />
             </div>
             <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pending</span>
           </div>
           <p className="text-2xl md:text-3xl font-bold text-white pl-1">{generalStats.pending}</p>
        </div>

        <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800/50 shadow-sm">
           <div className="flex items-center gap-2 mb-3">
             <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center">
                <XCircle className="w-4 h-4 text-rose-500" />
             </div>
             <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Expired</span>
           </div>
           <p className="text-2xl md:text-3xl font-bold text-white pl-1">{generalStats.expired}</p>
        </div>

        <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800/50 shadow-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors" />
           <div className="relative z-10 flex flex-col justify-between h-full">
             <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-indigo-400" />
                  </div>
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Success Rate</span>
                </div>
             </div>
             
             <div className="flex items-end justify-between mt-2">
                <p className="text-2xl md:text-3xl font-bold text-white pl-1">{generalStats.successRate}%</p>
                <div className="h-10 w-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={successTrend}>
                      <defs>
                        <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area 
                        type="monotone" 
                        dataKey="rate" 
                        stroke="#818cf8" 
                        strokeWidth={2} 
                        fill="url(#colorRate)" 
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
             </div>
           </div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-6 shadow-xl shadow-black/20 mb-6 relative">
         <div className="flex justify-between items-start mb-4">
             <h3 className="text-base font-bold text-white">Your Capital Balance</h3>
             {/* Legend */}
             <div className="hidden md:flex gap-2">
                {LEGEND_ITEMS.map((item) => (
                  <div key={item.level} className={`px-2 py-1 rounded text-[10px] font-bold ${item.color} border border-white/5`}>
                    {item.level} {item.label}
                  </div>
                ))}
             </div>
         </div>
         
         <div className="w-full h-[350px] md:h-[450px] flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={capitalStats}>
                {/* 0-100 Domain for Percentage Based Daily Growth */}
                <PolarGrid gridType="polygon" stroke="#334155" strokeOpacity={0.5} />
                <PolarAngleAxis 
                  dataKey="capital" 
                  tick={({ payload, x, y, textAnchor, cx, cy }) => {
                     return (
                      <g className="recharts-layer recharts-polar-angle-axis-tick">
                        <text 
                          x={x} 
                          y={y} 
                          dy={payload.value === 'Social' || payload.value === 'Financial' ? 10 : 0} 
                          textAnchor={textAnchor} 
                          className="fill-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest"
                        >
                          {payload.value}
                        </text>
                      </g>
                     );
                  }} 
                />
                {/* 
                   Domain is 0 to 100.
                   Ticks represent the Levels: 0, 20, 40, 60, 80, 100 
                */}
                <PolarRadiusAxis angle={90} domain={[0, 100]} tickCount={6} tick={false} axisLine={false} />
                <Radar
                  name="Capital"
                  dataKey="progress"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="#6366f1"
                  fillOpacity={0.15}
                  isAnimationActive={true}
                />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
         </div>
         
         {/* Mobile Legend */}
         <div className="flex md:hidden flex-wrap justify-center gap-2 mt-4">
            {LEGEND_ITEMS.map((item) => (
              <div key={item.level} className={`px-2 py-1 rounded text-[10px] font-bold ${item.color} border border-white/5`}>
                {item.level}
              </div>
            ))}
         </div>
      </div>

      {/* Category Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
         {capitalStats.map(stat => (
           <div key={stat.capital} className="group bg-[#0f172a] hover:bg-[#1e293b] rounded-xl p-4 border border-slate-800 transition-all flex items-center gap-4">
                {/* Icon Box */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${stat.colors.iconBg} ring-1 ring-inset ${stat.colors.border}`}>
                   <CategoryIcon category={stat.capital as CapitalCategory} className={`w-5 h-5 ${stat.colors.iconColor}`} />
                </div>
                
                {/* Content */}
                <div className="flex flex-col flex-1">
                  <h4 className="font-bold text-white text-base leading-tight mb-1">{stat.capital}</h4>
                  
                  {/* Status Text Colored */}
                  <div className={`text-sm font-bold ${stat.colors.text} mb-1 flex items-center gap-1`}>
                    {stat.label} <span className="opacity-75">({stat.percentage}%)</span>
                  </div>
                  
                  {/* Subtext */}
                  <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                    <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">Lvl {stat.level}</span>
                    <span>•</span>
                    <span>{stat.completed}/{stat.total} Days</span>
                  </div>
                </div>
             </div>
         ))}
      </div>

      <TaskModal 
        date={new Date()} 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)} 
      />
    </div>
  );
};

export default CapitalDashboard;