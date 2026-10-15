import { Database, FileUp, MapPinned, Table2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { publishedLayers } from '../features/map/config/layers.js';
import { standaloneTables } from '../features/operations/config/standaloneTables.js';
import { loadLayerPage, loadStandaloneTable } from '../features/operations/services/operationsData.js';
import { DataToolbar } from '../features/operations/components/DataToolbar.jsx';
import { LayerDataView } from '../features/operations/components/LayerDataView.jsx';
import { ErrorState, LoadingState } from '../components/StateViews.jsx';
import { formatPropertyValue, getArabicFieldLabel } from '../features/map/config/fieldPresentation.js';
import { Button } from '../components/Button.jsx';
import { Modal } from '../components/Modal.jsx';
import { ImportWizard } from '../features/imports/ImportWizard.jsx';

function StandaloneTableView({ records, query, table }) {
  const filtered = useMemo(() => records.filter((record) => JSON.stringify(record).toLowerCase().includes(query.toLowerCase())), [records, query]);
  return <section className="ops-panel standalone-table-view">
    <div className="standalone-table-heading"><Table2 size={18} aria-hidden="true" /><span>{filtered.length} سجلًا</span></div>
    {filtered.length ? <div className="standalone-record-list">{filtered.map((record, index) => {
      const parentId = table?.parentField ? record[table.parentField] : null;
      return <article key={record.id ?? index}>
        {Object.entries(record).filter(([key]) => !['id', 'password_hash'].includes(key)).slice(0, 6).map(([key, value]) => <div key={key}><span>{getArabicFieldLabel(key)}</span><strong>{formatPropertyValue(key, value).text}</strong></div>)}
        {parentId ? <Link className="standalone-parent-link" to={'/map?layer=' + table.parentLayer + '&id=' + parentId}><MapPinned size={16} aria-hidden="true" />فتح {table.parentLabel} المرتبط</Link> : null}
      </article>;
    })}</div> : <p className="empty-inline">لا توجد سجلات مطابقة.</p>}
  </section>;
}

export function DataManagementPage() {
 const [importOpen,setImportOpen]=useState(false);
 const [view,setView]=useState('layers'); const [layerName,setLayerName]=useState(publishedLayers[0].name); const [tableName,setTableName]=useState(standaloneTables[0].name); const [query,setQuery]=useState(''); const [retry,setRetry]=useState(0); const [state,setState]=useState({status:'loading',features:[],error:null});
 useEffect(()=>{const c=new AbortController(); const request=view==='layers'?loadLayerPage(layerName,{limit:100,signal:c.signal}).then((data)=>data.features??[]):loadStandaloneTable(tableName,c.signal); request.then((features)=>setState({status:'ready',features,error:null})).catch((error)=>!c.signal.aborted&&setState({status:'error',features:[],error:error.message}));return()=>c.abort()},[view,layerName,tableName,retry]);
 const layer=publishedLayers.find((item)=>item.name===layerName); const rows=useMemo(()=>state.features.filter((feature)=>JSON.stringify(view==='layers'?(feature.properties??{}):feature).toLowerCase().includes(query.toLowerCase())),[query,state.features,view]); const fields=layer.editableFields.slice(0,4); const table=standaloneTables.find((item)=>item.name===tableName);
 return <div className="ops-page">
   <Modal isOpen={importOpen} onClose={()=>setImportOpen(false)} title="رفع طبقة GeoJSON" size="default" className="layer-import-modal" returnFocusSelector="#open-layer-import">
     <ImportWizard onImported={()=>setRetry((value)=>value+1)} onClose={()=>setImportOpen(false)} />
   </Modal>
   <section className="data-page-actions"><div className="data-mode-switch" aria-label="نوع البيانات"><button type="button" className={view==='layers'?'is-active':''} onClick={()=>{setView('layers');setQuery('')}}><MapPinned size={17} aria-hidden="true"/>الطبقات المكانية</button><button type="button" className={view==='tables'?'is-active':''} onClick={()=>{setView('tables');setQuery('')}}><Database size={17} aria-hidden="true"/>الجداول الوصفية</button></div><Button id="open-layer-import" type="button" onClick={()=>setImportOpen(true)}><FileUp size={17} aria-hidden="true"/>رفع طبقة</Button></section>
   {view==='layers'?<DataToolbar layers={publishedLayers} layerName={layerName} query={query} resultCount={rows.length} onLayerChange={setLayerName} onQueryChange={setQuery}/>:<section className="ops-panel data-toolbar"><div className="data-query-group"><label>الجدول<select value={tableName} onChange={(e)=>setTableName(e.target.value)}>{standaloneTables.map((entry)=><option key={entry.name} value={entry.name}>{entry.label}</option>)}</select></label><label>البحث<input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="ابحث ضمن السجلات"/></label></div><span className="result-count">{rows.length} نتيجة</span></section>}
   {state.status==='loading'?<LoadingState/>:state.status==='error'?<ErrorState message={state.error} onRetry={()=>setRetry((v)=>v+1)}/>:view==='layers'?<LayerDataView layerName={layerName} fields={fields} features={rows}/>:<StandaloneTableView records={state.features} query={query} table={table}/>}
 </div>;
}
