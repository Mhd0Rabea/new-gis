import { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { appRoutes, NotFoundPage } from './app/routes.jsx';
import { AppShell } from './components/AppShell.jsx';
import { LoadingState } from './components/StateViews.jsx';

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingState label="جاري التحميل..." />}>
        <Routes>
          <Route element={<AppShell />}>
            {appRoutes.map((route) => (
              <Route key={route.path} path={route.path} element={<route.Component />} />
            ))}
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
