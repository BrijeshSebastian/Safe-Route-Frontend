import React from 'react';

export const FormField = ({
  id,
  label,
  hint,
  error,
  required = false,
  children,
  className = '',
}) => {
  const errorId = id ? `${id}-error` : undefined;
  const hintId = id ? `${id}-hint` : undefined;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-ink-soft">
          {label}
          {required && (
            <span className="ml-1 text-pastel-rose-text" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      {children}

      {hint && !error && (
        <p id={hintId} className="text-xs text-ink-faint">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-pastel-rose-text">
          {error}
        </p>
      )}
    </div>
  );
};

export default FormField;
