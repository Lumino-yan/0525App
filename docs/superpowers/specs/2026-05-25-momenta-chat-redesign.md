# Momenta Chat Redesign — Design Spec

**Date**: 2026-05-25
**Status**: Approved

---

## 1. Motivation

Transform "瞬目纪 MOMENTA" from a traditional tab-based todo app into a **WeChat-like intelligent PM assistant**.

### Problems with current design

- Tab-based navigation (Today / Projects / New / Settings) is generic — feels like every other todo app
- "Today" shows static cards instead of proactively telling the user what to do
- Adding progress logs requires navigating through multiple screens
- The smart ranking engine (`engine.ts`) works well but its output is buried in card lists
- No natural language interaction — everything is form-based

### Target experience

- Open the app → see a message list (like WeChat), each project is a conversation
- System proactively pushes messages: reminders, suggestions, status updates
- User responds in natural language to record progress, create projects, or ask questions
- LLM parses intent, engine computes state, system replies with structured feedback
- Packaged as a native Android APK via Capacitor

---

## 2. UI Design Decisions

All decisions confirmed via visual prototyping:

| Screen | Decision | Key characteristics |
|--------|----------|---------------------|
| Home message list | **WeChat skeleton + inline progress** | Avatar, project name, last message preview, red badge, progress bar visible per row. Sorted by smart priority. |
| Chat / project detail | **Active PM assistant** | System messages have full personality: greet, suggest, warn, confirm. Orange background for alerts. User messages are green bubbles (progress logs). |
| New project creation | **Smart hybrid** | Default: one-sentence parsing by LLM. If information is insufficient, system asks clarifying follow-ups. |

### 2.1 Visual Style: Animal Crossing / NookPhone

Overall aesthetic draws from Animal Crossing: New Horizons — warm, cozy, playful, tactile.

**Color Palette:**

| Token | Hex | Usage |
|-------|-----|-------|
| `cream` | `#FFF8E1` | Page background |
| `warm-white` | `#FFFBEF` | Card / bubble background |
| `soft-green` | `#9CCC65` | Primary accent, progress bars, send button |
| `deep-green` | `#689F38` | Primary text on green, hover states |
| `warm-brown` | `#8D6E63` | Secondary text, subtle borders |
| `soft-teal` | `#80CBC4` | System message background, secondary accent |
| `warm-amber` | `#FFB74D` | Alert/warning background |
| `soft-red` | `#EF9A9A` | Critical badge, overdue indicators |
| `leaf-green` | `#7CB342` | User message bubble (like AC grass) |

**Design Tokens:**

- Border radius: `rounded-2xl` (16px) for cards, `rounded-3xl` (24px) for bubbles
- Shadows: soft, low-elevation — `shadow-sm` with warm tint
- Typography: system font, slightly bolder weights, playful but readable
- Icons: `lucide-react` rounded/playful variants where available
- Spacing: generous padding (16px+), breathing room

**Key Visual References:**
- Nook Stop terminal: green/cream card-based interface
- NookPhone: rounded white app launcher with colorful icons
- Nook Shopping: grid cards with soft shadows
- General AC: warm lighting, paper-like textures, no harsh colors

---

## 3. Data Model

### 3.1 Message (replaces ProgressLog)

```typescript
interface Message {
  id: string;
  projectId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  type: 'log' | 'suggestion' | 'alert' | 'create' | 'summary';
  metadata?: {
    progressBefore?: number;
    progressAfter?: number;
    parsedIntent?: string;
  };
  timestamp: number;
}
```

**Rationale**: Progress logs and system responses are both messages in a chat. A single unified model eliminates the separate `ProgressLog` type and enables natural conversation rendering.

### 3.2 Project (extended)

```typescript
interface Project {
  id: string;
  name: string;
  description: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  deadline: string | null;
  createdAt: number;
  updatedAt: number;
  completed: boolean;
  completedAt: number | null;
  manualProgress: number | null;
  // NEW fields
  pinned: boolean;
  lastMessagePreview: string;
  lastMessageAt: number;
}
```

### 3.3 SmartTask (unchanged)

Used internally by `engine.ts` for ranking. Not stored — computed from projects and messages.

### 3.4 AppData

```typescript
interface AppData {
  projects: Project[];
  messages: Message[];  // was: logs
}
```

---

## 4. LLM Integration

### 4.1 Dual-layer architecture

```
User sends message
  │
  ├─► Local engine (engine.ts)
  │     • Estimate progress
  │     • Re-rank message list
  │     • Generate immediate system acknowledgment
  │     • Returns: quick system reply (optimistic)
  │
  └─► LLM API (Anthropic)
        • Parse natural language intent
        • Extract structured data (project name, deadline, urgency)
        • Generate contextual suggestion for next steps
        • Returns: enriched system reply (replaces optimistic reply)
```

### 4.2 Call strategy

| Trigger | LLM called? | Purpose |
|---------|-------------|---------|
| User sends a progress message | Yes | Parse content, update progress, suggest next step |
| User creates a project | Yes | Extract name, priority, deadline from natural language |
| User asks a question ("进度如何?") | Yes | Generate project summary |
| App opens (system proactive check) | No | Local engine checks staleness, deadline proximity |
| User browses chat history | No | Read-only, no input to process |

### 4.3 API Key management

- Build-time default key embedded via Vite env var (`VITE_ANTHROPIC_API_KEY`)
- Settings page allows overriding the key at runtime
- Key stored in localStorage (encrypted at rest is a future enhancement)

### 4.4 Prompt design principles

- System prompt defines Momenta's personality: proactive, concise, helpful PM
- Tool use: LLM returns structured JSON for intent parsing (not free-text)
- Caching: anthropic-beta prompt caching enabled for static system prompt portion

---

## 5. Component Architecture

### 5.1 Routing

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `MessageListPage` | Home — conversation list sorted by smart priority |
| `/chat/:id` | `ChatPage` | Project conversation with message bubbles |
| `/new-chat` | `NewChatPage` | Chat-based project creation flow |
| `/settings` | `SettingsPage` | API key, data management, about |

Removed routes: `/projects`, `/project/:id`, `/new-project`, `/edit-project/:id`, `/add-log/:id`

### 5.2 Component tree

```
App
├── MessageListPage
│   ├── SearchBar
│   ├── ConversationRow[]        ← project name, avatar, last message, progress bar, badge
│   └── EmptyState
│
├── ChatPage
│   ├── ChatHeader               ← back button, project name, progress bar
│   ├── MessageBubble[]          ← system (white, left-aligned) or user (green, right-aligned)
│   │   ├── SystemBubble         ← suggestion, alert, confirmation variants
│   │   └── UserBubble           ← progress log
│   ├── QuickReplyChips          ← optional: contextual quick replies from system
│   └── ChatInput                ← text input + send button + voice button (future)
│
├── NewChatPage
│   └── (reuses ChatPage components, project created on first message)
│
└── SettingsPage
    ├── ApiKeyInput
    ├── DataStats
    └── DangerZone
```

### 5.3 Navigation

Bottom tab bar is **removed**. Navigation is:
- Message list → chat: push navigation (standard mobile back button)
- New chat: "+" button in message list header
- Settings: gear icon in message list header
- Chat → back: system back button or ← in header

---

## 6. Data Flow

### 6.1 Recording progress (happy path)

```
1. User types "首页高保真设计做完了" in ChatInput
2. Message sent → ChatPage adds user bubble (optimistic)
3. useApp hook calls engine.estimateProgress() → updates progress
4. useApp hook calls llmService.parseMessage() → sends to Anthropic API
5. LLM returns: { intent: "log", progressUpdate: 72, suggestion: "下一步做用户中心页面" }
6. System message created with structured feedback
7. ChatPage re-renders with system reply
8. Message list re-sorted (project may move up/down based on new priority)
```

### 6.2 Creating a project

```
1. User types "帮我做Q3产品改版，下周五截止，很急" in NewChatPage
2. LLM returns: { intent: "create", name: "Q3产品改版", deadline: "2026-05-30", urgency: "critical" }
3. Project created, system replies with confirmation card
4. User is navigated to /chat/:newId
5. System sends first proactive message: "项目已创建，建议第一步做什么？"
```

### 6.3 Proactive system message (app open)

```
1. App opens → useApp triggers generateSmartTasks()
2. For each "now" urgency project, check if a system alert was already sent today
3. If not, insert a system message into that project's chat
4. Message list shows updated preview and red badge
```

---

## 7. Preservation of Existing Engine

`engine.ts` is preserved as the **fast local layer**:

- `estimateProgress()` — unchanged, still computes from message count (was log count)
- `generateSmartTasks()` — unchanged, still ranks projects by composite score
- Formatting utilities — unchanged

New functions to add in a separate `llmService.ts`:

- `parseMessage(content, projectContext)` → calls Anthropic API
- `generateSuggestion(project)` → generates next-step advice
- `extractProjectInfo(content)` → parses natural language into project fields

---

## 8. Capacitor Packaging

### 8.1 Setup

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init Momenta com.momenta.app --web-dir dist
npx cap add android
```

### 8.2 Build pipeline

```bash
vite build          # produces dist/
npx cap sync        # copies dist/ to android/
npx cap open android # opens Android Studio for APK build
```

### 8.3 Native features (future)

- Voice input: Capacitor VoiceRecorder plugin or Android SpeechRecognizer
- Push notifications: Capacitor Push Notifications + Firebase Cloud Messaging
- Background sync: Capacitor BackgroundTask plugin

---

## 9. Error Handling

| Scenario | Strategy |
|----------|----------|
| LLM API call fails | Show local engine's optimistic response, add a subtle "AI 分析暂不可用" note |
| LLM returns unparseable JSON | Fall back to local engine, log error silently |
| localStorage full | Warn user, suggest clearing old completed projects |
| Network offline | App works fully with local engine, messages queued for LLM processing when back online |
| Project not found (bad URL) | Show "项目不存在" with back navigation |

---

## 10. Migration from Old App

Since this is a complete UI rewrite with data model changes, migration strategy:

1. On first load, detect old data format (`logs` key instead of `messages`)
2. Convert old `ProgressLog[]` to `Message[]` with `role: 'user'`, `type: 'log'`
3. Generate initial system messages for each project based on current state
4. Save in new format under a new storage key (`momenta_data_v2`)
5. Keep old key for one version as backup

---

## 11. Out of Scope (v1.0)

- Backend server / cloud sync
- Push notifications via FCM
- Voice input
- Multi-device sync
- Team/collaboration features
- Dark mode (foundation laid but not implemented)

---

## 12. File Structure (new)

```
app/src/
├── main.tsx
├── App.tsx                    ← Router only, no tab bar
├── App.css
├── index.css
├── lib/
│   ├── types.ts               ← Updated data model
│   ├── engine.ts              ← Preserved, adapted for Message[]
│   ├── storage.ts             ← Updated for v2 data format
│   ├── llmService.ts          ← NEW: Anthropic API calls
│   └── utils.ts
├── hooks/
│   └── useApp.tsx             ← Updated context
├── pages/
│   ├── MessageListPage.tsx    ← NEW: WeChat-style home
│   ├── ChatPage.tsx           ← NEW: project conversation
│   ├── NewChatPage.tsx        ← NEW: conversational creation
│   └── SettingsPage.tsx       ← Updated
├── components/
│   ├── chat/
│   │   ├── ChatHeader.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── SystemBubble.tsx
│   │   ├── UserBubble.tsx
│   │   └── ChatInput.tsx
│   ├── list/
│   │   ├── ConversationRow.tsx
│   │   └── SearchBar.tsx
│   └── ui/                    ← shadcn components (keep existing)
└── types/                     ← (merged into lib/types.ts)
```
