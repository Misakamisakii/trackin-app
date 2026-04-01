# Trackin' - 技术架构指南 (Technical Architecture Guide)

## 1. 整体架构概览

Trackin' 是一款前后台分离的全栈 Web 应用，主要针对多媒体（音频）和关系型数据进行管理。

### 1.1 技术选型

- **前端框架**：React 18 + Vite
- **状态管理**：Zustand / Redux Toolkit
- **样式方案**：TailwindCSS + Framer Motion (复杂动画) + Lucide React (图标)
- **图表与可视化**：Recharts / 自定义 SVG (实现进度管理) / DHTMLX Gantt (甘特图组件，或使用基于 CSS Grid 的自定义甘特图)
- **前端工具链**：TypeScript
- **后端架构**：Node.js (Express/NestJS) 或 Python (FastAPI) —— 建议首选 Node.js (TypeScript) 以保持全栈技术栈统一。
- **数据库**：PostgreSQL (Prisma ORM) / MongoDB
- **对象存储**：AWS S3 / 阿里云 OSS (用于存放高质量的音频文件，如 WAV)

## 2. 数据库设计 (ER 图指导)

### 2.1 核心实体

#### `Album` (专辑)
- id (UUID)
- title (String)
- artist (String)
- coverUrl (String)
- targetReleaseDate (Date)
- status (Enum: Planning, Tracking, Mixing, Mastering, Done)
- createdAt, updatedAt

#### `Track` (单曲)
- id (UUID)
- albumId (UUID, Foreign Key)
- title (String)
- order (Int)
- bpm (Int)
- key (String)
- notes (Text)
- status (Enum: Demo, Arrangement, Recording, Mixing, Mastering, Done)
- createdAt, updatedAt

#### `Version` (音频版本控制)
- id (UUID)
- trackId (UUID, Foreign Key)
- versionNumber (Int/String: e.g., "V1.0", "V2.3")
- audioUrl (String, S3 URL)
- stage (Enum: Demo, Recording, Mix, Master)
- changeLog (Text: 本次版本的修改内容)
- uploadedAt (Date)
- uploadedBy (String)

## 3. 前端应用架构 (基于 Vibe Coding & Frontend-Design Skill)

### 3.1 目录结构 (React)

```text
src/
├── assets/          # 静态资源 (流动的音符 SVG)
├── components/      # 可复用组件
│   ├── common/      # 通用组件 (Button, Modal, Input, Layout)
│   ├── album/       # 专辑相关组件 (AlbumCard, AlbumGrid)
│   ├── track/       # 单曲及版本控制组件 (VersionTree, AudioPlayer)
│   └── dashboard/   # 面板组件 (GanttChart)
├── hooks/           # 自定义 Hook (useAudio, useGantt)
├── pages/           # 页面级组件
│   ├── Landing/     # 首页 (浅绿色基调，大字体，流体音符)
│   ├── Dashboard/   # 专辑列表
│   └── AlbumView/   # 专辑详情工作区 (甘特图与版本管理)
├── services/        # API 交互层
├── store/           # 状态管理
├── styles/          # 全局样式 (index.css)
└── utils/           # 工具函数 (格式化时间，解析音频波形等)
```

### 3.2 关键实现路径

#### 第一阶段：前端脚手架与主页 (Landing Page)
1.  **Vite 初始化** React + TS 环境，安装 TailwindCSS 和 Framer Motion。
2.  **配置主色调**：在 `tailwind.config.js` 中定义 `sage-green` (`#a3b18a`, `#dad7cd` 等) 和深色 (`#1a1a1a`) 变量。
3.  **开发 Landing 页面**：
    -   实现巨型带阴影的 `Keep track of your track` 标题 (通过 `text-shadow` 或 SVG filter 实现高级阴影)。
    -   实现带微交互的 `Start tracking` 按钮。
    -   集成流动的黑色音符动画。

#### 第二阶段：核心业务逻辑与 Dashboard
1.  构建 **专辑列表** 页面 (网格布局，悬停特效)。
2.  实现 **专辑工作区布局** (侧边栏为单曲列表，主区域为甘特图或详情)。
3.  引入自定义甘特图组件。

#### 第三阶段：版本控制与音频播放器
1.  开发 **版本树 UI (Version Tree)**，参考 Git 提交历史的可视化。
2.  构建 **极简音频播放器 (Audio Player)**，支持进度条拖拽、音量控制。
3.  实现状态管理，处理音频版本切换试听逻辑。

#### 第四阶段：后端搭建与联调
1.  设计并搭建 Node.js 后端服务。
2.  配置对象存储 (S3) 处理大文件音频上传。
3.  前端对接 API。

## 4. Vibe Coding 指南 (结合 @frontend-design)

-   **审美极度克制**：在生成组件时，务必告知 Builder 采用 "Sage Green & Deep Black Minimalist" 风格。
-   **Typography 优先**：引入具有几何感的无衬线字体，通过字号大小对比建立层级，而不是仅仅依赖颜色。
-   **微小却致命的交互 (Micro-interactions)**：在版本切换、播放/暂停状态变更时，必须要有平滑的过渡动画。
-   **音符动画 (Fluid Notes)**：主页的音符流不应是俗气的 GIF，应考虑使用 Canvas/WebGL 或复杂的 CSS Keyframes 创建“高级、流动、深邃”的背景元素。
