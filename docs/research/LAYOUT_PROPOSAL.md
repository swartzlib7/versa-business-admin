# R3F Admin System - Layout Proposal

## Overview
The admin system will feature a hybrid layout: a standard 2D management interface (shadcn/ui) with an integrated 3D viewport (R3F) for immersive data visualization.

## Layout Structure

### 1. Sidebar (2D)
- **Navigation**: Links to different project views, agent logs, and system settings.
- **Agent Fleet Status**: Real-time status indicators for all active agents.

### 2. Header (2D)
- **Global Search**: Search across all project files and research data.
- **User Profile**: Access to Primary User settings and preferences.
- **Milestone Countdown**: Visual indicator for upcoming deadlines.

### 3. Main Content Area (Hybrid)
- **Top Section (3D Viewport)**:
    - A large, interactive R3F canvas.
    - **Default View**: A 3D graph of active 'Games of Life' and their connected projects.
    - **Interaction**: Click on a node to filter the 2D data below.
- **Bottom Section (2D Data Grid)**:
    - Detailed task lists, project notes, and research summaries.
    - Context-aware based on the 3D viewport selection.

## 3D Visualization Ideas
- **Agent Activity Nodes**: Pulsing spheres representing agent wake cycles and token usage.
- **Project Constellations**: Grouping related projects into visual clusters based on their 'Game' ID.
- **Legacy Timeline**: A 3D scrollable timeline of family milestones and project completions.

## Technical Stack
- **Frontend**: Next.js, Tailwind CSS, shadcn/ui.
- **3D Engine**: React Three Fiber, @react-three/drei.
- **Data Layer**: Local JSON/Markdown files (synced with agent workspaces).
