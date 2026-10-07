import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

/**
 * ThemeToggle Component
 * Accessible, micro-animated toggle button for switching between Light and Dark themes.
 * Supports compact icon mode or pill badge with label.
 */
export default function ThemeToggle({ showLabel = false, className = "" }) {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      className={`
        relative inline-flex items-center justify-center
        ${showLabel ? "px-3 py-1.5 gap-2 rounded-xl text-xs font-medium" : "p-2 rounded-xl"}
        bg-surface hover:bg-elevated
        border border-border-default hover:border-border-strong
        text-text-secondary hover:text-text-primary
        shadow-sm hover:shadow-md
        transition-all duration-200 ease-out
        focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:ring-offset-1 focus:ring-offset-canvas
        active:scale-95
        ${className}
      `}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 transform transition-transform duration-300 rotate-0 hover:rotate-45" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-600 transform transition-transform duration-300 -rotate-12 hover:rotate-0" />
        )}
      </div>

      {showLabel && (
        <span className="tracking-wide select-none capitalize">
          {isDark ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </button>
  );
}
