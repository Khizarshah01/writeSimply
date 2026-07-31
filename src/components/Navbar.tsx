import React, { useState, useRef, useEffect, useCallback } from "react";
import MusicPlayer from "./MusicPlayer";

import { Music } from "lucide-react";
import GearIcon from "@/components/ui/gear-icon";
import { invoke } from "@tauri-apps/api/core";
import { getNextUntitledName } from "../utils";
import SettingsPanel from "./SettingsPanel";

interface NavbarProps {
  theme: string;
  setTheme: (theme: string) => void;
  onSave: () => void;
  onPrint: () => void;
  onExport: (format: "txt" | "md" | "html" | "pdf") => void;
  currentFileName: string | null;
  isSaved: boolean;
  onRename: (newName: string) => void;
  autoSave: boolean;
  onToggleAutoSave: () => void;
  showPet?: boolean;
  setShowPet?: (value: boolean) => void;
  onMusicPlayingChange?: (playing: boolean) => void;
}

const Navbar: React.FC<NavbarProps> = ({
  theme,
  setTheme,
  onSave,
  onPrint,
  onExport,
  currentFileName,
  isSaved,
  onRename,
  autoSave,
  onToggleAutoSave,
  showPet = true,
  setShowPet,
  onMusicPlayingChange,
}) => {
  const [showMusicPlayer, setShowMusicPlayer] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);

  const handlePlayingChange = useCallback(
    (playing: boolean) => {
      setMusicPlaying(playing);
      onMusicPlayingChange?.(playing);
    },
    [onMusicPlayingChange],
  );

  // navbar unmounts in focus mode, which stops the player — tell the app
  useEffect(() => {
    return () => onMusicPlayingChange?.(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cmd+, toggles the settings panel
  useEffect(() => {
    const toggle = () => setShowSettings((s) => !s);
    window.addEventListener("ws:toggle-settings", toggle);
    return () => window.removeEventListener("ws:toggle-settings", toggle);
  }, []);
  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editName, setEditName] = useState(() => {
    return currentFileName || "";
  });

  useEffect(() => {
    if (currentFileName) {
      setEditName(currentFileName);
      return;
    }
    (async () => {
      const files = await invoke<string[]>("list_files");
      const newName = getNextUntitledName(files);
      setEditName(newName);
      onRename(newName.trim());
    })();
  }, [currentFileName]);

  const inputRef = useRef<HTMLInputElement>(null);

  const toggleMusicPlayer = () => setShowMusicPlayer(!showMusicPlayer);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editName.trim() && editName !== currentFileName) {
      onRename(editName.trim());
    }
    setIsEditing(false);
  };

  const handleInputBlur = () => {
    if (editName.trim() && editName !== currentFileName) {
      onRename(editName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setEditName(currentFileName || "");
      setIsEditing(false);
    }
    if (e.key === "Enter") {
      handleNameSubmit(e);
    }
  };

  // On macOS the window chrome is an overlay: leave room for the traffic lights
  const isMac =
    typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  return (
    <>
      <nav
        data-tauri-drag-region
        className={`flex justify-between items-center py-4 select-none relative pr-8 ${isMac ? "pl-[84px]" : "pl-8"}`}
      >
        <div
          onClick={() => setShowSettings(!showSettings)}
          className="cursor-pointer hover:opacity-50 transition-opacity flex items-center gap-2"
        >
          <GearIcon size={19} />
        </div>


        {/* Center: Status dot + File name input */}
        <div className="flex items-center gap-2 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          {/* Blinking / Pulsing Status Dot */}
          <span className="relative flex h-3 w-3 items-center justify-center" title={isSaved ? "Saved" : "Unsaved changes"}>
            <span
              className={`relative inline-flex rounded-full h-2 w-2 transition-colors duration-500 ${
                isSaved ? "!bg-emerald-500/80" : "!bg-amber-400"
              }`}
            ></span>
          </span>

          {/* Input always rendered for fixed position */}
          <form onSubmit={handleNameSubmit} className="flex items-center">
            <input
              ref={inputRef}
              type="text"
              placeholder="None"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              onClick={() => setIsEditing(true)}
              className="font-semibold text-[var(--text-color)] bg-transparent outline-none px-1 min-w-[100px] cursor-text"
              spellCheck={false}
            />
          </form>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onSave()}
              className="cursor-pointer hover:opacity-50 transition-opacity px-3 py-1 border-[var(--text-color)]"
            >
              Save
            </button>
          </div>

          <div className="relative">
            <button
              onClick={toggleMusicPlayer}
              className={`cursor-pointer transition-all duration-300 p-2 rounded-full ${showMusicPlayer
                ? "bg-[var(--accent-color)] text-white"
                : "hover:bg-[var(--hover-bg)] hover:opacity-70"
                }`}
              title={musicPlaying ? "Music playing" : "Music player"}
            >
              {musicPlaying ? (
                <div className="eq-bars text-green-400">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              ) : (
                <Music size={17} />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Music Player Widget */}
      {/* Music Player Widget - Always mounted for background play, controlled via visibility */}
      <div className={showMusicPlayer ? "block" : "hidden"}>
        <MusicPlayer
          onClose={() => setShowMusicPlayer(false)}
          onPlayingChange={handlePlayingChange}
        />
      </div>

      {showSettings && (
        <SettingsPanel
          theme={theme}
          setTheme={setTheme}
          autosave={autoSave}
          setAutosave={onToggleAutoSave}
          onPrint={onPrint}
          onExport={onExport}
          onClose={() => setShowSettings(false)}
          showPet={showPet}
          setShowPet={setShowPet}
        />
      )}

    </>
  );
};

export default Navbar;