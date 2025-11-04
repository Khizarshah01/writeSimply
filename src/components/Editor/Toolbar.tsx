import React from "react";

interface ToolbarProps {
  position: { x: number; y: number };
  onClose: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ position, onClose }) => {
  return (
    <div
      className="absolute bg-gray-800 text-white rounded-xl shadow-lg p-2 flex gap-2 z-50"
      style={{
        top: position.y,
        left: position.x,
        transform: "translate(-50%, -100%)",
      }}
    >
      <button className="hover:bg-gray-700 px-2 py-1 rounded">B</button>
      <button className="hover:bg-gray-700 px-2 py-1 rounded italic">I</button>
      <button className="hover:bg-gray-700 px-2 py-1 rounded">{'</>'}</button>
      <button onClick={onClose} className="hover:bg-red-700 px-2 py-1 rounded">×</button>
    </div>
  );
};

export default Toolbar;
