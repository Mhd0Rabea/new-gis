import { X } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

export function Modal({ isOpen, onClose, title, children, className = '', size = 'default', returnFocusSelector = '' }) {
  const contentRef = useRef(null);
  const previousActiveElement = useRef(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const appRoot = document.getElementById('root');
    const wasInert = appRoot?.hasAttribute('inert') ?? false;
    const previousOverflow = document.body.style.overflow;
    previousActiveElement.current = document.activeElement;
    document.body.style.overflow = 'hidden';
    appRoot?.setAttribute('inert', '');

    const focusFrame = window.requestAnimationFrame(() => {
      const firstControl = contentRef.current?.querySelector(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
      );
      firstControl?.focus();
    });
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusableElements = contentRef.current?.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusableElements?.length) {
        event.preventDefault();
        contentRef.current?.focus();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (appRoot && !wasInert) appRoot.removeAttribute('inert');
      const previous = previousActiveElement.current;
      if (previous && previous !== document.body && document.contains(previous)) {
        previous.focus?.();
      } else if (returnFocusSelector) {
        document.querySelector(returnFocusSelector)?.focus?.();
      }
    };
  }, [isOpen, returnFocusSelector]);

  if (!isOpen) return null;

  const sizes = {
    default: 'min(560px, 100%)',
    small: 'min(420px, 100%)',
    large: 'min(720px, 100%)',
    full: 'min(900px, 100%)',
  };

  return createPortal(
    <div className="drawer-layer" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="drawer-backdrop" onMouseDown={onClose} aria-hidden="true" />
      <div
        ref={contentRef}
        className={`asset-drawer ${className}`}
        tabIndex={-1}
        style={{ inlineSize: sizes[size] }}
      >
        <div className="drawer-heading">
          <div>
            {title && <h2 id={titleId}>{title}</h2>}
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="إغلاق النافذة"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}