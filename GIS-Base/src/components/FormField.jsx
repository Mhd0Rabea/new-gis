import { Children, cloneElement, isValidElement, useId } from 'react';

export function FormField({
  label,
  required = false,
  hint = undefined,
  error = undefined,
  children,
  className = '',
  htmlFor = undefined,
}) {
  const generatedId = useId();
  const fieldId = htmlFor || `field-${generatedId.replaceAll(':', '')}`;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`form-field ${className}`}>
      <label htmlFor={fieldId} className="form-field-label">
        {label}
        {required && <span className="required-mark" aria-hidden="true">*</span>}
      </label>
      {Children.map(children, (child) =>
        isValidElement(child)
          ? cloneElement(child, {
              id: fieldId,
              required: required || undefined,
              'aria-describedby': describedBy,
              'aria-invalid': error ? 'true' : undefined,
            })
          : child
      )}
      {hint && <span id={hintId} className="form-field-hint">{hint}</span>}
      {error && <span id={errorId} className="inline-error" role="alert">{error}</span>}
    </div>
  );
}

export function FormSection({ legend, children, className = '' }) {
  return (
    <fieldset className={`form-section ${className}`}>
      {legend && <legend className="form-section-legend">{legend}</legend>}
      {children}
    </fieldset>
  );
}
