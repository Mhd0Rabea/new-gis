export function Button({
  children,
  className = '',
  fullWidth = false,
  iconOnly = false,
  loading = false,
  loadingLabel = 'جارٍ التنفيذ...',
  size = 'default',
  type = 'button',
  variant = 'primary',
  disabled = false,
  ...props
}) {
  const classes = [
    'button',
    `button-${variant}`,
    `button-${size}`,
    fullWidth ? 'button-full' : '',
    iconOnly ? 'button-icon-only' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      {...props}
      type={/** @type {'button' | 'submit' | 'reset'} */ (type)}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-loading={loading || undefined}
    >
      {loading ? loadingLabel : children}
    </button>
  );
}