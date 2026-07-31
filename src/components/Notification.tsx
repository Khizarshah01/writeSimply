import React, { useEffect } from "react";
import CheckedIcon from "@/components/ui/checked-icon";
import InfoCircleIcon from "@/components/ui/info-circle-icon";
import TriangleAlertIcon from "@/components/ui/triangle-alert-icon";

interface NotificationProps {
  type?: "success" | "error" | "info";
  message: string;
  onClose: () => void;
  duration?: number; // auto close after duration
}

const icons = {
  success: <CheckedIcon className="text-green-400" size={20} />,
  error: <TriangleAlertIcon className="text-red-400" size={20} />,
  info: <InfoCircleIcon className="text-blue-400" size={20} />,
};

const Notification: React.FC<NotificationProps> = ({
  type = "info",
  message,
  onClose,
  duration = 2500,
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div
      className={`flex items-center gap-3 p-3 mb-3 rounded-xl shadow-lg w-[260px] text-sm text-white 
        backdrop-blur-md transition-all duration-300 border 
        ${
          type === "success"
            ? "bg-green-500/20 border-green-500/40"
            : type === "error"
            ? "bg-red-500/20 border-red-500/40"
            : "bg-blue-500/20 border-blue-500/40"
        }`}
    >
      {icons[type]}
      <span className="flex-1">{message}</span>
    </div>
  );
};

export default Notification;
