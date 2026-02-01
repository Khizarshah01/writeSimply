import { Moon, Sun, Save, FileDown, Image, Bot } from "lucide-react";
import { RxCross2 } from "react-icons/rx";
import { AnimatedThemeToggler } from "./ui/animated-theme-toggler";

interface SettingsPanelProps {
  theme: string;
  setTheme: (theme: string) => void;
  autosave: boolean;
  setAutosave: (value: boolean) => void;
  onPrint: () => void;
  onClose: () => void;
}

export default function SettingsPanel({
  theme,
  setTheme,
  autosave,
  setAutosave,
  onPrint,
  onClose,
}: SettingsPanelProps) {
  return (
    <div className="fixed top-20 left-8 md:right-16 lg:right-32 xl:right-40 z-50 w-80 bg-black/90 backdrop-blur-md rounded-xl p-6 shadow-2xl border border-white/20 text-white">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold">Settings</h3>
        <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
          <RxCross2 size={20} />
        </button>
      </div>

      {/* Theme */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {theme === "light" ? <Sun size={18} /> : <Moon size={18} />}
          <span>Mode</span>
        </div>
        <AnimatedThemeToggler theme={theme} toggleTheme={() => setTheme(theme === "light" ? "dark" : "light")} />
      </div>

      {/* Autosave ON/OFF */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Save size={18} />
          <span>Autosave</span>
        </div>
        <button
          onClick={() => setAutosave(!autosave)}
          className={`px-3 rounded-md ${autosave ? "bg-green-600 text-white" : "bg-gray-700 text-gray-300"
            }`}
        >
          {autosave ? "ON" : "OFF"}
        </button>
      </div>

      {/* Export Options */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileDown size={18} />
          <span>Export Options</span>
        </div>
        <button
          onClick={() => { onPrint(); onClose(); }}
          className={`px-3 rounded-md text-gray-300`}>
          PDF
        </button>
      </div>

      <div className="flex items-center justify-between mb-3 opacity-60">
        <div className="flex items-center gap-2">
          <Image size={18} />
          <span>Background Image</span>
        </div>
        <span className="text-xs text-gray-400">Coming soon</span>
      </div>

      <div className="flex items-center justify-between mb-2 opacity-60">
        <div className="flex items-center gap-2">
          <Bot size={18} />
          <span>AI Helper</span>
        </div>
        <span className="text-xs text-gray-400">Coming soon</span>
      </div>
    </div>
  );
}
