import { Task, TaskStatus } from '../types';
import { differenceInCalendarDays, parseISO, format, addDays, isAfter, isSameDay } from 'date-fns';

export const getTaskStatus = (task: Task): TaskStatus => {
  const today = new Date();
  const assigned = parseISO(task.assignedDate);
  const deadline = addDays(assigned, 3);
  
  if (task.completedDate) {
    const completed = parseISO(task.completedDate);
    const diff = differenceInCalendarDays(completed, assigned);
    // If completed within 3 days after assigned date (inclusive of assigned date)
    if (diff <= 3) return 'COMPLETED';
    return 'FAILED'; 
  }

  // Not completed yet
  if (isAfter(today, deadline)) {
    return 'FAILED';
  }

  // If assigned date is today, it's technically PENDING, but within Grace Period.
  return 'GRACE'; 
};

export const getDayStatusSummary = (tasks: Task[], dateStr: string): 'ALL_COMPLETED' | 'HAS_FAILED' | 'IN_GRACE' | 'PENDING' | 'EMPTY' => {
  if (tasks.length === 0) return 'EMPTY';

  let hasFail = false;
  let hasGrace = false;
  let allCompleted = true;

  for (const task of tasks) {
    const status = getTaskStatus(task);
    if (status === 'FAILED') {
      hasFail = true;
    } else if (status === 'GRACE') {
      hasGrace = true;
    }
    
    if (status !== 'COMPLETED') {
      allCompleted = false;
    }
  }

  if (hasFail) return 'HAS_FAILED';
  if (allCompleted) return 'ALL_COMPLETED';
  if (hasGrace) return 'IN_GRACE';
  
  return 'PENDING';
};

export const formatDateForExport = (dateStr: string) => {
    return dateStr;
};

/**
 * Calculates the total days in the current year, handling leap years automatically.
 * @param year Optional year, defaults to current year
 * @returns 366 if leap year, 365 otherwise
 */
export const getDaysInCurrentYear = (year: number = new Date().getFullYear()): number => {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0) ? 366 : 365;
};

interface LevelStats {
  level: number;
  label: string;
  percentage: number;
  progress: number; // 0-100 float
  colors: {
    text: string;
    bg: string;
    border: string;
    iconBg: string;
    iconColor: string;
  }
}

/**
 * Calculates the progression level based on completed days vs total days.
 * Returns detailed styling info for the UI.
 */
export const calculateLevel = (completedDays: number, totalDays: number): LevelStats => {
  // Guard against division by zero
  if (totalDays === 0) totalDays = 365;
  
  const rawPercentage = (completedDays / totalDays) * 100;
  const progress = Math.min(Math.max(rawPercentage, 0), 100); // Clamp 0-100
  const percentageInt = Math.floor(progress);

  let level = 1;
  let label = 'Very Bad';
  let colors = {
    text: "text-rose-500", 
    bg: "bg-rose-500/10", 
    border: "border-rose-500/20",
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-500",
  };

  if (progress > 80) {
    level = 5;
    label = 'Outstanding';
    colors = {
      text: "text-emerald-400", 
      bg: "bg-emerald-500/10", 
      border: "border-emerald-500/20",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
    };
  } else if (progress > 60) {
    level = 4;
    label = 'Very Good';
    colors = {
      text: "text-blue-400", 
      bg: "bg-blue-500/10", 
      border: "border-blue-500/20",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-400",
    };
  } else if (progress > 40) {
    level = 3;
    label = 'Good';
    colors = {
      text: "text-indigo-400", 
      bg: "bg-indigo-500/10", 
      border: "border-indigo-500/20",
      iconBg: "bg-indigo-500/10",
      iconColor: "text-indigo-400",
    };
  } else if (progress > 20) {
    level = 2;
    label = 'Improvement';
    colors = {
      text: "text-amber-400", 
      bg: "bg-amber-500/10", 
      border: "border-amber-500/20",
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-400",
    };
  }

  return { 
    level, 
    label, 
    percentage: percentageInt, 
    progress,
    colors
  };
};