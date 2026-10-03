# 🏋️‍♂️ DiTapDe! (Đi Tập Đê!) — Strava for Lifters

[![Live Demo](https://img.shields.io/badge/Demo-ditapdedemo.ai.studio-e8493b?style=for-the-badge&logo=googlechrome&logoColor=white)](https://ditapdedemo.ai.studio/)
[![Platform](https://img.shields.io/badge/Platform-Mobile--First%20%7C%20iOS%20%26%20Android-black?style=for-the-badge&logo=apple)](https://ditapdedemo.ai.studio/)
[![Design System](https://img.shields.io/badge/Design-Apple%20HIG%20%2B%20Glassmorphism-000000?style=for-the-badge&logo=figma)](https://developer.apple.com/design/resources/)
[![License](https://img.shields.io/badge/License-MIT-blue.style=for-the-badge)](LICENSE)

> **DiTapDe! (Đi Tập Đê!)** is a high-octane, mobile-first workout tracking and social platform built for the modern lifting community in Vietnam. Designed as the **"Strava for Lifters"**, DiTapDe! combines friction-free 1-tap workout logging, automated plate math, dynamic muscle heatmaps, and anti-ego verified leaderboards.

---

## 🌟 Key Features

### ⚡ 1-Tap Logging & Smart Plate Calculator
* **Frictionless Set Logging:** Log reps, weight, and RPE with a single touch—no cumbersome menus mid-workout.
* **Instant 1RM & Volume Computation:** Real-time feedback on total tonnage and estimated 1 Rep Max (1RM).
* **Automated Barbell Plate Math:** Dynamic visual breakdown showing exactly which weight plates to load on each side of the barbell (e.g., `[25kg][25kg]`).

### 🧬 Visual Muscle Heatmap
* **Real-time Recovery & Fatigue Tracking:** Watch targeted muscle groups shift colors dynamically as volume accumulates:
  * ⚪ **Charcoal/Grey:** Untrained
  * 🟢 **Emerald Green:** 1–3 sets (Warmup / Light activation)
  * 🟡 **Gold Amber:** 4–8 sets (Optimal volume zone)
  * 🔴 **Blazing Coral Red:** 9+ sets (High fatigue / Maximum stimulus)

### 🛡️️ Anti-Ego Leaderboard & Social Feed
* **Verified PRs:** Anti-cheat telemetry utilizing GPS location and biometric validation to ensure real, transparent strength metrics.
* **Social Motivation:** Live community activity stream featuring 1-tap *"Cheer"* and *"Nudge Friend"* interactions to keep training partners accountable.

### 📱 Apple HIG-Inspired Mobile Experience
* **Crafted for Modern Devices:** Designed specifically for iPhone 15 & modern viewports with Dynamic Island top inset and Home Indicator gesture safe-areas.
* **Aesthetic Polish:** Dark Mode primary palette (`#0c0c0e`) with vibrant Coral Red accent (`#e8493b`), squircle containers, frosted glass layers (`backdrop-blur-md`), and Lucide/Phosphor vector iconography.

---

## 🎨 Design System & Color Palette

DiTapDe! utilizes a dark-mode-first color language built around high contrast, glassmorphism, and energetic accenting:

| Token Name | Hex Code | Usage |
| :--- | :--- | :--- |
| **Canvas Background** | `#0C0C0E` | App background dark charcoal |
| **Card Surface** | `#19191C` / `rgba(255,255,255,0.05)` | Glassmorphic containers & card tiles |
| **Brand Primary Accent** | `#E8493B` | Primary buttons, active badges, high-fatigue heatmaps |
| **Brand Accent Highlight**| `#FF8F73` | Hover highlights & gradient stops |
| **Success / Verified** | `#4CAF6F` | Verified PR shield badges & active recovery zones |

---

## 🛠️ Tech Stack & Architecture

* **Frontend Framework:** React / Next.js / Flutter
* **Styling & UI Components:** Tailwind CSS, Glassmorphic CSS Engine, Apple Human Interface Guidelines (HIG) standards
* **Icons:** `lucide-react` / `@phosphor-icons/react` (1.75px–2px stroke weight)
* **Backend Services:** Firebase / Cloud Functions
* **Telemetry & Anti-Cheat:** Geolocation & Biometric verification hooks

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** `>= 18.0.0`
* **npm** or **yarn** or **pnpm**

### Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/your-username/ditapde.git](https://github.com/your-username/ditapde.git)
   cd ditapde
