export function FormError({ message, className = '' }) {
  if (!message) return null;
  return (
    <div className={`inline-error ${className}`} role="alert">
      {message}
    </div>
  );
}

export function FieldError({ error, className = '' }) {
  if (!error) return null;
  return (
    <span id={`${className}-error`} className={`inline-error ${className}`} role="alert">
      {error}
    </span>
  );
}