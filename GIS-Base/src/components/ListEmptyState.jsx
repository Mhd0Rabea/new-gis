import { Button } from './Button.jsx';

export function ListEmptyState({ title = 'لا توجد بيانات', description = '', actionLabel, onAction, icon: Icon, className = '' }) {
  return (
    <div className={`empty-action-state ${className}`}>
      {Icon && <Icon size={48} aria-hidden="true" />}
      <strong>{title}</strong>
      {description && <span>{description}</span>}
      {actionLabel && onAction && <Button onClick={onAction}>{actionLabel}</Button>}
    </div>
  );
}