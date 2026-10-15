import { Link } from 'react-router-dom';
import { Home, ShieldCheck } from 'lucide-react';

export function NotFoundPage() {
  return (
    <main className="not-found">
      <ShieldCheck size={70} />
      <h1>الصفحة غير موجودة</h1>
      <p>المسار المطلوب غير متاح.</p>
      <Link to="/" className="text-link"><Home size={17} aria-hidden="true" /> العودة إلى الرئيسية</Link>
    </main>
  );
}