<div align="center">

<img src="https://github.com/user-attachments/assets/fd7f2ed1-5855-465c-a3b7-36df24f24b8d" alt="writeSimply" />

# writeSimply

**A minimal, distraction-free desktop writing app — offline-first, no accounts, no subscriptions.**

Cross-platform (Linux · macOS · Windows) desktop app built with **Tauri + React + TypeScript**, with a native **Rust** backend for local file storage and audio playback.

![Stars](https://img.shields.io/github/stars/Khizarshah01/writeSimply?style=social)
[![License](https://img.shields.io/badge/license-see%20LICENSE-blue.svg)](./LICENSE)
[![Buy Me A Coffee](https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&slug=khizarshah01&button_colour=FFDD00&font_colour=000000&font_family=Comic&outline_colour=000000&coffee_colour=ffffff)](https://www.buymeacoffee.com/khizarshah01)

</div>

---

## Overview

writeSimply is a lightweight desktop writing environment for people who just want to write. Notes live on your machine as local files — it works fully offline, opens instantly, and stays out of your way.

Because it's built on **Tauri**, the app ships as a small native binary (it uses the OS's own webview instead of bundling a browser like Electron does), while a **Rust** backend handles file persistence, folder organisation, and background music playback.

> Loved by the community: **43+ GitHub stars** and support from real users through Buy Me a Coffee. ⭐

## Screenshots

<div align="center">
  <img src="https://github.com/user-attachments/assets/b4f1bb83-861d-4b72-8b99-fc75412e2bf9" width="49%" />
  <img src="https://github.com/user-attachments/assets/ac8d4a6a-556c-4f87-91e1-969cbd6d8073" width="49%" />
</div>

## Features

- **Distraction-free rich-text editor** — built on Meta's [Lexical](https://lexical.dev/) with a custom toolbar (bold, italic, and more)
- **Local file tree** — organise writing into folders and notes, stored as JSON on disk
- **Fully offline** — no account, no cloud, no telemetry; your writing never leaves your machine
- **Customisation** — font family, font size, and theme (with an animated theme toggler)
- **Writing timer** — simple session timer to keep you focused
- **Built-in music player** — play local audio while you write, powered natively by the Rust backend
- **Smooth UX** — intro animation and motion transitions
- **Cross-platform** — one codebase for Linux, macOS, and Windows

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Desktop shell** | [Tauri 2](https://tauri.app/) |
| **Native backend** | Rust (`serde`, `serde_json`, `std::fs`, `std::process`) |
| **Frontend** | React 19, TypeScript, Vite 7 |
| **Editor** | Lexical (`@lexical/react`) |
| **Styling** | Tailwind CSS 4, Radix UI, `class-variance-authority` |
| **Animation** | Motion (Framer Motion) |
| **Testing** | Vitest |

## Architecture

writeSimply is split across a **React/TypeScript frontend** (the UI, editor, and state) and a **Rust backend** (the filesystem and OS integration). They communicate over Tauri's **IPC bridge**: the frontend calls `invoke("command_name", args)`, which runs a `#[tauri::command]` function in Rust and returns a typed result.

```txt
┌──────────────────────────────────────────────┐
│  Frontend  (React + TypeScript, in webview)   │
│                                               │
│   LexicalEditor · FileTreePanel · Settings    │
│   MusicPlayer · Timer · Theme                 │
└───────────────┬───────────────────────────────┘
                │  invoke("save_file", ...)   Tauri IPC
                ▼
┌──────────────────────────────────────────────┐
│  Backend  (Rust — src-tauri/src/lib.rs)       │
│                                               │
│   save_file / load_file / list_files          │  ← notes as JSON in
│   create_folder / delete_item                 │    app_data_dir/user_data
│   play_audio / stop_audio / is_audio_playing  │  ← native OS audio player
└──────────────────────────────────────────────┘
```

**Design highlights**
- **Typed IPC contract** — a shared `WritingFile` struct (name, text, font, font size, theme) is serialised with `serde` on the Rust side and mirrored in TypeScript, so data crosses the boundary type-safely.
- **Local persistence** — notes are written as JSON into the platform-specific app data directory; folders map directly to real directories, and `list_files` walks them recursively.
- **Native audio with shared state** — playback shells out to the platform's native player (`ffplay` on Linux, `afplay` on macOS, PowerShell on Windows) selected via `#[cfg(target_os = ...)]`. The current process is tracked behind a `Mutex<AudioState>` so play/stop/is-playing stay consistent across calls.

## Getting Started

### Prerequisites
- [Bun](https://bun.sh/) or Node.js + npm
- [Rust toolchain](https://www.rust-lang.org/tools/install) (for Tauri)
- Tauri system dependencies for your OS — see the [Tauri prerequisites guide](https://tauri.app/start/prerequisites/)
- Linux only: `ffmpeg` (provides `ffplay`) for the music player

### Development

```bash
git clone https://github.com/Khizarshah01/writeSimply.git
cd writeSimply

# install frontend deps
npm install        # or: bun install

# run the app in dev mode (hot-reloads the webview)
npm run tauri dev
```

### Build a release binary

```bash
npm run tauri build
```

The packaged installer/binary is emitted under `src-tauri/target/release/`.

## Project Structure

```txt
writeSimply/
├── src/                      # React + TypeScript frontend
│   ├── components/
│   │   ├── LexicalEditor.tsx     # rich-text editor
│   │   ├── plugins/ToolbarPlugin.tsx
│   │   ├── FileTreePanel.tsx     # notes & folders sidebar
│   │   ├── MusicPlayer.tsx
│   │   ├── SettingsPanel.tsx
│   │   └── ui/                   # shared UI components
│   └── App.tsx
└── src-tauri/                # Rust backend
    ├── src/lib.rs                # Tauri commands (files + audio)
    └── Cargo.toml
```

## Contributing

Ideas and PRs are welcome — if there's a feature that would help other writers, open an issue or a pull request.

## Support

If writeSimply helps you write, you can support development here:

[![Buy Me A Coffee](https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&slug=khizarshah01&button_colour=FFDD00&font_colour=000000&font_family=Comic&outline_colour=000000&coffee_colour=ffffff)](https://www.buymeacoffee.com/khizarshah01)

## License

See [LICENSE](./LICENSE).
