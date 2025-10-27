import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

import Editor from "./components/Editor";
import FooterPanel from "./components/FooterPanel";
import Navbar from "./components/Navbar";
import HistoryPanel from "./components/HistoryPanel";
import NotificationContainer from "./components/NotificationContainer";

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
      return {
        theme: savedTheme || DEFAULT_THEME,
        font: savedFont || DEFAULT_FONT,
        fontSize: savedFontSize ? parseInt(savedFontSize) : DEFAULT_FONT_SIZE,
        editorContent: savedContent || "",
      };
    } catch (error) {
      console.error("Error loading saved preferences:", error);
      return {
        theme: DEFAULT_THEME,
        font: DEFAULT_FONT,
        fontSize: DEFAULT_FONT_SIZE,
        editorContent: "",
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
      console.log("Effect", JSON.parse(JSON.stringify(appState)));
      if (saveTimeoutRef.current !== null) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        handleSave();
      }, 1000);
    } catch (error) {
      console.error("Error saving preferences:", error);
    }
    return () => {
      if (saveTimeoutRef.current !== null) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [appState]);

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

  // Track editor changes and mark unsaved
  const setEditorContent = useCallback((content: string) => {
    setAppState((prev) => ({ ...prev, editorContent: content }));
    setIsSaved(false); // mark unsaved whenever content changes
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
  const handleSave = useCallback(async () => {
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

      const result = await invoke<string>("save_file", { file });
      console.log("Save result:", result);
      addNotification("success", "File saved successfully!");
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
      console.log("File loaded successfully:", fileName);
    } catch (error) {
      console.error("Error loading file:", error);
      addNotification("error", "Error loding file: " + String(error));
    }
  }, []);

  // Delete file
  const handleDeleteFile = useCallback(
    async (fileName: string) => {
      try {
        if (confirm(`Are you sure you want to delete "${fileName}"?`)) {
          await invoke<string>("delete_file", { name: fileName });
          if (currentFileName === fileName) {
            setCurrentFileName(null);
            setIsSaved(true);
            setEditorContent(""); // reset editor
          }
          refreshFileList();
          addNotification("info", "File deleted successfully.");
        }
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
    console.log(`Timer set: ${minutes} minutes`);
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

  return (
    <div className="app-container min-h-screen flex flex-col bg-[var(--background)] text-[var(--text-color)] transition-colors duration-300 relative">
      <Navbar
        theme={appState.theme}
        setTheme={setTheme}
        onSave={handleSave}
        currentFileName={currentFileName}
        isSaved={isSaved}
        onRename={handleRename}
      />

      <Editor
        font={appState.font}
        fontSize={appState.fontSize}
        theme={appState.theme}
        content={appState.editorContent}
        onContentChange={setEditorContent}
      />

      <FooterPanel
        font={appState.font}
        fontSize={appState.fontSize}
        setFont={setFont}
        setFontSize={setFontSize}
        setNewSession={handleNewSession}
        setTimer={handleSetTimer}
        onShowHistory={toggleHistory}
      />

      {showHistory && (
        <HistoryPanel
          files={fileList}
          onLoadFile={handleLoadFile}
          onDeleteFile={handleDeleteFile}
          onClose={() => setShowHistory(false)}
          isOpen={showHistory}
        />
      )}
      <NotificationContainer
        notifications={notifications}
        removeNotification={removeNotification}
      />
    </div>
  );
}

export default App;
