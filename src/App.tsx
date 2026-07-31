import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import "./App.css";

import LexicalEditor from "./components/LexicalEditor";
import FooterPanel from "./components/FooterPanel";
import Navbar from "./components/Navbar";
import FileTreePanel from "./components/FileTreePanel";
import NotificationContainer from "./components/NotificationContainer";
import IntroAnimation from "./components/IntroAnimation";
import PixelPet from "./components/PixelPet";

// Types for writing session
interface WritingFile {
  name: string;
  text: string;
  font: string;
  font_size: number;
  theme: string;
}

interface AppState {
  theme: string;
  font: string;
  fontSize: number;
  editorContent: string;
  autoSave: boolean;
  focusMode: boolean;
}

const DEFAULT_THEME = "light";
const DEFAULT_FONT = "serif";
const DEFAULT_FONT_SIZE = 20;

function App() {
  const [appState, setAppState] = useState<AppState>(() => {
    try {
      const savedTheme = localStorage.getItem("theme");
      const savedFont = localStorage.getItem("font");
      const savedFontSize = localStorage.getItem("fontSize");
      const savedContent = localStorage.getItem("editorContent");
      const savedAutoSave = localStorage.getItem("autoSave");
      return {
        theme: savedTheme || DEFAULT_THEME,
        font: savedFont || DEFAULT_FONT,
        fontSize: savedFontSize ? parseInt(savedFontSize) : DEFAULT_FONT_SIZE,
        editorContent: savedContent || "",
        autoSave: savedAutoSave === "true",
        focusMode: false,
      };
    } catch (error) {
      console.error("Error loading saved preferences:", error);
      return {
        theme: DEFAULT_THEME,
        font: DEFAULT_FONT,
        fontSize: DEFAULT_FONT_SIZE,
        editorContent: "",
        autoSave: false,
        focusMode: false,
      };
    }
  });

  const [showHistory, setShowHistory] = useState(false);
  const [fileList, setFileList] = useState<string[]>([]);
  const [isSaved, setIsSaved] = useState(true);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  // 🧠 Notification state
  const [notifications, setNotifications] = useState<
    { id: number; type: "success" | "error" | "info"; message: string }[]
  >([]);

  const addNotification = (
    type: "success" | "error" | "info",
    message: string,
  ) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, type, message }]);
  };

  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const saveTimeoutRef = useRef<number | null>(null);

  // Save preferences to localStorage
  useEffect(() => {
    try {
      document.documentElement.dataset.theme = appState.theme;
      localStorage.setItem("theme", appState.theme);
      localStorage.setItem("font", appState.font);
      localStorage.setItem("fontSize", appState.fontSize.toString());
      localStorage.setItem("editorContent", appState.editorContent);
      localStorage.setItem("autoSave", appState.autoSave.toString());

      if (currentFileName && appState.autoSave) {
        if (saveTimeoutRef.current !== null) {
          clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = window.setTimeout(() => {
          handleSave();
        }, 1000);
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
    }
    return () => {
      if (saveTimeoutRef.current !== null) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [appState, currentFileName]);

  // State updaters
  const setTheme = useCallback(
    (theme: string) => setAppState((prev) => ({ ...prev, theme })),
    [],
  );
  const setFont = useCallback(
    (font: string) => setAppState((prev) => ({ ...prev, font })),
    [],
  );
  const setFontSize = useCallback(
    (fontSize: number) => setAppState((prev) => ({ ...prev, fontSize })),
    [],
  );

  const toggleAutoSave = useCallback(
    () => setAppState((prev) => ({ ...prev, autoSave: !prev.autoSave })),
    [],
  );

  const toggleFocusMode = useCallback(() => {
    setAppState((prev) => ({ ...prev, focusMode: !prev.focusMode }));
  }, []);

  // Track editor changes and mark unsaved
  const [isWriting, setIsWriting] = useState(false);
  const [showPet, setShowPet] = useState(true);
  const [petCelebrate, setPetCelebrate] = useState(0);
  const [petTimerDone, setPetTimerDone] = useState(0);
  const [musicPlaying, setMusicPlaying] = useState(false);

  const setEditorContent = useCallback((content: string) => {
    setAppState((prev) => ({ ...prev, editorContent: content }));
    setIsSaved(false); // mark unsaved whenever content changes

    // Pixel pet writing reaction
    setIsWriting(true);
    setTimeout(() => setIsWriting(false), 650);
  }, []);

  // Refresh file list
  const refreshFileList = useCallback(async () => {
    try {
      const files = await invoke<string[]>("list_files");
      setFileList(files);
    } catch (error) {
      console.error("Error loading file list:", error);
    }
  }, []);

  // Save session to file
  const handleSave = useCallback(async (isManual = false) => {
    try {
      let fileName = currentFileName;

      // Ask for name only if it's a new file
      if (!fileName || fileName.trim() === "") {
        addNotification("error", "Enter file name please!");
        return;
      }

      const file: WritingFile = {
        name: fileName,
        text: appState.editorContent,
        font: appState.font,
        font_size: appState.fontSize,
        theme: appState.theme,
      };

      await invoke<string>("save_file", { file });
      if (isManual) {
        addNotification("success", "File saved successfully!");
        setPetCelebrate((n) => n + 1);
      }
      setIsSaved(true);
      refreshFileList();
    } catch (error) {
      console.error("Error saving session:", error);
      addNotification("error", "Error saving file: " + String(error));
    }
  }, [appState, currentFileName, refreshFileList]);

  // Load session from file
  const handleLoadFile = useCallback(async (fileName: string) => {
    try {
      const file = await invoke<WritingFile>("load_file", { name: fileName });
      setAppState((prev) => ({
        ...prev,
        editorContent: file.text,
        font: file.font,
        fontSize: file.font_size,
        theme: file.theme,
      }));
      setCurrentFileName(fileName);
      setIsSaved(true); // loaded file is saved
      setShowHistory(false);
    } catch (error) {
      console.error("Error loading file:", error);
      addNotification("error", "Error loading file: " + String(error));
    }
  }, []);

  // Delete file
  const handleDeleteFile = useCallback(
    async (fileName: string) => {
      try {
        await invoke<string>("delete_item", { name: fileName });
        if (currentFileName === fileName) {
          setCurrentFileName(null);
          setIsSaved(true);
          setEditorContent(""); // reset editor
        }
        refreshFileList();
        addNotification("info", "File deleted successfully.");
      } catch (error) {
        console.error("Error deleting file:", error);
        addNotification("error", "Error deleting file: " + String(error));
      }
    },
    [currentFileName, refreshFileList, setEditorContent],
  );

  // New session
  const handleNewSession = useCallback(() => {
    setEditorContent("");
    setCurrentFileName(null);
    setIsSaved(false); // new session is unsaved
  }, [setEditorContent]);

  const handleSetTimer = useCallback((minutes: number) => {
    // FooterPanel calls this with 0 when the countdown reaches the end
    if (minutes === 0) setPetTimerDone((n) => n + 1);
  }, []);

  const toggleHistory = useCallback(() => {
    setShowHistory((prev) => {
      if (!prev) refreshFileList();
      return !prev;
    });
  }, [refreshFileList]);

  const handleRename = useCallback((newName: string) => {
    if (newName.trim() !== "") setCurrentFileName(newName);
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Export the current writing to a real file the user chooses on disk.
  const handleExport = useCallback(
    async (format: "txt" | "md" | "html" | "pdf") => {
      // PDF goes through the native print dialog ("Save as PDF").
      if (format === "pdf") {
        window.print();
        return;
      }

      try {
        const baseName = currentFileName || "untitled";
        const text = appState.editorContent;

        let data = text;
        if (format === "html") {
          const escaped = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
          data = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${baseName}</title>
<style>
  body { font-family: ${appState.font}, serif; font-size: ${appState.fontSize}px; line-height: 1.6; max-width: 720px; margin: 4rem auto; padding: 0 1rem; white-space: pre-wrap; word-break: break-word; color: #222; }
</style>
</head>
<body>${escaped}</body>
</html>`;
        }

        const filePath = await save({
          defaultPath: `${baseName}.${format}`,
          filters: [{ name: format.toUpperCase(), extensions: [format] }],
        });

        if (!filePath) return; // user cancelled

        await invoke<string>("export_file", { path: filePath, content: data });
        addNotification("success", `Exported as ${format.toUpperCase()}`);
      } catch (error) {
        addNotification("error", `Export failed: ${error}`);
      }
    },
    [appState.editorContent, appState.font, appState.fontSize, currentFileName],
  );

  // Global keyboard shortcuts:
  // Cmd/Ctrl+F or Cmd+/ focus mode · Cmd+S save · Cmd+N new · Cmd+, settings · ESC exits focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      if (isMod && (key === 'f' || e.key === '/')) {
        e.preventDefault();
        toggleFocusMode();
      } else if (isMod && key === 's') {
        e.preventDefault();
        handleSave(true);
      } else if (isMod && key === 'n') {
        e.preventDefault();
        handleNewSession();
      } else if (isMod && e.key === ',') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('ws:toggle-settings'));
      }
      if (e.key === 'Escape' && appState.focusMode) {
        toggleFocusMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFocusMode, appState.focusMode, handleSave, handleNewSession]);

  // welcome animation only on the very first launch — after that the app opens instantly
  const [showIntro, setShowIntro] = useState(() => {
    try {
      return localStorage.getItem("hasSeenIntro") !== "true";
    } catch {
      return true;
    }
  });
  const handleIntroComplete = useCallback(() => {
    try {
      localStorage.setItem("hasSeenIntro", "true");
    } catch {
      // ignore storage failures
    }
    setShowIntro(false);
  }, []);

  // Clear any persisted focus mode so main UI (navbar/footer) is never hidden on startup
  useEffect(() => {
    localStorage.removeItem("focusMode");
  }, []);

  if (showIntro) {
    return <IntroAnimation onComplete={handleIntroComplete} />;
  }

  return (
    <div className={`app-container min-h-screen flex flex-col bg-[var(--background)] text-[var(--text-color)] transition-colors duration-300 relative ${appState.focusMode ? 'focus-mode' : ''}`}>
      {!appState.focusMode && (
        <Navbar
          theme={appState.theme}
          setTheme={setTheme}
          onSave={() => handleSave(true)}
          onPrint={handlePrint}
          onExport={handleExport}
          currentFileName={currentFileName}
          isSaved={isSaved}
          onRename={handleRename}
          autoSave={appState.autoSave}
          onToggleAutoSave={toggleAutoSave}
          showPet={showPet}
          setShowPet={setShowPet}
          onMusicPlayingChange={setMusicPlaying}
        />
      )}

      <LexicalEditor
        font={appState.font}
        fontSize={appState.fontSize}
        content={appState.editorContent}
        onContentChange={setEditorContent}
      />

      {!appState.focusMode && (
        <FooterPanel
          font={appState.font}
          fontSize={appState.fontSize}
          setFont={setFont}
          setFontSize={setFontSize}
          setNewSession={handleNewSession}
          setTimer={handleSetTimer}
          onShowHistory={toggleHistory}
          text={appState.editorContent}
        />
      )}

      {showPet && (
        <PixelPet
          isWriting={isWriting}
          celebrate={petCelebrate}
          timerDone={petTimerDone}
          theme={appState.theme}
          focusMode={appState.focusMode}
          musicPlaying={musicPlaying}
        />
      )}

      {showHistory && !appState.focusMode && (
        <FileTreePanel
          files={fileList}
          onLoadFile={handleLoadFile}
          onDeleteFile={handleDeleteFile}
          onClose={() => setShowHistory(false)}
          isOpen={showHistory}
          refreshFiles={refreshFileList}
        />
      )}
      <NotificationContainer
        notifications={notifications}
        removeNotification={removeNotification}
      />

      {/* Beautiful minimal focus exit hint */}
      {appState.focusMode && (
        <div 
          onClick={toggleFocusMode}
          className="fixed bottom-5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] tracking-widest bg-[var(--background)]/70 backdrop-blur border border-[var(--text-color)]/10 text-[var(--text-color)]/70 hover:text-[var(--text-color)] cursor-pointer transition-all select-none z-50"
        >
          PRESS ESC OR CLICK TO EXIT FOCUS
        </div>
      )}
    </div>
  );
}

export default App;
