# Icon Architecture Guide / Icon 渲染架构指南

> **Purpose**: Document the icon injection architecture to prevent regression during future updates.  
> **目的**：记录 icon 注入架构，防止未来更新时走弯路。

---

## 1. Icon Rendering Pipeline / Icon 渲染链路说明

### 1.1 Chat History Sidebar Icons / 左侧历史聊天列表 Icon

**Location**: Left sidebar conversation list  
**位置**：左侧聊天历史列表

**Data Source**:
- Driven by message-level and model-level icon logic
- Components: `MessageIcon`, `getModelSpecIconURL`, etc.
- These icons reflect the **actual model used** in each conversation

**数据来源**：
- 由 message / model 级别的 icon 逻辑驱动
- 相关组件：`MessageIcon`、`getModelSpecIconURL` 等
- 这些 icon 反映每个会话**实际使用的模型**

---

### 1.2 Model Selector Menu Icons / 模型选择菜单 Icon

**Location**: Endpoint dropdown menu (top of chat interface)  
**位置**：模型选择下拉菜单（聊天界面顶部）

**Critical Architecture / 关键架构**：

```
Backend YAML (librechat.yaml)
  ↓
  iconURL / modelIcons fields are NOT used for menu
  后端 YAML 的 iconURL / modelIcons 字段「不」透传到菜单
  ↓
Frontend Endpoints Fetch & Normalize (useEndpoints.ts)
  ↓
  resolveEndpointIconURL(endpoint) ← Inject iconURL here
  在此处注入 endpoint.iconURL
  ↓
Menu Component (MinimalIcon.tsx)
  ↓
  Consumes endpoint.iconURL
  直接消费 endpoint.iconURL
```

**⚠️ Important**: The model selector menu does NOT read `iconURL` or `modelIcons` from `librechat.yaml` in the current architecture.

**⚠️ 重要**：当前架构下，模型选择菜单「不」读取 `librechat.yaml` 中的 `iconURL` 或 `modelIcons`。

---

## 2. Correct Implementation / 已验证的正确做法

### ✅ DO / 正确做法

1. **Inject icons during endpoint normalization**  
   **在 endpoints 归一化阶段注入 icon**

   ```typescript
   // File: client/src/hooks/Endpoint/useEndpoints.ts
   const resolvedIconURL = resolveEndpointIconURL({
     name: endpointConfig?.name ?? ep,
     models: endpointConfig?.models,
     baseURL: endpointConfig?.baseURL,
   });

   const result: Endpoint = {
     value: ep,
     label: alternateName[ep] || ep,
     iconURL: resolvedIconURL ?? undefined,
     // ...
   };
   ```

2. **Centralize icon mapping logic**  
   **集中管理 icon 映射逻辑**

   All icon mapping rules live in:  
   所有映射规则位于：
   ```
   client/src/utils/endpointIcons.ts → resolveEndpointIconURL()
   ```

3. **Menu components consume `endpoint.iconURL` directly**  
   **菜单组件直接消费 `endpoint.iconURL`**

   ```typescript
   // File: client/src/components/Endpoints/MinimalIcon.tsx
   if (iconURL && iconURL.startsWith('/assets/')) {
     return <img src={iconURL} alt="..." />;
   }
   ```

---

### ❌ DON'T / 错误做法

1. ❌ **Do NOT add provider-guessing logic in MinimalIcon.tsx**  
   ❌ **不要在 MinimalIcon.tsx 中添加 provider 猜测逻辑**

   ```typescript
   // BAD - Do not do this!
   if (props.name?.includes('OpenAI')) return '/assets/openai.svg';
   ```

2. ❌ **Do NOT expect `librechat.yaml` iconURL to work for menu icons**  
   ❌ **不要期望通过 librechat.yaml 的 iconURL 控制菜单 icon**

   Current version does not pass these fields to the frontend menu.  
   当前版本不会将这些字段透传到前端菜单。

3. ❌ **Do NOT scatter icon logic across multiple components**  
   ❌ **不要在多个组件中分散 icon 逻辑**

   Keep all detection rules in `resolveEndpointIconURL()`.  
   将所有检测规则集中在 `resolveEndpointIconURL()` 中。

---

## 3. Current Icon Mapping Rules / 当前 Icon 映射规则

**Detection Priority / 检测优先级**:
1. `endpoint.name` (string)
2. `endpoint.models.default` (array, first item)
3. `endpoint.baseURL` (string)

**Pattern Matching / 模式匹配**:

| Provider / 提供商        | Trigger Keywords / 触发关键词                          | Icon Path / Icon 路径       |
|--------------------------|-------------------------------------------------------|----------------------------|
| re-AI-Radio              | `re-ai-radio`, `propose`                              | `/assets/re-ai-radio.svg`  |
| OpenAI / ChatGPT         | `openai`, `chatgpt`, `gpt-`                           | `/assets/openai.svg`       |
| Google / Gemini          | `google`, `gemini`, `gemini-`                         | `/assets/google.svg`       |
| Anthropic / Claude       | `anthropic`, `claude`, `claude-`                      | `/assets/anthropic.svg`    |
| xAI / Grok               | `xai`, `grok`                                         | `/assets/xai.svg`          |
| DeepSeek                 | `deepseek`                                            | `/assets/deepseek.svg`     |
| DOUBAO / Ark             | `doubao`, `ark-`, `volces`, `豆包`                    | `/assets/doubao.svg`       |
| Moonshot / Kimi          | `moonshot`, `kimi`, `月之暗面`                         | `/assets/moonshot.svg`     |

**Implementation**: See `client/src/utils/endpointIcons.ts` for the complete logic.  
**实现代码**：完整逻辑见 `client/src/utils/endpointIcons.ts`。

---

## 4. How to Add / Modify Icons / 如何新增或修改 Icon

### Checklist for Future Engineers / 未来工程师的操作清单

#### Step 1: Add SVG Asset / 添加 SVG 资源

```bash
# Place your icon file here:
client/public/assets/your-provider.svg
```

**Requirements**:
- Use SVG format (recommended)
- Suggested size: 32x32px or scalable
- Ensure proper licensing

**要求**：
- 使用 SVG 格式（推荐）
- 建议尺寸：32x32px 或可缩放
- 确保有合适的授权

---

#### Step 2: Update Icon Mapping Logic / 更新映射逻辑

Edit `client/src/utils/endpointIcons.ts` and add your detection rule:

```typescript
export function resolveEndpointIconURL(endpoint: {
  name?: string;
  models?: { default?: string[] | string };
  baseURL?: string;
}): string | null {
  // ... existing code ...

  // Add your new provider here
  if (searchString.includes('your-provider') || searchString.includes('alternative-name')) {
    return '/assets/your-provider.svg';
  }

  return null;
}
```

**Tips**:
- Add detection keywords for `name`, `models`, and `baseURL` patterns
- Use lowercase matching (the function converts to lowercase)
- Support both English and Chinese keywords if applicable

**提示**：
- 为 `name`、`models`、`baseURL` 添加检测关键词
- 使用小写匹配（函数会自动转换为小写）
- 如适用，支持中英文关键词

---

#### Step 3: Test Your Changes / 测试修改

1. **Restart the development server**:
   ```bash
   npm run dev
   ```

2. **Check the model selector menu**:
   - Open the endpoint dropdown
   - Verify your icon appears correctly
   - Check browser console for any errors

3. **Test edge cases**:
   - Different `name` values in YAML
   - Different `models.default` values
   - Different `baseURL` patterns

---

#### Step 4: What You DON'T Need to Change / 不需要修改的部分

✅ **No changes needed in**:
- ❌ `librechat.yaml` (backend config does NOT affect menu icons)
- ❌ `MinimalIcon.tsx` (it already consumes `endpoint.iconURL`)
- ❌ `useEndpoints.ts` (it already calls `resolveEndpointIconURL`)

**不需要修改**：
- ❌ `librechat.yaml`（后端配置不影响菜单 icon）
- ❌ `MinimalIcon.tsx`（已经会消费 `endpoint.iconURL`）
- ❌ `useEndpoints.ts`（已经会调用 `resolveEndpointIconURL`）

---

## 5. Architecture Diagram / 架构图

```
┌─────────────────────────────────────────────────────────────┐
│  Backend (librechat.yaml)                                   │
│  - iconURL: not used for menu (当前不透传到菜单)             │
│  - modelIcons: not used for menu                            │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Frontend: useEndpoints.ts                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ resolveEndpointIconURL({                              │  │
│  │   name: endpoint.name,                                │  │
│  │   models: endpoint.models,                            │  │
│  │   baseURL: endpoint.baseURL                           │  │
│  │ })                                                    │  │
│  │         ↓                                             │  │
│  │   Inject endpoint.iconURL                             │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Frontend: MinimalIcon.tsx                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ if (iconURL.startsWith('/assets/'))                   │  │
│  │   return <img src={iconURL} />                        │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
                  ┌───────────────┐
                  │  User sees    │
                  │  correct icon │
                  └───────────────┘
```

---

## 6. Troubleshooting / 故障排查

### Problem: Icon not showing in menu / 菜单中不显示 icon

**Check**:
1. Is the SVG file in `client/public/assets/`?
2. Did you add the pattern to `resolveEndpointIconURL()`?
3. Are your detection keywords matching the endpoint config?
4. Check browser console for 404 errors

**排查**：
1. SVG 文件是否在 `client/public/assets/` 中？
2. 是否在 `resolveEndpointIconURL()` 中添加了匹配规则？
3. 检测关键词是否与 endpoint 配置匹配？
4. 检查浏览器控制台是否有 404 错误

---

### Problem: Icon showing in history but not in menu / Icon 在历史记录显示但不在菜单显示

**Explanation**: These are two different pipelines.

- **History icons**: Use message/model-level logic
- **Menu icons**: Use endpoint-level injection (this guide's focus)

**Make sure you updated** `resolveEndpointIconURL()`, not just `MessageIcon` or other message-level components.

**解释**：这是两个不同的渲染管道。

- **历史记录 icon**：使用 message/model 级逻辑
- **菜单 icon**：使用 endpoint 级注入（本指南重点）

**确保修改了** `resolveEndpointIconURL()`，而不仅是 `MessageIcon` 等 message 级组件。

---

## 7. Related Files / 相关文件

| File Path / 文件路径                                | Purpose / 用途                          |
|-----------------------------------------------------|----------------------------------------|
| `client/src/utils/endpointIcons.ts`                 | Icon mapping logic / Icon 映射逻辑     |
| `client/src/hooks/Endpoint/useEndpoints.ts`         | Endpoint normalization / Endpoint 归一化 |
| `client/src/components/Endpoints/MinimalIcon.tsx`   | Icon rendering component / Icon 渲染组件 |
| `client/public/assets/*.svg`                        | Icon assets / Icon 资源文件             |

---

## 8. Future Improvements / 未来改进方向

Potential enhancements (not currently implemented):

1. **Make `librechat.yaml` iconURL work for menus**  
   Allow backend config to override frontend icon detection

2. **Per-model icons in menu**  
   Currently only endpoint-level icons are shown

3. **Dynamic icon loading**  
   Support loading icons from URLs instead of just `/assets/`

未来可能的改进方向（当前未实现）：

1. **让 `librechat.yaml` 的 iconURL 对菜单生效**  
   允许后端配置覆盖前端 icon 检测

2. **菜单中的每模型 icon**  
   当前仅显示 endpoint 级 icon

3. **动态 icon 加载**  
   支持从 URL 加载 icon，而不仅是 `/assets/`

---

## Questions? / 有疑问？

If this guide is unclear or outdated, please update it!

如果本指南不清晰或已过时，请更新它！

**Last Updated**: 2026-01-10  
**最后更新**：2026-01-10
