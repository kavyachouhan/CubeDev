"use client";

import { useState, useRef, useEffect } from "react";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export function Tooltip({ content, children, disabled = false }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (disabled) {
    return <>{children}</>;
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    setIsVisible(true);

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout to hide after 2 seconds
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 2000);
  };

  const handleMouseEnter = () => {
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  const handleBackdropClick = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  return (
    <div className="relative block w-full">
      {/* Wrapper for children */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        className="w-full"
      >
        {children}
      </div>

      {/* Tooltip */}
      {isVisible && (
        <>
          {/* Backdrop for mobile to close tooltip */}
          <div
            className="fixed inset-0 z-40 md:hidden"
            onClick={handleBackdropClick}
          />

          {/* Tooltip content */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 px-3 py-2 text-xs font-medium text-white bg-gray-900 rounded-lg shadow-lg max-w-[200px] sm:max-w-xs text-center pointer-events-none">
            {content}
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
              <div className="border-4 border-transparent border-t-gray-900" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}