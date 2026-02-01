import { useState, useEffect } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  FolderOpen,
  Music,
  List,
  Repeat,
} from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { readDir } from "@tauri-apps/plugin-fs";
import { message } from "@tauri-apps/plugin-dialog";
import { basename } from "@tauri-apps/api/path";
import { invoke } from "@tauri-apps/api/core";

interface MusicPlayerProps {
  onClose: () => void;
}

interface Song {
  name: string;
  path: string;
}

export default function MusicPlayer({ onClose }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isRepeat, setIsRepeat] = useState(false);
  const [folderPath, setFolderPath] = useState<string | null>(null);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [isLoading, setIsLoading] = useState(false);



  const scanFolder = async (path: string) => {
    try {
      setIsLoading(true);
      console.log("Scanning folder:", path);

      // Read directory entries
      const entries = await readDir(path);
      console.log("Folder entries:", entries);

      // Filter audio files
      const audioFiles = entries.filter((entry: any) => {
        const name = entry.name || entry.path?.split(/[\\/]/).pop() || '';
        const isAudioFile = /\.(mp3|wav|ogg|m4a|flac|aac)$/i.test(name);
        return isAudioFile;
      });

      console.log("Found audio files:", audioFiles.length);

      if (audioFiles.length === 0) {
        await message("No audio files found in this folder! Supported formats: MP3, WAV, OGG, M4A, FLAC, AAC", {
          title: "Music Player",
          kind: "warning",
        });
        setIsLoading(false);
        return false;
      }

      // Create song objects
      const loadedSongs: Song[] = await Promise.all(
        audioFiles.map(async (entry: any) => {
          const songPath = entry.path || `${path}/${entry.name}`;
          const name = entry.name || await basename(songPath).catch(() => 'Unknown');
          const cleanName = name.replace(/\.[^/.]+$/, ""); // Remove file extension

          return {
            name: cleanName,
            path: songPath,
          };
        })
      );

      console.log("Loaded songs:", loadedSongs);
      setSongs(loadedSongs);
      setFolderPath(path);

      // Save to localStorage
      localStorage.setItem("music_folder_path", path);

      return true;

    } catch (error) {
      console.error("Folder scanning failed:", error);
      // Only show error if we are actively selecting, not on auto-load
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 🎵 Select and load music folder using Tauri
  const handleSelectFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select your music folder",
      });

      if (!selected || Array.isArray(selected)) {
        return;
      }

      const success = await scanFolder(selected);
      if (success) {
        setCurrentSongIndex(0);
        setIsPlaying(false);
      } else {
        await message(`Could not load files from ${selected}.`, {
          title: "Error",
          kind: "error",
        });
      }

    } catch (error) {
      console.error("Folder selection failed:", error);
      await message(`Error: ${error}`, {
        title: "Error",
        kind: "error",
      });
    }
  };

  // Load persisted folder on mount
  useEffect(() => {
    const savedPath = localStorage.getItem("music_folder_path");
    if (savedPath) {
      // Don't auto-scan on every render, only once on mount
      if (!folderPath) {
        scanFolder(savedPath).then(success => {
          if (!success) {
            console.log("Failed to load saved path, clearing localStorage");
            localStorage.removeItem("music_folder_path");
            setFolderPath(null);
          }
        });
      }
    }
  }, []);


  // Check if audio is still playing
  const checkAudioStatus = async () => {
    try {
      const stillPlaying = await invoke<boolean>('is_audio_playing');
      if (!stillPlaying && isPlaying) {
        // Song finished naturally
        console.log("Song finished naturally, moving to next");
        handleNextSong();
      }
      return stillPlaying;
    } catch (error) {
      console.error("Error checking audio status:", error);
      return false;
    }
  };

  // Play audio using Tauri command
  const playAudio = async (path: string) => {
    try {
      await invoke('play_audio', { path });
      setIsPlaying(true);
      console.log("Playing:", path);

      // Start progress simulation
      startProgressSimulation();
    } catch (error) {
      console.error("Play audio error:", error);
      setIsPlaying(false);
      await message(`Failed to play audio: ${error}`, {
        title: "Playback Error",
        kind: "error",
      });
    }
  };

  // Stop audio using Tauri command
  const stopAudio = async () => {
    try {
      await invoke('stop_audio');
      setIsPlaying(false);
      console.log("Audio stopped");
    } catch (error) {
      console.error("Stop audio error:", error);
    }
  };

  // Simulate progress for native playback
  const startProgressSimulation = () => {
    let progressValue = 0;
    const interval = setInterval(() => {
      if (!isPlaying) {
        clearInterval(interval);
        return;
      }

      progressValue += 0.5;
      if (progressValue >= 100) {
        progressValue = 100;
        clearInterval(interval);
      }
    }, 500);
  };

  // Handle next song (with completion)
  const handleNextSong = () => {
    if (songs.length === 0) return;

    const nextIndex = currentSongIndex + 1 < songs.length ? currentSongIndex + 1 : 0;
    setCurrentSongIndex(nextIndex);

    // Auto-play next song if repeat is enabled or if we're not at the end
    if (isPlaying && (isRepeat || nextIndex !== 0)) {
      setTimeout(async () => {
        await playAudio(songs[nextIndex].path);
      }, 500);
    } else if (nextIndex === 0 && !isRepeat) {
      // Reached end of playlist and repeat is off
      setIsPlaying(false);
    }
  };

  // Handle play/pause
  const handlePlayPause = async () => {
    if (songs.length === 0) {
      message("No songs loaded", { title: "Info", kind: "info" });
      return;
    }

    const currentSong = songs[currentSongIndex];
    if (!currentSong) return;

    if (isPlaying) {
      await stopAudio();
    } else {
      await playAudio(currentSong.path);
    }
  };

  // Handle next song (user action)
  const handleNext = async () => {
    if (songs.length === 0) return;

    const wasPlaying = isPlaying;
    if (wasPlaying) {
      await stopAudio();
    }

    const nextIndex = currentSongIndex + 1 < songs.length ? currentSongIndex + 1 : 0;
    setCurrentSongIndex(nextIndex);

    if (wasPlaying) {
      setTimeout(async () => {
        await playAudio(songs[nextIndex].path);
      }, 500);
    }
  };

  // Handle previous song
  const handlePrev = async () => {
    if (songs.length === 0) return;

    const wasPlaying = isPlaying;
    if (wasPlaying) {
      await stopAudio();
    }

    const prevIndex = currentSongIndex - 1 >= 0 ? currentSongIndex - 1 : songs.length - 1;
    setCurrentSongIndex(prevIndex);

    if (wasPlaying) {
      setTimeout(async () => {
        await playAudio(songs[prevIndex].path);
      }, 500);
    }
  };

  // Check audio status periodically
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(async () => {
      const stillPlaying = await checkAudioStatus();
      if (!stillPlaying) {
        setIsPlaying(false);
      }
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [isPlaying, currentSongIndex]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      stopAudio().catch(console.error);
    };
  }, []);

  if (!folderPath) {
    return (
      <div className="fixed top-20 right-8 z-50 w-80 bg-black/90 backdrop-blur-md rounded-xl p-6 text-center shadow-2xl border border-white/20">
        <Music className="w-12 h-12 text-white/50 mx-auto mb-4" />
        <p className="text-white mb-2">No music folder selected</p>
        <p className="text-white/60 text-sm mb-4">Select a folder containing your music files</p>
        <button
          onClick={handleSelectFolder}
          disabled={isLoading}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 rounded-lg text-white transition flex items-center gap-2 mx-auto"
        >
          <FolderOpen size={16} />
          {isLoading ? "Scanning..." : "Select Music Folder"}
        </button>
      </div>
    );
  }

  const currentSong = songs[currentSongIndex];

  return (
    <div className="fixed top-20 right-8 z-50 w-80 bg-black/90 backdrop-blur-md rounded-xl p-4 shadow-2xl border border-white/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSelectFolder}
            className="text-white hover:text-green-400 transition-colors p-1"
            title="Change music folder"
          >
            <FolderOpen size={16} />
          </button>
          <div>
            <h3 className="text-white font-bold text-sm">Music Player</h3>
            <p className="text-white/60 text-xs truncate max-w-[180px]">
              {folderPath.split(/[\\/]/).pop()}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white/70 hover:text-white transition-colors text-lg"
          title="Close player (music continues in background)"
        >
          ×
        </button>
      </div>

      {songs.length === 0 ? (
        <div className="text-center py-8">
          <Music className="w-12 h-12 text-white/50 mx-auto mb-3" />
          <p className="text-white/70 text-sm mb-3">No music files found</p>
          <button
            onClick={handleSelectFolder}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
          >
            Select Different Folder
          </button>
        </div>
      ) : (
        <>
          {/* Song Info */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Music className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-sm truncate">
                {currentSong?.name || "Unknown"}
              </h3>
              <p className="text-white/60 text-xs">
                {currentSongIndex + 1} of {songs.length}
                {isPlaying && "Playing"}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                className="text-white hover:scale-110 transition-transform p-1"
                disabled={songs.length === 0}
              >
                <SkipBack size={18} />
              </button>
              <button
                onClick={handlePlayPause}
                className="text-white hover:scale-110 transition-transform p-2 bg-white/20 rounded-full"
                disabled={songs.length === 0}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button
                onClick={handleNext}
                className="text-white hover:scale-110 transition-transform p-1"
                disabled={songs.length === 0}
              >
                <SkipForward size={18} />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsRepeat(!isRepeat)}
                className={`p-1 ${isRepeat ? 'text-green-400' : 'text-white'}`}
                title="Repeat"
              >
                <Repeat size={16} />
              </button>
              <button
                onClick={() => setShowPlaylist(!showPlaylist)}
                className="text-white p-1"
                title="Playlist"
              >
                <List size={16} />
              </button>
            </div>
          </div>

          {/* Playlist */}
          {showPlaylist && (
            <div className="mt-3 bg-gray-900/90 rounded-lg max-h-40 overflow-y-auto p-2 space-y-1">
              {songs.map((song, index) => (
                <div
                  key={index}
                  onClick={async () => {
                    const wasPlaying = isPlaying;
                    if (wasPlaying) {
                      await stopAudio();
                    }
                    setCurrentSongIndex(index);
                    if (wasPlaying) {
                      setTimeout(async () => {
                        await playAudio(song.path);
                      }, 500);
                    }
                  }}
                  className={`flex items-center p-2 rounded cursor-pointer transition-colors ${index === currentSongIndex
                    ? 'bg-green-500/30 text-white'
                    : 'text-white/80 hover:bg-white/10'
                    }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">
                      {song.name}
                      {index === currentSongIndex && isPlaying && " ▶"}
                    </p>
                  </div>
                  <span className="text-xs text-white/60">{index + 1}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}