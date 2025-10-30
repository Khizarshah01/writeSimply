import React, { useRef } from "react";
import { RxCross2, RxFileText } from "react-icons/rx";
import { useOnClickOutside } from "../hooks/useClickOutside";

interface HistoryPanelProps {
  files: string[];
  onLoadFile: (fileName: string) => void;
  onDeleteFile: (fileName: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({
  files,
  onLoadFile,
  onDeleteFile,
  onClose,
}) => {
  const handleLoadFile = (fileName: string) => {
    onLoadFile(fileName);
    onClose();
  };

  const historyPanelRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(historyPanelRef, onClose);

  return (
    <div
      ref={historyPanelRef}
      className="fixed bottom-20 right-8 z-50 w-80 bg-black/80 backdrop-blur-md rounded-xl p-4 shadow-2xl border border-white/20"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500/30 rounded-lg flex items-center justify-center">
            <RxFileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">Saved</h3>
            <p className="text-white/70 text-xs">{files.length} file(s)</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white/70 hover:text-white hover:bg-white/10 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200"
        >
          <RxCross2 className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div
        className="max-h-64 overflow-y-auto"
        style={{
          scrollbarWidth: "none", // for Firefox
        }}
      >
        <style>
          {`
      div::-webkit-scrollbar {
        display: none; /* Hide scrollbar for Chrome, Safari, Opera */
      }
    `}
        </style>
        {files.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <RxFileText className="w-6 h-6 text-white/50" />
            </div>
            <p className="text-white/50 text-sm">No saved sessions found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={file}
                className="flex items-center gap-3 p-3 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-200 group"
              >
                <div className="w-8 h-8 bg-blue-500/20 rounded flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-medium">
                    {index + 1}
                  </span>
                </div>
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => handleLoadFile(file)}
                >
                  <p className="text-white text-sm font-medium truncate">
                    {file}
                  </p>
                  <p className="text-white/50 text-xs">Click to load</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleLoadFile(file)}
                    className="text-white hover:bg-green-500/20 hover:text-green-300 transition-colors text-xs px-2 py-1 rounded border border-white/20"
                  >
                    Load
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFile(file);
                    }}
                    className="text-white hover:bg-red-500/20 hover:text-red-300 transition-colors text-xs px-2 py-1 rounded border border-white/20"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {files.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/10">
          <div className="flex gap-2">
            <button
              onClick={() => files.length > 0 && handleLoadFile(files[0])}
              className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs py-2 px-3 rounded-lg transition-colors border border-blue-500/30"
            >
              Load Latest
            </button>
            <button
              onClick={() => {
                if (files.length > 0 && confirm("Clear all sessions?")) {
                  files.forEach((file) => onDeleteFile(file));
                }
              }}
              className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs py-2 px-3 rounded-lg transition-colors border border-red-500/30"
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPanel;
