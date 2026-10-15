import { BrainCircuit, FileUp, Play, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '../../../components/Button.jsx';
import { createAiClassification, listAiModels, uploadAiModel, uploadProcessingFile } from '../services/processingApi.js';

export function AiClassificationPanel({ onStarted, onError }) {
  const [models, setModels] = useState([]);
  const [modelId, setModelId] = useState('');
  const [pointFile, setPointFile] = useState(null);
  const [modelFile, setModelFile] = useState(null);
  const [threshold, setThreshold] = useState(70);
  const [busy, setBusy] = useState(false);

  const loadModels = useCallback(() => listAiModels().then((items) => {
    setModels(items);
    setModelId((current) => current || items[0]?.id || '');
  }).catch(onError), [onError]);

  useEffect(() => { loadModels(); }, [loadModels]);

  const uploadModel = async () => {
    if (!modelFile) return onError('اختر ملف JSON لإعداد النموذج أولًا.');
    setBusy(true);
    try {
      const model = await uploadAiModel(modelFile);
      setModels([model]);
      setModelId(model.id);
      setModelFile(null);
    } catch (error) {
      onError(error?.response?.data?.message ?? 'تعذر رفع إعداد النموذج.');
    } finally {
      setBusy(false);
    }
  };

  const start = async () => {
    if (!pointFile) return onError('ارفع ملف LAS أو LAZ أولًا.');
    if (!modelId) return onError('ارفع إعداد نموذج التصنيف أولًا.');
    setBusy(true);
    try {
      const uploaded = await uploadProcessingFile(pointFile);
      const job = await createAiClassification({ inputFile: uploaded.fileName, modelVersionId: modelId, confidenceThreshold: threshold / 100 });
      setPointFile(null);
      onStarted(job);
    } catch (error) {
      onError(error?.response?.data?.message ?? 'تعذر بدء التصنيف الذكي.');
    } finally {
      setBusy(false);
    }
  };

  return <section className="ops-panel ai-launch">
    <div className="panel-head"><div><span className="ops-kicker">تصنيف مرفوع</span><h3>تصنيف سحابة النقاط بالذكاء الاصطناعي</h3></div><BrainCircuit size={26} /></div>
    <div className="ai-warning"><ShieldCheck size={18} /><span>ارفع ملف النقاط وإعداد النموذج. النتيجة توصية ولا تُعتمد قبل مراجعة بشرية.</span></div>
    <div className="ai-controls">
      <label className="ai-field ai-point-file"><span>ملف النقاط</span><input type="file" accept=".las,.laz" onChange={(event) => setPointFile(event.target.files?.[0] ?? null)} /><span className="processing-file-value"><FileUp size={16} />{pointFile?.name ?? 'اختر ملف LAS أو LAZ'}</span></label>
      <label className="ai-field ai-model-upload"><span>إعداد النموذج</span><input type="file" accept=".json,application/json" onChange={(event) => setModelFile(event.target.files?.[0] ?? null)} /><span className="ai-model-file-value"><FileUp size={16} />{modelFile?.name ?? 'اختر ملف JSON'}</span><Button variant="secondary" size="compact" loading={busy} onClick={uploadModel}><FileUp size={16} />رفع</Button></label>
      <label className="ai-field"><span>النموذج</span><select value={modelId} onChange={(event) => setModelId(event.target.value)}><option value="">اختر نموذجًا مرفوعًا</option>{models.map((model) => <option key={model.id} value={model.id}>{model.name} — {model.version}</option>)}</select></label>
      <label className="ai-field ai-confidence"><span>حد الثقة</span><strong>{threshold}%</strong><input type="range" min="50" max="95" value={threshold} onChange={(event) => setThreshold(Number(event.target.value))} /></label>
      <Button className="ai-start-button" loading={busy} loadingLabel="جارٍ الإضافة..." onClick={start}><Play size={18} />تشغيل التصنيف</Button>
    </div>
  </section>;
}