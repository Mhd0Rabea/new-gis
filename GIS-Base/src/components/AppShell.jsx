import { Menu, ShieldCheck, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { getRouteMetadata, navigationGroups } from '../app/routes.jsx';
import { runtimeConfig } from '../config/runtime.js';
const NAV_CODES = {
  '/': 'DASH',
  '/map': 'MAP',
  '/data': 'DATA',
  '/analytics': 'ANL',
  '/reports': 'RPT',
  '/decision': 'DEC',
  '/admin': 'ADM',
  '/processing': 'PROC',
  '/scene': '3D',
};

export function AppShell() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const menuCloseRef = useRef(null);
  const [geoServerStatus, setGeoServerStatus] = useState('checking');
  const { title, subtitle } = getRouteMetadata(location.pathname);

  useEffect(() => {
    let disposed = false;
    let activeController;

    const checkGeoServer = async () => {
      activeController?.abort();
      activeController = new AbortController();
      const timeout = window.setTimeout(() => activeController.abort(), 6000);
      try {
        const url = runtimeConfig.geoserverBaseUrl + '/mgos/wms?service=WMS&version=1.3.0&request=GetCapabilities';
        const response = await fetch(url, { cache: 'no-store', signal: activeController.signal });
        const body = await response.text();
        const operational = response.ok && /WMS_Capabilities|WMT_MS_Capabilities/.test(body);
        if (!disposed) setGeoServerStatus(operational ? 'online' : 'offline');
      } catch {
        if (!disposed) setGeoServerStatus('offline');
      } finally {
        window.clearTimeout(timeout);
      }
    };

    const handleOffline = () => setGeoServerStatus('offline');
    const handleOnline = () => void checkGeoServer();
    const handleVisibility = () => { if (document.visibilityState === 'visible') void checkGeoServer(); };
    void checkGeoServer();
    const interval = window.setInterval(checkGeoServer, 30000);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      disposed = true;
      activeController?.abort();
      window.clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);


  useEffect(() => {
    if (!menuOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const menuButton = menuButtonRef.current;
    document.body.style.overflow = 'hidden';
    menuCloseRef.current?.focus();
    const closeOnEscape = (event) => { if (event.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('keydown', closeOnEscape);
    return () => { document.removeEventListener('keydown', closeOnEscape); document.body.style.overflow = previousOverflow; menuButton?.focus(); };
  }, [menuOpen]);

  return (
    <div className="app-shell sidebar-is-collapsed">
      <a className="skip-link" href="#main-content">تجاوز إلى المحتوى الرئيسي</a>
      <button ref={menuButtonRef} className="mobile-menu-button" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? 'إغلاق القائمة' : 'فتح القائمة'} aria-controls="primary-sidebar" aria-expanded={menuOpen}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
      {menuOpen && <button className="sidebar-backdrop" onClick={() => setMenuOpen(false)} aria-label="إغلاق القائمة بالنقر خارجها" />}

      <aside id="primary-sidebar" className={`sidebar sidebar-collapsed ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-block">
          <div className="brand-mark"><ShieldCheck size={25} /></div>
          <div className="brand-copy"><strong>GIS Base</strong><span>قالب مشروع نظيف</span></div>
          <button ref={menuCloseRef} className="sidebar-close" type="button" onClick={() => setMenuOpen(false)} aria-label="إغلاق القائمة"><X size={20} /></button>
        </div>

        <nav className="primary-nav" aria-label="التنقل الرئيسي">
          {navigationGroups.map((group, groupIndex) => (
            <div className="nav-group" key={group.label}>
              <span className="nav-group-label sr-only">{group.label}</span>
              <div id={`navigation-group-${groupIndex}`}>
                {group.items.map(({ path, navLabel, icon: Icon }) => (
                  <NavLink to={path} key={path} onClick={() => setMenuOpen(false)} aria-label={navLabel} title={navLabel}><Icon size={19} aria-hidden="true" /><code className="nav-code" aria-hidden="true">{NAV_CODES[path]}</code></NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div
            className="connection-state"
            aria-live="polite"
            aria-label={geoServerStatus === 'online' ? 'خدمة GeoServer تعمل' : geoServerStatus === 'checking' ? 'جاري فحص خدمة GeoServer' : 'خدمة GeoServer متوقفة'}
            title={geoServerStatus === 'online' ? 'GeoServer يعمل' : geoServerStatus === 'checking' ? 'جاري فحص GeoServer' : 'GeoServer لا يعمل'}
          >
            <span className={'status-dot ' + (geoServerStatus === 'offline' ? 'status-error' : geoServerStatus === 'checking' ? 'status-pending' : '')} aria-hidden="true" />
            <div>
              <strong>{geoServerStatus === 'online' ? 'GeoServer يعمل' : geoServerStatus === 'checking' ? 'جاري الفحص' : 'GeoServer متوقف'}</strong>
              <span>خدمة الخرائط</span>
            </div>
          </div>

        </div>
      </aside>

      <main className="main-area" id="main-content" tabIndex={-1}>
        <header className="topbar"><div className="page-heading"><h1>{title}</h1><p>{subtitle}</p></div></header>
        <div className="page-content"><Outlet /></div>
      </main>
    </div>
  );
}