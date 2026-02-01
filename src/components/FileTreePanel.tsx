import { useState, useEffect } from "react";
import { Tree, Folder, File, TreeViewElement } from "./ui/file-tree"; // Adjust import path as needed
import { RxCross2, RxFileText } from "react-icons/rx";
import { invoke } from "@tauri-apps/api/core";
import { ask } from "@tauri-apps/plugin-dialog";
import { FolderIcon, Plus, Trash2 } from "lucide-react";

interface FileTreePanelProps {
    files: string[];
    onLoadFile: (fileName: string) => void;
    onReferenceFile?: (fileName: string) => void; // Optional: for renaming logic if needed externally
    onDeleteFile: (fileName: string) => void; // Now handles paths
    onClose: () => void;
    isOpen: boolean;
    refreshFiles: () => void;
}

export default function FileTreePanel({
    files,
    onLoadFile,
    onDeleteFile,
    onClose,
    refreshFiles,
}: FileTreePanelProps) {
    const [elements, setElements] = useState<TreeViewElement[]>([]);
    const [newItemName, setNewItemName] = useState("");
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [isCreatingFile, setIsCreatingFile] = useState(false);
    const [selectedParent, setSelectedParent] = useState<string | null>(null);

    // Convert flat path list to TreeViewElements
    useEffect(() => {
        const buildTree = (paths: string[]): TreeViewElement[] => {
            const root: TreeViewElement[] = [];

            paths.forEach((path) => {
                const isExplicitFolder = path.endsWith("/");
                const cleanPath = isExplicitFolder ? path.slice(0, -1) : path;
                const parts = cleanPath.split("/");
                const partsLength = parts.length;

                let currentLevel = root;

                parts.forEach((part, index) => {
                    const id = parts.slice(0, index + 1).join("/");

                    // Logic for folder detection
                    const isFolder = (index < partsLength - 1) || isExplicitFolder;

                    let existing = currentLevel.find((el) => el.id === id);

                    if (!existing) {
                        existing = {
                            id,
                            name: part,
                            children: [],
                            isSelectable: true,
                            isFolder
                        };
                        currentLevel.push(existing);
                    } else {
                        if (isFolder) existing.isFolder = true;
                    }

                    // If it's a folder (not last part OR meant to be a folder), traverse into it
                    // Traverse if there are more parts to process
                    if (index < partsLength - 1) {
                        currentLevel = existing.children!;
                    }
                });
            });
            return root;
        };

        setElements(buildTree(files));
    }, [files]);

    const handleCreate = async () => {
        if (!newItemName.trim()) return;

        const prefix = selectedParent ? `${selectedParent}/` : "";
        const fullName = `${prefix}${newItemName}`;

        try {
            if (isCreatingFolder) {
                await invoke("create_folder", { name: fullName });
            } else if (isCreatingFile) {
                // Create an empty file
                const file = {
                    name: fullName,
                    text: "",
                    font: "serif",
                    font_size: 20,
                    theme: "light",
                };
                await invoke("save_file", { file });
            }

            setNewItemName("");
            setIsCreatingFolder(false);
            setIsCreatingFile(false);
            // Don't clear selectedParent immediately so user can create multiple files in same folder?
            // Or clear it to return to root? Clearing is probably safer to avoid confusion.
            // But let's keep it if user explicitly selected it.
            refreshFiles();
        } catch (error) {
            console.error("Creation error:", error);
            alert(`Error: ${error}`);
        }
    };

    const handleDelete = async (id: string, isFolder: boolean) => {
        const yes = await ask(`Delete ${isFolder ? 'folder' : 'file'} "${id}"?`, {
            title: 'Confirm Deletion',
            kind: 'warning'
        });
        if (yes) {
            onDeleteFile(id);
        }
    };

    const startCreatingIn = (folderId: string) => {
        setSelectedParent(folderId);
        setIsCreatingFile(true); // Default to creating file, can switch
    };

    return (
        <div className="fixed bottom-20 right-8 z-50 w-80 bg-black/90 backdrop-blur-md rounded-xl p-6 shadow-2xl border border-white/20 text-white flex flex-col max-h-[500px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <RxFileText className="w-5 h-5 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-bold">Files</h3>
                </div>
                <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
                    <RxCross2 size={20} />
                </button>
            </div>

            {/* Creation UI */}
            <div className="mb-4 space-y-2">
                {isCreatingFile || isCreatingFolder ? (
                    <div className="flex flex-col gap-2">
                        {selectedParent && (
                            <div className="text-xs text-white/50 flex items-center gap-1">
                                in: <span className="text-blue-400 font-mono">{selectedParent}</span>
                                <button onClick={() => setSelectedParent(null)} className="hover:text-white"><RxCross2 /></button>
                            </div>
                        )}
                        <div className="flex gap-2">
                            <input
                                autoFocus
                                value={newItemName}
                                onChange={e => setNewItemName(e.target.value)}
                                placeholder={isCreatingFolder ? "Folder name..." : "File name..."}
                                className="flex-1 bg-white/10 rounded px-2 py-1 text-sm outline-none focus:ring-1 ring-blue-500"
                                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                            />
                            <button onClick={handleCreate} className="text-green-400 text-xs uppercase font-bold">Add</button>
                            <button onClick={() => { setIsCreatingFile(false); setIsCreatingFolder(false); }} className="text-red-400 text-xs">X</button>
                        </div>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={() => { setSelectedParent(null); setIsCreatingFile(true); }}
                            className="flex-1 bg-white/5 hover:bg-white/10 rounded py-1 px-2 text-xs flex items-center justify-center gap-1 transition-colors"
                        >
                            <Plus size={12} /> New File
                        </button>
                        <button
                            onClick={() => { setSelectedParent(null); setIsCreatingFolder(true); }}
                            className="flex-1 bg-white/5 hover:bg-white/10 rounded py-1 px-2 text-xs flex items-center justify-center gap-1 transition-colors"
                        >
                            <FolderIcon size={12} /> New Folder
                        </button>
                    </div>
                )}
            </div>

            {/* Tree content */}
            <div className="flex-1 overflow-hidden relative">
                {elements.length === 0 ? (
                    <p className="text-center text-white/40 text-sm py-4">No files found</p>
                ) : (
                    <Tree
                        className="h-full overflow-y-auto"
                        initialSelectedId=""
                        indicator={true}
                        elements={elements}
                    >
                        {elements.map(element => (
                            <RecursiveTreeItem
                                key={element.id}
                                element={element}
                                onLoad={onLoadFile}
                                onDelete={handleDelete}
                                onStartCreate={startCreatingIn}
                            />
                        ))}
                    </Tree>
                )}
            </div>
        </div>
    );
}

// Recursive helper component to render tree nodes
const RecursiveTreeItem = ({
    element,
    onLoad,
    onDelete,
    onStartCreate
}: {
    element: TreeViewElement,
    onLoad: (id: string) => void,
    onDelete: (id: string, isFolder: boolean) => void,
    onStartCreate: (id: string) => void
}) => {

    if (element.isFolder) {
        return (
            <Folder
                element={
                    <div className="flex items-center justify-between w-full pr-2 group">
                        <span>{element.name}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={(e) => { e.stopPropagation(); onStartCreate(element.id); }}
                                className="p-1 hover:bg-white/10 rounded text-blue-300"
                                title="Add file here"
                            >
                                <Plus size={12} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(element.id, true); }}
                                className="p-1 hover:bg-white/10 rounded text-red-400"
                                title="Delete folder"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    </div>
                }
                value={element.id}
            >
                {element.children?.map(child => (
                    <RecursiveTreeItem
                        key={child.id}
                        element={child}
                        onLoad={onLoad}
                        onDelete={onDelete}
                        onStartCreate={onStartCreate}
                    />
                ))}
            </Folder>
        )
    }

    return (
        <div className="group flex items-center justify-between pr-2">
            <File value={element.id} onClick={() => onLoad(element.id)}>
                <p className="">{element.name}</p>
            </File>
            <button
                onClick={(e) => { e.stopPropagation(); onDelete(element.id, false); }}
                className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-400 transition-opacity"
            >
                <Trash2 size={12} />
            </button>
        </div>
    );
};
