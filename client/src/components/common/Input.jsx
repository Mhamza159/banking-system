import React, { useState } from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

/**
 * Reusable Input Primitive
 * Accessible form field with label, icon slots, inline validation message, and password toggle.
 * Fully dual-theme compliant via Phase 16 semantic tokens.
 */
export default function Input({
  label,
  id,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  error = null,
  helperText = null,
  disabled = false,
  required = false,
  icon: Icon = null,
  suffix = null,
  className = "",
  autoComplete,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || name;
  const isPassword = type === "password";
  const resolvedType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
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
        {Icon && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-text-muted">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <input
          id={inputId}
          name={name}
          type={resolvedType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          className={`
            w-full rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200
            ${Icon ? "pl-10" : "pl-4"}
            ${isPassword || suffix ? "pr-11" : "pr-4"}
            ${
              error
                ? "bg-rose-950/20 border border-state-error/50 text-text-primary focus:ring-2 focus:ring-state-error/30 focus:border-state-error"
                : "glass-input"
            }
            placeholder:text-text-muted disabled:opacity-50 disabled:cursor-not-allowed
          `}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 text-text-muted hover:text-text-primary focus:outline-none transition-colors"
            tabIndex="-1"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}

        {!isPassword && suffix && (
          <div className="absolute right-3.5 flex items-center">{suffix}</div>
        )}
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
