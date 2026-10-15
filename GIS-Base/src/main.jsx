import React from 'react';
import ReactDOM from 'react-dom/client';
import { ToastProvider } from './components/Toast.jsx';
import './styles.css';
import { App } from './App.jsx';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element was not found');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>,
);