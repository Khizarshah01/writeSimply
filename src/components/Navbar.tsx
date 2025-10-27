import React, { useState, useRef, useEffect } from "react";
import MusicPlayer from "./MusicPlayer";
import { SlEarphones } from "react-icons/sl";
import { invoke } from "@tauri-apps/api/core";
import { getNextUntitledName } from "../utils";

interface NavbarProps {
  theme: string;
  setTheme: (theme: string) => void;
  onSave: () => void;
  currentFileName: string | null;
  isSaved: boolean;
  onRename: (newName: string) => void;
  autoSave: boolean;
  onToggleAutoSave: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  theme,
  setTheme,
  onSave,
  currentFileName,
  isSaved,
  onRename,
  autoSave,
  onToggleAutoSave,
}) => {
  const [showMusicPlayer, setShowMusicPlayer] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
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

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");
  const toggleMusicPlayer = () => setShowMusicPlayer(!showMusicPlayer);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  // Update editName when currentFileName changes

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

  return (
    <>
      <nav className="flex justify-between items-center px-8 py-4 select-none relative">
        {/* Left: Theme toggle */}
        <div
          onClick={toggleTheme}
          className="cursor-pointer hover:opacity-50 transition-opacity"
        >
          {theme === "light" ? (
            <p className="text-black">Dark</p>
          ) : (
            <p className="text-white">Light</p>
          )}
        </div>

        {/* Center: Status dot + File name input */}
        <div className="flex items-center gap-2 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          {/* Blinking / Pulsing Status Dot */}
          <span className="relative flex h-3 w-3 items-center justify-center">
            {!isSaved && (
              <span
                className="absolute inline-flex h-3 w-3 rounded-full !bg-red-400 opacity-60 animate-ping"
                style={{ animationDuration: "1.5s" }}
              ></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isSaved ? "!bg-green-500" : "!bg-red-500"
              } border border-white`}
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

        {/* Right: Save button + Music */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onSave()}
              className="cursor-pointer hover:opacity-50 transition-opacity px-3 py-1 border-[var(--text-color)]"
            >
              Save
            </button>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoSave"
                checked={autoSave}
                onChange={onToggleAutoSave}
                className="cursor-pointer"
              />
              <label htmlFor="autoSave" className="cursor-pointer select-none">
                Auto Save
              </label>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={toggleMusicPlayer}
              className={`cursor-pointer transition-all duration-300 p-2 rounded-full ${
                showMusicPlayer
                  ? "bg-[var(--accent-color)] text-white"
                  : "hover:bg-[var(--hover-bg)] hover:opacity-70"
              }`}
            >
              <SlEarphones size={17} />
            </button>
          </div>
        </div>
      </nav>

      {/* Music Player Widget */}
      {showMusicPlayer && (
        <MusicPlayer onClose={() => setShowMusicPlayer(false)} />
      )}
    </>
  );
};

export default Navbar;
