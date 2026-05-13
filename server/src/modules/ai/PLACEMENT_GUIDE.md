# AI Admin Analytics — File Placement Guide

## SERVER FILES (Backend)
Place every file inside your existing `server/src/modules/` folder.

```
server/src/modules/ai/
├── ai.controller.js          ← handles POST /api/ai/query
├── ai.routes.js              ← registers the route + auth guard
├── ai.service.js             ← core agent loop (tool calling logic)
├── toolRegistry.js           ← maps tool names → functions
├── prompts/
│   └── systemPrompt.js       ← tells the LLM what it can do
├── tools/
│   ├── orders.tools.js       ← revenue, peak hours, cancellations
│   ├── restaurants.tools.js  ← top / underperforming restaurants
│   └── users.tools.js        ← user growth stats
└── providers/
    ├── openrouter.provider.js ← production LLM (OpenRouter API)
    └── ollama.provider.js     ← local dev LLM (Ollama)
```

---

## FRONTEND FILE (Admin)
Place this inside your admin app's pages folder, alongside your
existing Restaurants, Orders pages.

```
admin/src/pages/AIAnalytics.jsx
```

---

## 2 THINGS TO WIRE UP

### 1. Register the route in your server's app.js / server.js

```js
import aiRoutes from "./modules/ai/ai.routes.js";
app.use("/api/ai", aiRoutes);
```

### 2. Add a tab to your admin sidebar / navbar

```jsx
// wherever your nav links live (e.g. Sidebar.jsx or Navbar.jsx)
<NavLink to="/ai-analytics">🤖 AI Analytics</NavLink>
```

Then in your router (e.g. App.jsx):

```jsx
import AIAnalytics from "./pages/AIAnalytics";
// ...
<Route path="/ai-analytics" element={<AIAnalytics />} />
```

---

## ENV VARIABLES TO ADD

### server/.env
```
NODE_ENV=development          # switch to "production" on Railway/Render
OPENROUTER_API_KEY=sk-or-...  # get from openrouter.ai
OLLAMA_MODEL=qwen2.5:14b      # optional, defaults to qwen2.5:14b
```

---

## PACKAGES TO INSTALL

### Server
```bash
npm install openai ollama
```

### Admin (frontend)
No new packages needed — uses only React built-ins.

---

## 3 IMPORT PATHS TO ADJUST

Open these files and fix the model import paths to match YOUR project:

| File | What to fix |
|------|------------|
| tools/orders.tools.js | `import Order from "../../orders/order.model.js"` |
| tools/restaurants.tools.js | `import Order` and `import Restaurant` paths |
| tools/users.tools.js | `import User from "../../users/user.model.js"` |
| ai.routes.js | `import { verifyAdmin } from "../../middlewares/auth.middleware.js"` |

---

## TEST IT
Once running, open the AI Analytics tab and try:
- "How is revenue looking this month?"
- "Which restaurants are underperforming?"
- "Show peak order hours this week"
