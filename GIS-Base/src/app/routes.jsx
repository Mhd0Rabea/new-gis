import { BarChart3, Box, BrainCircuit, Database, FileCog, FileText, LayoutDashboard, Map, Settings } from 'lucide-react';
import { lazy } from 'react';

export const HomePage = lazy(() => import('../pages/HomePage.jsx').then((m) => ({ default: m.HomePage })));
export const MapPage = lazy(() => import('../pages/MapPage.jsx').then((m) => ({ default: m.MapPage })));
export const DataManagementPage = lazy(() => import('../pages/DataManagementPage.jsx').then((m) => ({ default: m.DataManagementPage })));
export const AnalyticsPage = lazy(() => import('../pages/AnalyticsPage.jsx').then((m) => ({ default: m.AnalyticsPage })));
export const ReportsPage = lazy(() => import('../pages/ReportsPage.jsx').then((m) => ({ default: m.ReportsPage })));
export const ProcessingPage = lazy(() => import('../pages/ProcessingPage.jsx').then((m) => ({ default: m.ProcessingPage })));
export const ScenePage = lazy(() => import('../pages/ScenePage.jsx').then((m) => ({ default: m.ScenePage }))); 
export const DecisionCenterPage = lazy(() => import('../pages/DecisionCenterPage.jsx').then((m) => ({ default: m.DecisionCenterPage })));
export const AdminPage = lazy(() => import('../pages/AdminPage.jsx').then((m) => ({ default: m.AdminPage })));
export const NotFoundPage = lazy(() => import('../pages/NotFoundPage.jsx').then((m) => ({ default: m.NotFoundPage })));

export const appRoutes = [
  { path: '/', navLabel: 'لوحة المعلومات', title: 'لوحة المعلومات', subtitle: 'صورة تشغيلية للجاهزية والمتابعة والتحليلات الوصفية', group: 'الأساسيات', icon: LayoutDashboard, Component: HomePage },
  { path: '/map', navLabel: 'الخريطة', title: 'خريطة MGOS', subtitle: 'استكشاف الطبقات والتحرير المكاني', group: 'الأساسيات', icon: Map, Component: MapPage },
  { path: '/data', navLabel: 'إدارة البيانات', title: 'إدارة البيانات', subtitle: 'بحث وتصفية ومراجعة سجلات الطبقات', group: 'العمليات', icon: Database, Component: DataManagementPage },
  { path: '/analytics', navLabel: 'التحليلات', title: 'التحليلات الوصفية', subtitle: 'مقارنات مباشرة من البيانات الحالية', group: 'العمليات', icon: BarChart3, Component: AnalyticsPage },
  { path: '/reports', navLabel: 'التقارير', title: 'التقارير التشغيلية', subtitle: 'معاينة وطباعة وتصدير البيانات', group: 'العمليات', icon: FileText, Component: ReportsPage },
  { path: '/processing', navLabel: 'مركز المعالجة', title: 'مركز المعالجة', subtitle: 'تشغيل ومتابعة مهام Raster وسحابات النقاط', group: 'المعالجة', icon: FileCog, Component: ProcessingPage },
  { path: '/scene', navLabel: 'العرض ثلاثي الأبعاد', title: 'العرض ثلاثي الأبعاد', subtitle: 'استكشاف التضاريس والمخرجات في مشهد تفاعلي', group: 'المعالجة', icon: Box, Component: ScenePage },
  { path: '/decision', navLabel: 'مركز القرار', title: 'مركز القرار المكاني', subtitle: 'تقييم المخاطر وجاهزية المسارات من بياناتك المرفوعة', group: 'العمليات', icon: BrainCircuit, Component: DecisionCenterPage },  { path: '/admin', navLabel: 'الإدارة', title: 'إدارة النظام', subtitle: 'مراقبة المستخدمين والتدقيق والمرفقات', group: 'العمليات', icon: Settings, Component: AdminPage },
];
export const navigationGroups = ['الأساسيات', 'العمليات', 'المعالجة'].map((label) => ({ label, items: appRoutes.filter((r) => r.group === label) }));
export function getRouteMetadata(pathname) { return appRoutes.find((item) => item.path === pathname) ?? { title: 'GIS Base', subtitle: 'نظام المعلومات الجغرافية' }; }


