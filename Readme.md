# ThreadNote AI User Guide

## 1. What This App Does
ThreadNote AI is a web chat client for multiple AI providers.  
It supports:
- Main chat
- Nested sub-session chat from selected AI reply text
- Notebook mode (Markdown notes)
- Local history persistence

## 2. Requirements
- Node.js 18+ recommended
- npm
- Modern browser (Chrome/Edge recommended)

## 3. Start the App
1. Open terminal in project root.
2. Install dependencies:
   - `npm install`
3. Start dev server:
   - `npm run dev`
4. Open the local URL shown in terminal.

## 4. Build for Production
1. `npm run build`
2. Built files are in `dist/`
3. Deploy `dist/` with a static web server.

## 5. Basic Usage
### AI Tab
- Click `New Chat` to start.
- Type question and press Enter or Send.
- While generating, click `Stop` to stop response.
- Right-click a user question in main chat to delete that turn.
- Main chat can ask up to 3 models at the same time.
- When multiple models reply, use tabs to compare answers, then keep the most reliable reply as the main context by choosing `Set as primary`.
- Switching tabs only changes what you are viewing. It does not change the context chain unless you explicitly set that tab as primary.

### Sub-session
- In AI reply, select text and create/open sub-session.
- Sub-session has independent context from main thread.
- In sub-session reply, right-click to `Add to note`.

### Notebook Tab
- Left side shows note list.
- Click note to open/edit.
- Editing is Typora-like:
  - focus in editor: raw markdown
  - blur: rendered markdown

## 6. Notes Operations
On Notebook tab:
- Right-click a note:
  - `Delete` (with confirmation)
  - `Export Markdown` (current note)

- Bottom actions:
  - `Clear All Notes`
  - `Settings`

Notebook Settings:
- `Export All Notes to Directory`
  - If browser supports directory picker, writes `.md` files + manifest JSON.
  - If not supported, downloads one export JSON file instead.
- `Import Notes from Export File`
  - Select exported JSON file to import notes.

## 7. AI Model Settings
In AI tab, open `Settings`:
- Configure API keys per provider.
- Configure main thread model.
- Configure sub-thread model.

### Main Chat Multi-model Logic
- The app can send one main-chat question to 1 to 3 models in parallel.
- The purpose of multi-model reply is to let you compare different answers for the same question and keep the best one as the ongoing main-thread context.
- The chat does not maintain one long-running context chain per tab or per slot.
- Only the current main-thread primary reply is appended into the main context chain for later questions.
- Replies from other models in the same round are still saved and viewable in tabs, but they are not automatically inherited by later rounds.
- If you switch to single-model mode for one round, that round still becomes part of the same main context chain.
- If you later switch back to multiple models, all selected models receive that same accumulated main-thread context, including the single-model round in between.
- Reordering selected models affects which model becomes the default primary for the new round, but it does not create separate context histories.
- Default model slots in Settings are only defaults for future selection order. They are not independent context slots.

Supported providers include:
- MiniMax
- Zhipu GLM
- DeepSeek
- OpenAI

## 8. Data Storage
- Chat sessions/messages/notes are saved in browser IndexedDB.
- API keys and model choices are saved in browser localStorage.
- Data is local to the browser profile and device.

## 9. Troubleshooting
Q: I changed browser/device and data is missing.  
A: Data is local and does not sync automatically.

Q: Model call fails immediately.  
A: Check provider API key in Settings and verify selected model.

Q: Export all notes does not ask for folder.  
A: Your browser may not support directory picker; app will export a JSON file fallback.

## 10. Safety Notes
- Keep your API keys private.
- Imported notes may replace current notes in current implementation.
- Export backup before large imports if needed.
