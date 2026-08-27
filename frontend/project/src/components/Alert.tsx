import React, { useEffect, useRef, useState } from "react";

interface AlertProps {
  type: "Success" | "error" | "info";
  message: string;
  duration?: number;
}

const Alert: React.FC<AlertProps> = ({ type, message, duration = 5000 }) => {
  const [visible, setVisible] = useState(true);
  const alertRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisible(true); // ✅ reset visibility each time message changes

    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [message, duration]);

  useEffect(() => {
    if (visible && alertRef.current) {
      alertRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [visible]);

  if (!visible) return null;

  let bgColor = "";
  let textColor = "";

  switch (type) {
    case "Success":
      bgColor = "bg-success-100";
      textColor = "text-success-700";
      break;
    case "error":
      bgColor = "bg-error-100";
      textColor = "text-error-700";
      break;
    case "info":
      bgColor = "bg-primary-100";
      textColor = "text-primary-700";
      break;
    default:
      bgColor = "bg-neutral-100";
      textColor = "text-neutral-700";
  }

  return (
    <div ref={alertRef} className={`p-2 mt-2 rounded ${bgColor} ${textColor}`}>
      {message}
    </div>
  );
};

export default Alert;
