export type CapitalCategory = 
  | 'Skill'
  | 'Physical'
  | 'Emotional'
  | 'Social'
  | 'Intellectual'
  | 'Financial';

export const CAPITAL_CATEGORIES: CapitalCategory[] = [
  'Skill',
  'Physical',
  'Emotional',
  'Social',
  'Intellectual',
  'Financial'
];

export interface Task {
  id: string;
  title: string;
  category: CapitalCategory;
  assignedDate: string; // ISO Date string YYYY-MM-DD
  completedDate: string | null; // ISO Date string YYYY-MM-DD or null
  notes?: string;
  duration?: string; // e.g., "30m", "1h"
  reminderTime?: string; // ISO Date string for notification
  createdAt: number;
}

export type TaskStatus = 'COMPLETED' | 'FAILED' | 'PENDING' | 'GRACE';

export interface DayStatus {
  date: string;
  tasks: Task[];
  status: 'ALL_COMPLETED' | 'HAS_FAILED' | 'PENDING' | 'EMPTY';
}

export type ThemeMode = 'light' | 'dark' | 'system';