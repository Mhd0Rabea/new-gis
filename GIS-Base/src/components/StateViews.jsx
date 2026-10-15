import { AlertTriangle, LoaderCircle } from 'lucide-react';
import { Button } from './Button.jsx';

export function LoadingState({ label = 'جاري تحميل البيانات...' }) {
  return <div className="state-view" role="status"><LoaderCircle className="spin" size={25} aria-hidden="true" /><span>{label}</span></div>;
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="state-view state-error" role="alert">
      <AlertTriangle size={25} aria-hidden="true" />
      <span>{message}</span>
      {onRetry && <Button variant="secondary" onClick={onRetry}>إعادة المحاولة</Button>}
    </div>
  );
}

export function EmptyState({ title, description, actionLabel, onAction, icon: Icon }) {
  return (
    <div className="empty-action-state">
      {Icon && <Icon size={48} aria-hidden="true" />}
      <strong>{title}</strong>
      <span>{description}</span>
      {actionLabel && onAction && <Button onClick={onAction}>{actionLabel}</Button>}
    </div>
  );
}
