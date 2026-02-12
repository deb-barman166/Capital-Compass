import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Task, ThemeMode } from '../types';
import { parseISO, isSameMinute } from 'date-fns';

interface AppContextType {
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('capital_compass_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [theme, setThemeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('capital_compass_theme') as ThemeMode) || 'system';
  });

  // Request Notification Permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  // Check for Reminders every minute
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      tasks.forEach(task => {
        if (task.reminderTime && !task.completedDate) {
          const reminderDate = parseISO(task.reminderTime);
          // Simple check: if current time is within the same minute as reminder
          if (isSameMinute(now, reminderDate)) {
             if (Notification.permission === 'granted') {
               new Notification(`Reminder: ${task.title}`, {
                 body: `It's time for your ${task.category} task!`,
                 icon: '/favicon.ico' // Assuming standard favicon location
               });
             }
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('capital_compass_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('capital_compass_theme', theme);
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  const addTask = (task: Task) => {
    setTasks(prev => [...prev, task]);
  };

  const updateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  return (
    <AppContext.Provider value={{ tasks, addTask, updateTask, deleteTask, theme, setTheme }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};