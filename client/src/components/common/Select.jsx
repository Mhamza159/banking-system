import React from "react";
import { ChevronDown, AlertCircle } from "lucide-react";

/**
 * Reusable Select Primitive
 * Styled dropdown supporting options with labels and value tracking.
 * Fully dual-theme compliant via Phase 16 semantic tokens.
 */
export default function Select({
  label,
  id,
  name,
  value,
  onChange,
  options = [],
  error = null,
  helperText = null,
  disabled = false,
  required = false,
  className = "",
  placeholder = "Select an option",
  ...props
}) {
  const selectId = id || name;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center justify-between"
        >
          <span>
            {label}
            {required && <span className="text-state-error ml-1">*</span>}
          </span>
          {helperText && !error && (
            <span className="text-xs normal-case tracking-normal text-text-muted font-normal">
              {helperText}
            </span>
          )}
        </label>
      )}

      <div className="relative flex items-center">
        <select
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`
            w-full rounded-xl pl-4 pr-10 py-2.5 text-sm font-medium transition-all duration-200 appearance-none cursor-pointer
            ${
              error
                ? "bg-rose-950/20 border border-state-error/50 text-text-primary focus:ring-2 focus:ring-state-error/30 focus:border-state-error"
                : "glass-input"
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="bg-surface text-text-muted">
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className="bg-surface text-text-primary py-2"
            >
              {option.label}
            </option>
          ))}
        </select>

        <div className="absolute right-3.5 pointer-events-none text-text-muted">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {error && (
        <p className="text-xs text-state-error font-medium flex items-center gap-1.5 mt-0.5 animate-fadeIn">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
