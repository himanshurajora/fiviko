import { forwardRef, type InputHTMLAttributes } from 'react';
import clsx from 'clsx';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

/** Labelled text input with accessible error messaging. */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, hint, id, className, ...props },
  ref,
) {
  const inputId = id ?? props.name ?? label.replace(/\s+/g, '-').toLowerCase();
  const errorId = `${inputId}-error`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-semibold text-ink">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={clsx(
          'focus-ring h-12 rounded-2xl border bg-surface px-4 text-base text-ink placeholder:text-ink-soft/60',
          error ? 'border-danger' : 'border-muted-border',
          className,
        )}
        {...props}
      />
      {hint && !error && <p className="text-xs text-ink-soft">{hint}</p>}
      {error && (
        <p id={errorId} className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
});
