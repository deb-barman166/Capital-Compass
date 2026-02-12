# 🚀 Capital Compass

A modern productivity and life-balance dashboard built with React.

Track your yearly consistency across multiple life dimensions with a 365/366-day progression system, radar visualization, smart calendar tracking, and Excel/CSV import support.

---

## 🌟 Features

### 📅 Calendar System
- Daily task tracking
- Large circular status indicators:
  - 🟢 Completed
  - 🟡 Pending (Grace)
  - 🔴 Expired
- Past tasks automatically locked (cannot be modified)
- Fully responsive and mobile-friendly

---

### 📊 5-Level Progression System

Each capital grows daily based on completed tasks.

| Level | Completion % |
|--------|---------------|
| 1      | 0–20%         |
| 2      | 21–40%        |
| 3      | 41–60%        |
| 4      | 61–80%        |
| 5      | 81–100%       |

- Automatically calculates based on 365 days
- Supports leap year (366 days)
- Level updates dynamically
- Radar chart grows smoothly day-by-day

---

### 🧭 Radar Chart Visualization

Tracks 6 life dimensions:

- Skill
- Physical
- Emotional
- Social
- Intellectual
- Financial

Features:
- Smooth growth animation
- Percentage-based scaling (0–100%)
- Auto-updating legend
- Clean modern dashboard UI

---

### 📥 Excel / CSV Import System

Upload `.xlsx` or `.csv` files and automatically:

- Parse task data
- Add tasks to calendar
- Update completedDays
- Recalculate progress
- Update levels
- Refresh radar chart

Supported columns:

| Column     | Description |
|------------|------------|
| date       | YYYY-MM-DD |
| capital    | Capital name |
| taskName   | Task title |
| status     | completed / pending |

---

### 🔒 Date Lock Protection

- If task date < today → Locked
- Cannot uncheck past completed tasks
- Prevents progress manipulation
- Timezone-safe comparison logic

---

## 🛠 Tech Stack

- React
- Tailwind CSS
- Chart Library (Radar Chart)
- SheetJS (xlsx)
- PapaParse (CSV)
- LocalStorage / Backend Support

---

## 📈 Progress Logic

Daily growth formula:
