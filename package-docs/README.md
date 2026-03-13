# ThreadNote AI User Manual

## What This Package Is
This package contains the offline Microsoft Edge extension build for ThreadNote AI.

After you unzip it, you can install the extension manually in Edge without using a browser store.

## Install in Edge (Developer Mode)
1. Save the zip file to your computer.
2. Unzip it to a folder you can keep for long-term use.
3. Open Microsoft Edge.
4. Enter `edge://extensions` in the address bar.
5. Turn on `Developer mode` in the extensions page.
6. Click `Load unpacked`.
7. Select the unzipped extension folder.
8. Confirm that `ThreadNote AI` appears in your extension list.
9. Pin the extension from the Edge toolbar if you want faster access.

Important:
- Do not choose the zip file directly. You must choose the unzipped folder.
- When Edge asks you to choose a folder, select the folder that contains `manifest.json`.
- Keep the unzipped folder in place after installation. If you delete or move it, Edge will not be able to load the extension correctly.
- This package is intended for a limited trial group, so installation is done through `Developer mode` and `Load unpacked`.

## Before You Start
Before using the extension, make sure you have:
- A working API key from at least one supported AI provider
- Microsoft Edge with Developer mode enabled
- Permission to use local browser storage on your machine

Supported providers in the current app include:
- MiniMax
- Zhipu GLM
- DeepSeek
- OpenAI
- Anthropic
- Google Gemini
- Custom OpenAI-compatible providers

## First-Time Setup
1. Open the ThreadNote AI extension from the Edge toolbar.
2. Open `Settings`.
3. Add the API key for the provider you want to use.
4. Choose the main chat model.
5. Choose the sub-session model.
6. Save your settings if the page prompts you to do so.
7. Start a new chat and send a short test message.

## Recommended First-Use Flow
For the smoothest first experience, use this order:
1. Install the extension in Edge.
2. Open the extension and add one API key.
3. Send one short main-chat question to confirm the connection works.
4. Try selecting part of an AI reply and open a sub-session.
5. Add one useful result to Notebook.
6. Export your data once after setup so you have a clean backup.

This path helps confirm the extension, model access, sub-sessions, and note storage are all working on your machine.

## Install Troubleshooting
| If you see this | Likely cause | What to try |
|---|---|---|
| `Load unpacked` is missing or disabled | `Developer mode` is still off | Open `edge://extensions` and turn on `Developer mode` first |
| Edge refuses the folder | You selected the zip file or the wrong folder level | Unzip the package fully and select the folder that contains `manifest.json` |
| The extension appears but does not open | The extracted folder was moved, deleted, or partially overwritten | Remove the unpacked extension in Edge and load the current folder again |
| The new version does not seem updated | Edge is still using the old unpacked folder | Remove the old version, then use `Load unpacked` on the new folder |
| The extension opens but chat fails immediately | API key or model setup is incomplete | Open `Settings`, verify the API key, and try one short test message |

## Main Chat
- Click `New Chat` to start a new conversation.
- Type your question and send it.
- The main chat can ask up to 3 models in parallel.
- When multiple replies appear, compare them and keep the best one as the main context when needed.
- Click `Stop` if you want to stop a reply that is still being generated.

## Sub-Sessions
- Select text from an AI reply to create or open a sub-session.
- Use sub-sessions for follow-up exploration without disrupting the main thread.
- `Keep` means future turns can continue using the saved main-thread snapshot plus the sub-session history.
- `New` means future turns use only the sub-session history.
- You can add useful sub-session content to your notes.

## Notebook
- Use the `Notebook` tab to manage Markdown notes.
- Focus inside the editor to edit raw Markdown.
- Blur the editor to preview the rendered result.
- Right-click a note to delete it or export it as Markdown.

## Import and Export
- Notebook data can be exported for backup and imported later.
- AI configuration can be exported and imported from Settings.
- AI chat history can also be exported and imported from Settings.
- Export a backup before large imports or major cleanup.

## Before You Upgrade
Before installing a newer version, export these items first:
- AI chat history
- AI configuration
- Notebook data

## Update to a New Version
When you receive a newer offline package:
1. Export important data first if you want a safety backup.
2. Unzip the new package to a new folder or replace the old folder contents.
3. Open `edge://extensions`.
4. Remove the old unpacked ThreadNote AI extension, or use `Reload` after pointing Edge to the updated folder if you manage the same folder carefully.
5. Click `Load unpacked` and choose the new unzipped folder.
6. Open the extension and confirm your settings and data still look correct.

Recommended:
- Keep one backup export before every upgrade.
- Avoid editing or deleting the extension folder while Edge is using it.

## Troubleshooting
- If a model request fails immediately, check the API key and selected model in Settings.
- If the extension does not open after installation, remove it from `edge://extensions` and load the unpacked folder again.
- If the extension breaks after an update, remove the old unpacked version and reinstall from the new package.
- If imported data looks wrong, restore from your latest backup export.

## Data and Safety Notes
- Chat sessions and notes are stored locally in your browser profile.
- API keys and model settings are stored locally in browser storage.
- Changing browser profile or device does not sync your data automatically.
- Keep your API keys private.
- Share the offline package only with people you trust.
