import { Activity, Database, FileText, ShieldCheck, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ErrorState, LoadingState } from '../components/StateViews.jsx';
import { loadStandaloneTable } from '../features/operations/services/operationsData.js';
import { formatPropertyValue, getArabicFieldLabel } from '../features/map/config/fieldPresentation.js';

function AdminList({ icon: Icon, title, records, fields, empty }) {
  return <section className="admin-panel">
    <header><span><Icon size={17} aria-hidden="true" /> {title}</span><b>{records.length}</b></header>
    {records.length ? <ul>{records.slice(0, 5).map((record, index) => <li key={record.id ?? index}>{fields.map((field) => <span key={field}><small>{getArabicFieldLabel(field)}</small><strong>{formatPropertyValue(field, record[field]).text}</strong></span>)}</li>)}</ul> : <p>{empty}</p>}
  </section>;
}

export function AdminPage() {
  const [state, setState] = useState({ status: 'loading', users: [], audits: [], attachments: [], error: null });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([loadStandaloneTable('System_Users', controller.signal), loadStandaloneTable('Audit_Log', controller.signal), loadStandaloneTable('Attachments_Metadata', controller.signal)])
      .then(([users, audits, attachments]) => setState({ status: 'ready', users, audits, attachments, error: null }))
      .catch((error) => !controller.signal.aborted && setState({ status: 'error', users: [], audits: [], attachments: [], error: error.message }));
    return () => controller.abort();
  }, [retry]);
  if (state.status === 'loading') return <LoadingState label="جاري قراءة حالة الإدارة..." />;
  if (state.status === 'error') return <ErrorState message={state.error} onRetry={() => setRetry((value) => value + 1)} />;
  return <div className="admin-page">
    <section className="admin-command"><div><span>إدارة النظام</span><h2>المستخدمون والتدقيق والوثائق</h2><p>مساحة رقابية للقراءة؛ لا يتم تعديل الصلاحيات أو السجلات دون عقد API مخصص.</p></div><ShieldCheck size={36} aria-hidden="true" /></section>
    <section className="admin-summary"><article><Users aria-hidden="true" /><span>المستخدمون</span><strong>{state.users.length}</strong></article><article><Activity aria-hidden="true" /><span>عمليات مسجلة</span><strong>{state.audits.length}</strong></article><article><FileText aria-hidden="true" /><span>مرفقات</span><strong>{state.attachments.length}</strong></article></section>
    <section className="admin-grid"><AdminList icon={Users} title="مستخدمو النظام" records={state.users} fields={['full_name', 'username', 'role']} empty="لا توجد حسابات مسجلة."/><AdminList icon={Activity} title="آخر العمليات" records={state.audits} fields={['action', 'entity_type', 'created_at']} empty="لا توجد عمليات تدقيق مسجلة."/><AdminList icon={FileText} title="بيانات المرفقات" records={state.attachments} fields={['file_name', 'file_type', 'created_at']} empty="لا توجد مرفقات مسجلة."/></section>
    <Link className="admin-data-link" to="/data"><Database size={17} aria-hidden="true" />فتح إدارة البيانات والجداول</Link>
  </div>;
}
