import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import CalendarView from './components/CalendarView';
import CapitalDashboard from './components/CapitalDashboard';
import TaskManager from './components/TaskManager';
import ExportPanel from './components/ExportPanel';
import ImportPanel from './components/ImportPanel';
import { LayoutDashboard, Calendar, CheckSquare, Sun, Moon, Compass } from 'lucide-react';

const NavButton: React.FC<{ 
  active: boolean; 
  onClick: () => void; 
  icon: React.ElementType; 
  label: string; 
}> = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
      active 
        ? 'bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-400' 
        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
    }`}
  >
    <Icon className="w-4 h-4" />
    <span className="hidden md:inline">{label}</span>
  </button>
);

const AppContent: React.FC = () => {
  const [view, setView] = useState<'DASHBOARD' | 'CALENDAR' | 'TASKS'>('CALENDAR');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const { theme, setTheme } = useApp();

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* Navigation Header */}
      <header className="flex-none h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 flex items-center justify-between z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <Compass className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg hidden lg:block">Capital Compass</span>
        </div>

        <nav className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto max-w-[70vw] no-scrollbar">
          <NavButton 
            active={view === 'DASHBOARD'} 
            onClick={() => setView('DASHBOARD')} 
            icon={LayoutDashboard} 
            label="Dashboard" 
          />
          <NavButton 
            active={view === 'CALENDAR'} 
            onClick={() => setView('CALENDAR')} 
            icon={Calendar} 
            label="Calendar" 
          />
          <NavButton 
            active={view === 'TASKS'} 
            onClick={() => setView('TASKS')} 
            icon={CheckSquare} 
            label="Tasks" 
          />
        </nav>

        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTheme} 
            className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Content Area */}
      <main className="flex-1 overflow-hidden relative">
        <div className={`absolute inset-0 transition-opacity duration-200 ${view === 'CALENDAR' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
           <CalendarView 
             onNavigateToDashboard={() => setView('DASHBOARD')} 
             onOpenExport={() => setIsExportOpen(true)}
             onOpenImport={() => setIsImportOpen(true)}
           />
        </div>
        
        <div className={`absolute inset-0 transition-opacity duration-200 ${view === 'DASHBOARD' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
           <CapitalDashboard 
              onBack={() => setView('CALENDAR')} 
           />
        </div>

        <div className={`absolute inset-0 transition-opacity duration-200 ${view === 'TASKS' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
           <TaskManager 
             onOpenExport={() => setIsExportOpen(true)}
             onOpenImport={() => setIsImportOpen(true)}
           />
        </div>
      </main>

      <ExportPanel isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
      <ImportPanel isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;