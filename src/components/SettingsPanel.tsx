import { useState, useRef } from "react";
import type { AnimatedIconHandle } from "@/components/ui/types";
import { Image } from "lucide-react";
import MoonIcon from "@/components/ui/moon-icon";
import BrightnessDownIcon from "@/components/ui/brightness-down-icon";
import SaveIcon from "@/components/ui/save-icon";
import DownloadIcon from "@/components/ui/download-icon";
import BrandAistudioIcon from "@/components/ui/brand-aistudio-icon";
import XIcon from "@/components/ui/x-icon";
import ArrowBigDownIcon from "@/components/ui/arrow-big-down-icon";
import { AnimatedThemeToggler } from "./ui/animated-theme-toggler";

interface SettingsPanelProps {
  theme: string;
  setTheme: (theme: string) => void;
  autosave: boolean;
  setAutosave: (value: boolean) => void;
  onPrint: () => void;
  onExport: (format: "txt" | "md" | "html" | "pdf") => void;
  onClose: () => void;
  showPet?: boolean;
  setShowPet?: (value: boolean) => void;
}

const EXPORT_FORMATS: { label: string; value: "txt" | "md" | "html" | "pdf" }[] = [
  { label: "TXT", value: "txt" },
  { label: "MD", value: "md" },
  { label: "HTML", value: "html" },
  { label: "PDF", value: "pdf" },
];

export default function SettingsPanel({
  theme,
  setTheme,
  autosave,
  setAutosave,
  onExport,
  onClose,
  showPet = true,
  setShowPet,
}: SettingsPanelProps) {
  const [exportFormat, setExportFormat] = useState<"txt" | "md" | "html" | "pdf">("txt");

  const themeIconRef = useRef<AnimatedIconHandle>(null);
  const autosaveIconRef = useRef<AnimatedIconHandle>(null);
  const exportIconRef = useRef<AnimatedIconHandle>(null);
  const aiIconRef = useRef<AnimatedIconHandle>(null);

  return (
    <div className="fixed top-20 left-8 md:right-16 lg:right-32 xl:right-40 z-50 w-80 backdrop-blur-md rounded-xl p-6 shadow-2xl border border-[var(--border)] transition-colors duration-300" style={{ backgroundColor: 'var(--card)', color: 'var(--text-color)' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold">Settings</h3>
        <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
          <XIcon size={20} />
        </button>
      </div>

      {/* Theme */}
      <div 
        className="flex items-center justify-between mb-3"
        onMouseEnter={() => themeIconRef.current?.startAnimation()}
        onMouseLeave={() => themeIconRef.current?.stopAnimation()}
      >
        <div className="flex items-center gap-2">
          {theme === "light" ? <BrightnessDownIcon ref={themeIconRef} size={18} /> : <MoonIcon ref={themeIconRef} size={18} />}
          <span>Mode</span>
        </div>
        <AnimatedThemeToggler theme={theme} toggleTheme={() => setTheme(theme === "light" ? "dark" : "light")} />
      </div>

      {/* Autosave ON/OFF */}
      <div 
        className="flex items-center justify-between mb-3"
        onMouseEnter={() => autosaveIconRef.current?.startAnimation()}
        onMouseLeave={() => autosaveIconRef.current?.stopAnimation()}
      >
        <div className="flex items-center gap-2">
          <SaveIcon ref={autosaveIconRef} size={18} />
          <span>Autosave</span>
        </div>
        <button
          onClick={() => setAutosave(!autosave)}
          className={`px-3 rounded-md transition-colors`}
          style={!autosave ? { backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' } : undefined}
        >
          {autosave ? "ON" : "OFF"}
        </button>
      </div>

      {/* Export */}
      <div 
        className="flex items-center justify-between mb-3"
        onMouseEnter={() => exportIconRef.current?.startAnimation()}
        onMouseLeave={() => exportIconRef.current?.stopAnimation()}
      >
        <div className="flex items-center gap-2">
          <DownloadIcon ref={exportIconRef} size={18} />
          <span>Export</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="relative">
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as typeof exportFormat)}
              className="pl-2 pr-6 py-0.5 rounded-md transition-colors outline-none cursor-pointer appearance-none"
              style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}
            >
              {EXPORT_FORMATS.map((fmt) => (
                <option key={fmt.value} value={fmt.value}>{fmt.label}</option>
              ))}
            </select>
            <ArrowBigDownIcon
              size={14}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--muted-foreground)' }}
            />
          </div>
          <button
            onClick={() => { onExport(exportFormat); onClose(); }}
            className="px-2 py-0.5 rounded-md transition-colors"
            style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}
          >
            Export
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3 opacity-60">
        <div className="flex items-center gap-2">
          <Image size={18} />
          <span>Background Image</span>
        </div>
        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Coming soon</span>
      </div>

      <div className="flex items-center justify-between mb-2 opacity-60"
        onMouseEnter={() => aiIconRef.current?.startAnimation()}
        onMouseLeave={() => aiIconRef.current?.stopAnimation()}
      >
        <div className="flex items-center gap-2 cursor-pointer">
          <BrandAistudioIcon ref={aiIconRef} size={18} />
          <span>AI Helper</span>
        </div>
        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Coming soon</span>
      </div>

      {/* Pixel Pet - Premium writing companion */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>Pixel Pet</span>
        </div>
        <button
          onClick={() => setShowPet?.(!showPet)}
          className={`px-3 rounded-md transition-colors`}
          style={!showPet ? { backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' } : undefined}
        >
          {showPet ? "ON" : "OFF"}
        </button>
      </div>
    </div>
  );
}
