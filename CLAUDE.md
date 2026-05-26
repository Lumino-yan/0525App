# 一念 Pip

闪念胶囊的速度 × AI 项目管理的深度。一个以「念头」为中心的轻量级项目管理工具，打开即记录，AI 自动整理、归类、拆解任务并主动提供指导。

## 语言

**所有回复必须使用中文。** UI 文案、代码注释、commit message 均为中文。

## 技术栈

| 层 | 选型 |
|---|---|
| 框架 | React 19 + TypeScript 5.9 |
| 构建 | Vite 7 |
| 样式 | Tailwind CSS 3.4（shadcn 主题） |
| 路由 | React Router 7 |
| 图标 | lucide-react |
| 持久化 | localStorage（key: `pip_data_v1`） |
| 移动端 | Capacitor 8（Android） |
| PWA | vite-plugin-pwa |

## 项目结构

```
src/
  main.tsx                    # 入口，BrowserRouter
  App.tsx                     # 路由定义
  index.css                   # 全局样式 + CSS 变量
  pages/
    CapturePage.tsx           # 主页（Tab 式布局：念头/项目/设置）
    ThoughtPage.tsx           # 念头详情（编辑、颜色、备注、关联项目）
    ReviewPage.tsx            # AI 整理结果审查
    ProjectPage.tsx           # 项目详情（任务列表 + AI 指导）
    SettingsPage.tsx          # 独立设置页（遗留，主要设置已迁入 CapturePage）
  components/
    capture/                  # 念头相关：CaptureBar, ThoughtBubble, InboxList
    project/                  # 项目相关：ProjectCard, TaskRow, GuidanceCard
    review/                   # AI 审查：SuggestionGroup
    ui/                       # shadcn/ui 组件库（50+ 组件，勿删）
  hooks/
    useApp.tsx                # 全局状态 Context（AppProvider + useApp）
  lib/
    types.ts                  # 所有数据模型定义
    storage.ts                # localStorage CRUD（含 seed 数据）
    engine.ts                 # 排序、进度计算、时间格式化
    llmService.ts             # 多服务商 AI 路由（Anthropic/DeepSeek/OpenAI）
```

## 路由

| 路径 | 页面 | 说明 |
|---|---|---|
| `/` | CapturePage | 主页，Tab 式三栏（念头/项目/设置） |
| `/thought/:id` | ThoughtPage | 念头详情：编辑、颜色标记、备注评论、关联项目跳转 |
| `/project/:id` | ProjectPage | 项目详情：任务列表、AI 指导卡片 |
| `/review` | ReviewPage | AI 整理建议审查 |
| `/settings` | SettingsPage | 独立设置页（遗留） |

## 设计系统（Animal Crossing / NookPhone 风格）

**绝对禁令**：不可使用纯黑 `#000`、纯白 `#FFF`、紫色系、荧光色。

| Token | 色值 | 用途 |
|---|---|---|
| 页面背景 | `#FFF8E1` | 所有页面背景 |
| 卡片背景 | `#FFFBEF` | 卡片、表面 |
| 主色 | `#9CCC65` / `#689F38` | 按钮、进度条、强调 |
| 叶绿 | `#C8E6C9` | 念头气泡（中性） |
| 琥珀 | `#FFECB3` | 指导卡片、警告 |
| 徽章 | `#EF9A9A` | 紧急标识 |
| 边框 | `#E8D5B0` | 暖色细分隔 |
| 主文字 | `#4E342E` | 标题、正文 |
| 次文字 | `#8D6E63` | 时间戳、辅助信息 |
| 圆角-卡片 | `rounded-2xl`（16px） | 卡片、面板 |
| 圆角-气泡 | `rounded-3xl`（24px） | 气泡、输入框 |

CSS 变量定义在 `src/index.css` 的 `:root` 中，HSL 格式。body 背景硬编码为 `#FFF8E1`。

## 数据模型

所有类型定义在 `src/lib/types.ts`。核心实体：

- **Thought** — 念头，最小捕获单元。字段：id, content, color(6种), projectId?, createdAt, processed
- **ThoughtNote** — 念头的备注评论，支持「以念头为中心」的持续生长
- **Task** — 项目拆解步骤。字段：id, projectId, content, completed, order
- **Project** — 项目。字段包含 urgency(4级), deadline, tasks[], aiSummary, pinned
- **Message** — 旧聊天消息（保留兼容）

`AppData` 聚合所有实体：`{ thoughts, thoughtNotes, tasks, projects, messages }`

## 存储层

`src/lib/storage.ts` 采用内存缓存 + localStorage 双写模式：
- `getData()` — 读取内存缓存，首次调用从 localStorage 加载
- 每个 CRUD 操作修改内存缓存后调用 `flushData()` 写回 localStorage
- `resetData()` — 恢复 seed 示例数据
- Storage key: `pip_data_v1`，旧版迁移 key: `momenta_data_v2`

## 全局状态

`src/hooks/useApp.tsx` — 所有数据操作通过 `useApp()` hook：
- CRUD: addThought, updateThought, deleteThought
- ThoughtNote: addThoughtNote, deleteThoughtNote
- AI: organizeInbox(), generateFocusGuidance(), generateProjectGuidance()
- 项目: createProjectFromThoughts()

## 构建与验证

```bash
npx tsc -b          # TypeScript 类型检查（必须零错误）
npx vite build      # 生产构建
npx vite            # 开发服务器（端口 3000）
```

**注意**：`npm run build` 会先执行 `tsc -b` 再 `vite build`，类型错误会导致构建失败。

### Android APK 构建

```bash
# 环境变量（每次新终端 session 需要设置）
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools

# 构建
npx cap sync android
cd android && ./gradlew assembleDebug

# APK 输出位置
# android/app/build/outputs/apk/debug/app-debug.apk
```

**依赖**：`openjdk@21`、`android-commandlinetools`、`android-platform-tools`（均通过 Homebrew 安装）。SDK 组件（platform-tools, build-tools, platforms）由 Gradle 自动下载。

## Git 规范

```bash
# 提交前必须验证编译通过
npx tsc -b

# Commit message 格式：中文 + conventional commits
# feat: 新功能
# fix: 修复
# style: 样式/UI 调整
# refactor: 重构
```

**规则**：
- 所有 commit message 使用中文
- 直接提交到 `main` 分支（单人项目）
- 不要 force push
- 不要使用 `--no-verify` 跳过检查
- `.gitignore` 已覆盖 node_modules、dist、.env、Android 构建产物、IDE 文件

## 敏感数据检查

**每次提交前必须确认以下内容不在仓库中：**
- 真实 API Key（所有代码中仅用占位符 `sk-ant-...`、`sk-...`）
- `.env` 文件内容（文件本身已 gitignore，仅 `.env.example` 保留占位符）
- Android keystore（`.jks`、`.keystore`）
- 个人身份信息（手机号、身份证号、真实地址等）
- 第三方服务的 client secret / token

**种子数据规则**：`storage.ts` 中的 `seedDemoData()` 只能包含虚构的示例项目、任务、念头。所有 demo 数据需明显是示例性质（如 "Q3 产品改版"、"品牌手册设计" 这类泛化名称）。

## 常见问题

1. **未使用的 import** — tsc 会报 TS6133 错误。删除未使用的 import 即可。
2. **存储字段缺失** — 如果扩展了类型但未更新 `seedDemoData()`，旧数据可能缺少新字段。
3. **ThoughtNote 向后兼容** — storage.ts 中所有 ThoughtNote 操作都用了 `if (!d.thoughtNotes)` 兜底检查。
4. **shadcn/ui 组件** — 位于 `src/components/ui/`，共 50+ 个。即使当前未全部使用也勿删除，它们是项目脚手架的一部分。
