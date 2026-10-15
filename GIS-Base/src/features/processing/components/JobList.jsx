import { Ban, Download, Eye, Map, RotateCcw, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/Button.jsx';
import { formatDateTime } from '../../operations/utils/formatters.js';

const statusLabels = { pending: 'بانتظار التنفيذ', running: 'قيد المعالجة', completed: 'مكتملة', failed: 'فشلت', cancelled: 'ملغاة' };

export function JobList({ jobs, operations, onCancel, onRetry, onDelete }) {
  if (!jobs.length) return <p className="empty-inline">لا توجد مهام بعد. اختر عملية ثم شغّلها.</p>;
  return <div className="job-list">{jobs.map(job => {
    const operation = operations.find(item => item.value === job.operation);
    const isContour = job.outputFile?.endsWith('.geojson');
    const canPreview = job.outputFile?.endsWith('.tif');
    return <article key={job.id} className={`job-card status-${job.status}`}>
      <div><strong>{operation?.label ?? job.operation}</strong><span>{job.inputFile}</span></div>
      <div className="job-progress"><i><em style={{ width: `${job.progress}%` }} /></i><span>{job.progress}%</span></div>
      <div><span className="job-status">{statusLabels[job.status]}</span><small>{formatDateTime(job.createdAt)}</small></div>
      <div className="job-actions">
        {['pending', 'running'].includes(job.status) && <Button variant="danger" size="compact" iconOnly aria-label="إلغاء المهمة" onClick={() => onCancel(job.id)}><Ban size={17} /></Button>}
        {job.outputFile && <a className="job-action-link" href={`/api/processing/jobs/${job.id}/output`} aria-label="تنزيل المخرج"><Download size={17} /></a>}
        {canPreview && <a className="job-action-link" href={`/api/processing/jobs/${job.id}/preview`} target="_blank" rel="noreferrer" aria-label="معاينة المخرج"><Eye size={17} /></a>}
        {isContour && <Link className="job-action-link" to={`/map?processingArtifact=${job.id}`} aria-label="عرض المخرج على الخريطة"><Map size={17} /></Link>}
        {['completed', 'failed', 'cancelled'].includes(job.status) && <Button variant="secondary" size="compact" iconOnly aria-label="إعادة تشغيل المهمة" onClick={() => onRetry(job.id)}><RotateCcw size={17} /></Button>}
        {['completed', 'failed', 'cancelled'].includes(job.status) && <Button variant="danger" size="compact" iconOnly aria-label="حذف المهمة" onClick={() => onDelete(job.id)}><Trash2 size={17} /></Button>}
      </div>
      {job.outputFile && <code>{job.outputFile}</code>}
      {job.parameters && <small className="job-parameters">المعاملات: {Object.entries(job.parameters).map(([key, value]) => `${key}=${value}`).join('، ')}</small>}
      {job.error && <p role="alert">{job.error}</p>}
    </article>;
  })}</div>;
}