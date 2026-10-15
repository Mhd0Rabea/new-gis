import toast, { Toaster } from 'react-hot-toast';
import { CheckCircle, AlertCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';

/** @type {import('react').CSSProperties} */
const baseStyle = {
  direction: 'rtl',
  maxWidth: '420px',
  padding: '14px 16px',
  color: 'var(--text)',
  background: 'var(--surface-raised)',
  border: '1px solid var(--line)',
  borderRadius: 0,
  boxShadow: 'var(--shadow-float)',
  fontSize: '13px',
  fontFamily: 'inherit',
};

const typeStyles = {
  success: {
    ...baseStyle,
    borderInlineStart: '4px solid var(--green)',
  },
  error: {
    ...baseStyle,
    borderInlineStart: '4px solid var(--danger)',
  },
  warning: {
    ...baseStyle,
    borderInlineStart: '4px solid var(--gold)',
  },
  info: {
    ...baseStyle,
    borderInlineStart: '4px solid var(--info)',
  },
  loading: {
    ...baseStyle,
    borderInlineStart: '4px solid var(--green)',
  },
};

const icons = {
  success: <CheckCircle size={20} style={{ color: 'var(--green)' }} />,
  error: <AlertCircle size={20} style={{ color: 'var(--danger)' }} />,
  warning: <AlertTriangle size={20} style={{ color: 'var(--gold)' }} />,
  info: <Info size={20} style={{ color: 'var(--info)' }} />,
  loading: <Loader2 size={20} className="spin" style={{ color: 'var(--green)' }} />,
};

export function ToastProvider({ children }) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: baseStyle,
          success: { iconTheme: { primary: 'var(--green)', secondary: 'var(--bg)' }, style: typeStyles.success },
          error: { iconTheme: { primary: 'var(--danger)', secondary: 'var(--bg)' }, style: typeStyles.error },
          loading: { iconTheme: { primary: 'var(--green)', secondary: 'var(--bg)' }, style: typeStyles.loading },
        }}
      />
    </>
  );
}

export function useToast() {
  return {
    success: (message, options) => toast.success(message, { icon: icons.success, ...options }),
    error: (message, options) => toast.error(message, { icon: icons.error, ...options }),
    warning: (message, options) => toast(message, { icon: icons.warning, style: typeStyles.warning, ...options }),
    info: (message, options) => toast(message, { icon: icons.info, style: typeStyles.info, ...options }),
    loading: (message, options) => toast.loading(message, { icon: icons.loading, style: typeStyles.loading, ...options }),
    dismiss: toast.dismiss,
    promise: (promise, messages) => toast.promise(promise, {
      loading: { icon: icons.loading, style: typeStyles.loading, ...messages.loading },
      success: { icon: icons.success, style: typeStyles.success, ...messages.success },
      error: { icon: icons.error, style: typeStyles.error, ...messages.error },
    }),
    custom: (message, options) => toast(message, { ...options, style: { ...baseStyle, ...options?.style } }),
  };
}

export default toast;