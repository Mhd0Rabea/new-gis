import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ErrorState, LoadingState } from '../components/StateViews.jsx';
import { EditPanel } from '../features/map/components/EditPanel.jsx';
import { FeatureDetails } from '../features/map/components/FeatureDetails.jsx';
import { LayerPanel } from '../features/map/components/LayerPanel.jsx';
import { MapLegend } from '../features/map/components/MapLegend.jsx';
import { MapCanvas } from '../features/map/components/MapCanvas.jsx';
import { MapNavigationPanel } from '../features/map/components/MapNavigationPanel.jsx';
import { defaultBasemapId } from '../features/map/config/basemaps.js';
import { getLayerConfiguration, publishedLayers } from '../features/map/config/layers.js';
import { getArabicGeometryLabel } from '../features/map/config/fieldPresentation.js';
import {
  createFeature,
  deleteFeature,
  getFeature,
  getRelatedRecords,
  listFeatures,
  updateFeature,
} from '../features/map/services/featuresApi.js';
import { useMapState } from '../features/map/useMapState.js';
import { searchSyrianPlaces } from '../features/map/services/placeSearch.js';
import { useToast } from '../components/Toast.jsx';

function validationErrorsFor(draft, layer) {
  const errors = {};
  for (const field of layer.requiredFields) {
    const value = draft.properties[field];
    if (value === undefined || value === null || String(value).trim() === '') {
      errors[field] = 'هذا الحقل مطلوب.';
    }
  }
  if (!draft.geometry) errors.geometry = 'ارسم هندسة المعلم على الخريطة قبل الحفظ.';
  else if (!layer.geometryTypes.includes(draft.geometry.type)) {
    errors.geometry = `نوع الهندسة يجب أن يكون: ${layer.geometryTypes.map(getArabicGeometryLabel).join(' �� ')}.`;
  }
  return errors;
}

function cleanProperties(draft, layer) {
  return Object.fromEntries(layer.editableFields.flatMap((field) => {
    const value = draft.properties[field];
    if (value === undefined) return [];
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') return draft.mode === 'update' ? [[field, null]] : [];
      return [[field, trimmed]];
    }
    return [[field, value]];
  }));
}

const DEFAULT_LAYER_ORDER = publishedLayers.map((layer) => layer.name);
const DEFAULT_LAYER_COLORS = Object.fromEntries(publishedLayers.map((layer) => [layer.name, layer.legend?.color ?? '#4FE0BD']));
const DEFAULT_LAYER_OUTLINES = Object.fromEntries(publishedLayers.map((layer) => [layer.name, { enabled: false, color: '#FFFFFF', width: 1 }]));
const DEFAULT_LAYER_OPACITIES = Object.fromEntries(publishedLayers.map((layer) => [layer.name, 100]));
const DEFAULT_LAYER_RULES = Object.fromEntries(publishedLayers.map((layer) => [layer.name, []]));

function loadLayerOrder() {
  try {
    const stored = JSON.parse(localStorage.getItem('mgos.map.layerOrder') ?? '[]');
    if (!Array.isArray(stored)) return DEFAULT_LAYER_ORDER;
    const known = stored.filter((name) => DEFAULT_LAYER_ORDER.includes(name));
    return [...known, ...DEFAULT_LAYER_ORDER.filter((name) => !known.includes(name))];
  } catch {
    return DEFAULT_LAYER_ORDER;
  }
}

function loadLayerColors() {
  try {
    const stored = JSON.parse(localStorage.getItem('mgos.map.layerColors') ?? '{}');
    return Object.fromEntries(Object.entries(DEFAULT_LAYER_COLORS).map(([name, fallback]) => {
      const color = stored?.[name];
      return [name, /^#[0-9a-f]{6}$/i.test(color ?? '') ? color.toUpperCase() : fallback];
    }));
  } catch {
    return DEFAULT_LAYER_COLORS;
  }
}

function loadLayerOutlines() {
  try {
    const stored = JSON.parse(localStorage.getItem('mgos.map.layerOutlines') ?? '{}');
    return Object.fromEntries(Object.entries(DEFAULT_LAYER_OUTLINES).map(([name, fallback]) => {
      const outline = stored?.[name] ?? {};
      return [name, {
        enabled: Boolean(outline.enabled),
        color: /^#[0-9a-f]{6}$/i.test(outline.color ?? '') ? outline.color.toUpperCase() : fallback.color,
        width: Math.min(3, Math.max(0.5, Number(outline.width) || fallback.width)),
      }];
    }));
  } catch {
    return DEFAULT_LAYER_OUTLINES;
  }
}
function loadLayerOpacities() {
  try {
    const stored = JSON.parse(localStorage.getItem('mgos.map.layerOpacities') ?? '{}');
    return Object.fromEntries(Object.entries(DEFAULT_LAYER_OPACITIES).map(([name, fallback]) => {
      const opacity = Number(stored?.[name]);
      return [name, Number.isFinite(opacity) ? Math.min(100, Math.max(15, opacity)) : fallback];
    }));
  } catch {
    return DEFAULT_LAYER_OPACITIES;
  }
}

function loadLayerRules() {
  try {
    const stored = JSON.parse(localStorage.getItem('mgos.map.layerRules') ?? '{}');
    return Object.fromEntries(Object.entries(DEFAULT_LAYER_RULES).map(([name]) => {
      const rules = Array.isArray(stored?.[name]) ? stored[name] : [];
      return [name, rules.filter((rule) =>
        rule && typeof rule.id === 'string' && typeof rule.field === 'string'
        && ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contains'].includes(rule.operator)
        && typeof rule.color === 'string' && /^#[0-9a-f]{6}$/i.test(rule.color)
      ).map((rule) => ({ ...rule, color: rule.color.toUpperCase(), value: String(rule.value ?? '') }))];
    }));
  } catch {
    return DEFAULT_LAYER_RULES;
  }
}

export function MapPage() {
  const toast = useToast();
  const location = useLocation();
  const [state, dispatch] = useMapState();
  const [retryKey, setRetryKey] = useState(0);
  const [refreshToken, setRefreshToken] = useState(0);
  const [zoomRequest, setZoomRequest] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [relatedRecords, setRelatedRecords] = useState({});
  const [queryStatus, setQueryStatus] = useState('idle');
  const [queryError, setQueryError] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState('idle');
  const [filterResultCount, setFilterResultCount] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState('idle');
  const [basemapId, setBasemapId] = useState(defaultBasemapId);
  const [layerOrder, setLayerOrder] = useState(loadLayerOrder);
  const [layerColors, setLayerColors] = useState(loadLayerColors);
  const [layerOutlines, setLayerOutlines] = useState(loadLayerOutlines);
  const [layerOpacities, setLayerOpacities] = useState(loadLayerOpacities);
  const [layerRules, setLayerRules] = useState(loadLayerRules);
  const [placeSearchQuery, setPlaceSearchQuery] = useState('');
  const [placeSearchStatus, setPlaceSearchStatus] = useState('idle');
  const [placeSearchResults, setPlaceSearchResults] = useState([]);
  const [placeRequest, setPlaceRequest] = useState(null);
  const selectionRequestRef = useRef(null);
  const filterRequestRef = useRef(null);
  const zoomRequestRef = useRef(null);
  const placeSearchRequestRef = useRef(null);
  const deepLinkRequestRef = useRef(null);

  const activeLayer = getLayerConfiguration(state.activeLayer);
  const processingArtifactId = new URLSearchParams(location.search).get('processingArtifact');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const layerName = params.get('layer');
    const featureId = params.get('id');
    const layer = getLayerConfiguration(layerName);
    const requestKey = layerName && featureId ? `${layerName}:${featureId}` : null;
    if (!requestKey || !layer || deepLinkRequestRef.current === requestKey) return undefined;
    deepLinkRequestRef.current = requestKey;
    const controller = new AbortController();
    selectionRequestRef.current?.abort();
    selectionRequestRef.current = controller;
    (async () => {
      try {
        const feature = await getFeature(layerName, featureId, { signal: controller.signal });
        const relations = await Promise.all(layer.relatedTables.map(async (table) => [table, await getRelatedRecords(layerName, featureId, table, { signal: controller.signal })]));
        if (controller.signal.aborted) return;
        if (!state.visibleLayers.has(layerName)) dispatch({ type: 'toggle-layer', layerName });
        dispatch({ type: 'set-active-layer', layerName });
        dispatch({ type: 'set-selected-feature', featureId });
        setSelectedFeature(feature);
        setRelatedRecords(Object.fromEntries(relations));
        setQueryStatus('ready');
        setQueryError(null);
        setZoomRequest({ layerName, featureCollection: { type: 'FeatureCollection', features: [feature] }, requestedAt: Date.now() });
        setStatusMessage(`تم فتح ${layer.label} وتحديد المعلم المطلوب.`);
      } catch (error) {
        if (controller.signal.aborted) return;
        deepLinkRequestRef.current = null;
        setQueryStatus('error');
        setQueryError(error?.response?.data?.message ?? error?.message ?? 'تعذر فتح المعلم المطلوب.');
      }
    })();
    return () => {
      controller.abort();
      if (deepLinkRequestRef.current === requestKey) deepLinkRequestRef.current = null;
    };
  }, [dispatch, location.search, state.visibleLayers]);


  useEffect(() => () => {
    selectionRequestRef.current?.abort();
    filterRequestRef.current?.abort();
    zoomRequestRef.current?.abort();
    placeSearchRequestRef.current?.abort();
  }, []);
  useEffect(() => {
    localStorage.setItem('mgos.map.layerOrder', JSON.stringify(layerOrder));
  }, [layerOrder]);

  useEffect(() => {
    localStorage.setItem('mgos.map.layerColors', JSON.stringify(layerColors));
  }, [layerColors]);

  useEffect(() => {
    localStorage.setItem('mgos.map.layerOutlines', JSON.stringify(layerOutlines));
  }, [layerOutlines]);

  useEffect(() => {
    localStorage.setItem('mgos.map.layerOpacities', JSON.stringify(layerOpacities));
  }, [layerOpacities]);

  useEffect(() => {
    localStorage.setItem('mgos.map.layerRules', JSON.stringify(layerRules));
  }, [layerRules]);
  const handlePlaceSearchQueryChange = useCallback((value) => {
    setPlaceSearchQuery(value);
    setPlaceSearchResults([]);
    setPlaceSearchStatus('idle');
  }, []);

  const handlePlaceSearch = useCallback(async (event) => {
    event.preventDefault();
    const query = placeSearchQuery.trim();
    if (query.length < 2) return;

    placeSearchRequestRef.current?.abort();
    const controller = new AbortController();
    placeSearchRequestRef.current = controller;
    setPlaceSearchStatus('loading');
    setPlaceSearchResults([]);

    try {
      const results = await searchSyrianPlaces(query, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setPlaceSearchResults(results);
      setPlaceSearchStatus(results.length ? 'ready' : 'empty');
      setStatusMessage(results.length
        ? `تم العثور على ${results.length} نتيجة مكانية.`
        : 'لم يتم العثور على مكان مطابق ضمن سوريا.');
    } catch (error) {
      if (controller.signal.aborted) return;
      setPlaceSearchStatus('error');
      setStatusMessage(error?.message ?? 'تعذر البحث عن المكان.');
    }
  }, [placeSearchQuery]);

  const handlePlaceSelect = useCallback((place) => {
    setPlaceRequest({ ...place, requestedAt: Date.now() });
    setStatusMessage('تم الانتقال إلى ' + place.label + '.');
  }, []);

  const handleBasemapChange = useCallback((nextBasemapId) => {
    setBasemapId(nextBasemapId);
    setStatusMessage('تم تغيير خريطة الأساس.');
  }, []);

  const clearSelection = useCallback(() => {
    selectionRequestRef.current?.abort();
    setSelectedFeature(null);
    setRelatedRecords({});
    setQueryStatus('idle');
    setQueryError(null);
    setStatusMessage('تم مسح تحديد المعلم.');
    dispatch({ type: 'set-selected-feature', featureId: null });
  }, [dispatch]);

  const refreshActiveResults = useCallback(async () => {
    const collection = await listFeatures(state.activeLayer, {
      filter: state.filter,
      limit: 100,
    });
    setFilterResultCount(collection.metadata?.total ?? collection.features?.length ?? 0);
    if (Object.keys(state.filter).length > 0) setFilterStatus('ready');
  }, [state.activeLayer, state.filter]);

  const handleReady = useCallback(() => {
    dispatch({ type: 'set-status', status: 'ready' });
  }, [dispatch]);

  const handleServiceError = useCallback((message) => {
    dispatch({ type: 'set-error', message });
  }, [dispatch]);

  const handleQueryError = useCallback((message) => {
    setQueryStatus('error');
    setQueryError(message);
    setStatusMessage('تعذر إكمال استعلام المعلم.');
  }, []);

  const handleRetry = useCallback(() => {
    dispatch({ type: 'set-status', status: 'loading' });
    setRetryKey((value) => value + 1);
  }, [dispatch]);

  const handleFeaturePick = useCallback(async (selection) => {
    selectionRequestRef.current?.abort();

    if (!selection) {
      setSelectedFeature(null);
      setRelatedRecords({});
      setQueryStatus('idle');
      setQueryError(null);
      setStatusMessage('لا يوجد معلم عند الموقع المحدد.');
      dispatch({ type: 'set-selected-feature', featureId: null });
      return;
    }

    const controller = new AbortController();
    selectionRequestRef.current = controller;
    setQueryStatus('loading');
    setQueryError(null);
    setStatusMessage('جاري تحميل تفاصيل المعلم.');

    try {
      const layer = getLayerConfiguration(selection.layerName);
      if (!layer) throw new Error('طبقة الاستعلام غير معتمدة.');

      const feature = await getFeature(selection.layerName, selection.featureId, { signal: controller.signal });
      const relationEntries = await Promise.all(
        layer.relatedTables.map(async (table) => [
          table,
          await getRelatedRecords(selection.layerName, selection.featureId, table, { signal: controller.signal }),
        ]),
      );

      if (controller.signal.aborted) return;
      setSelectedFeature(feature);
      setRelatedRecords(Object.fromEntries(relationEntries));
      setQueryStatus('ready');
      setStatusMessage('تم تحميل تفاصيل المعلم وسجلاته المرتبطة.');
      dispatch({ type: 'set-selected-feature', featureId: selection.featureId });
    } catch (error) {
      if (controller.signal.aborted) return;
      handleQueryError(error?.response?.data?.message ?? error?.message ?? 'تعذر تحميل تفاصيل المعلم.');
    }
  }, [dispatch, handleQueryError]);

  const discardDirtyDraft = useCallback(() => {
    if (!state.editDraft?.dirty) return true;
    toast.warning('احفظ المسودة أو ألغِ التحرير قبل تغيير الطبقة.', { id: 'unsaved-map-draft' });
    return false;
  }, [state.editDraft?.dirty, toast]);

  const handleActiveLayerChange = useCallback((layerName) => {
    const layer = getLayerConfiguration(layerName);
    if (!layer || !discardDirtyDraft()) return;
    dispatch({ type: 'set-edit-draft', draft: null });
    if (!state.visibleLayers.has(layerName)) dispatch({ type: 'toggle-layer', layerName });
    dispatch({ type: 'set-active-layer', layerName });
    setSelectedFeature(null);
    setRelatedRecords({});
    setQueryStatus('idle');
    setQueryError(null);
    setStatusMessage('تم تغيير طبقة الاستعلام إلى ' + layer.label + '.');
    setFilterStatus('idle');
    setFilterResultCount(null);
  }, [discardDirtyDraft, dispatch, state.visibleLayers]);

  const handleToggleLayer = useCallback((layerName) => {
    const layer = getLayerConfiguration(layerName);
    if (!layer) return;

    const isVisible = state.visibleLayers.has(layerName);
    if (!isVisible) {
      dispatch({ type: 'toggle-layer', layerName });
      setStatusMessage('تم إظهار ' + layer.label + ' على الخريطة.');
      return;
    }

    if (state.visibleLayers.size === 1) {
      setStatusMessage('يجب إبقاء طبقة واحدة مفعّلة على الأقل للاستعلام.');
      return;
    }

    if (layerName === state.activeLayer) {
      if (!discardDirtyDraft()) return;
      const nextLayer = publishedLayers.find((candidate) => (
        candidate.name !== layerName && state.visibleLayers.has(candidate.name)
      ));
      if (!nextLayer) return;

      dispatch({ type: 'set-edit-draft', draft: null });
      dispatch({ type: 'toggle-layer', layerName });
      dispatch({ type: 'set-active-layer', layerName: nextLayer.name });
      clearSelection();
      setFilterStatus('idle');
      setFilterResultCount(null);
      setStatusMessage('تم إخفاء الطبقة وتغيير طبقة الاستعلام إلى ' + nextLayer.label + '.');
      return;
    }

    dispatch({ type: 'toggle-layer', layerName });
    setStatusMessage('تم إخفاء ' + layer.label + ' من الخريطة.');
  }, [clearSelection, discardDirtyDraft, dispatch, state.activeLayer, state.visibleLayers]);

  const handleApplyFilter = useCallback(async (nextFilter) => {
    filterRequestRef.current?.abort();
    const controller = new AbortController();
    filterRequestRef.current = controller;
    dispatch({ type: 'set-filter', filter: nextFilter });
    setFilterStatus('loading');
    setQueryError(null);
    clearSelection();

    try {
      const collection = await listFeatures(state.activeLayer, {
        filter: nextFilter,
        limit: 100,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      setFilterResultCount(collection.metadata?.total ?? collection.features?.length ?? 0);
      setFilterStatus('ready');
      setStatusMessage('تم تطبيق الفلتر وتحديث النتائج.');
    } catch (error) {
      if (controller.signal.aborted) return;
      setFilterStatus('error');
      setQueryError(error?.response?.data?.message ?? error?.message ?? 'تعذر تطبيق الفلتر.');
      setStatusMessage('فشل تطبيق الفلتر.');
    }
  }, [clearSelection, dispatch, state.activeLayer]);

  const handleClearFilter = useCallback(() => {
    filterRequestRef.current?.abort();
    dispatch({ type: 'set-filter', filter: {} });
    setFilterStatus('idle');
    setFilterResultCount(null);
    setQueryError(null);
    setStatusMessage('تم مسح الفلتر وعرض الطبقة كاملة.');
  }, [dispatch]);

  const handleZoomLayer = useCallback(async (layer) => {
    zoomRequestRef.current?.abort();
    placeSearchRequestRef.current?.abort();
    const controller = new AbortController();
    zoomRequestRef.current = controller;

    setZoomRequest({
      layerName: layer.name,
      extent4326: layer.extent4326,
      requestedAt: Date.now(),
    });
    setStatusMessage(`جاري تحديد نطاق ${layer.label}...`);

    try {
      const collection = await listFeatures(layer.name, {
        limit: 500,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      setZoomRequest({
        layerName: layer.name,
        extent4326: layer.extent4326,
        featureCollection: collection,
        requestedAt: Date.now(),
      });
      setStatusMessage(collection.features?.length
        ? `تم التكبير إلى نطاق ${layer.label}.`
        : `لا تحتوي طبقة ${layer.label} على معالم؛ تم عرض نطاق المشروع.`);
    } catch (error) {
      if (controller.signal.aborted) return;
      setZoomRequest({
        layerName: layer.name,
        extent4326: layer.extent4326,
        requestedAt: Date.now(),
      });
      setQueryError(error?.response?.data?.message ?? error?.message ?? 'تعذر حساب نطاق الطبقة.');
      setStatusMessage('تعذر تحميل نطاق المعالم؛ تم عرض نطاق المشروع.');
    }
  }, []);

  const handleStartCreate = useCallback(() => {
    clearSelection();
    dispatch({
      type: 'set-edit-draft',
      draft: {
        mode: 'create',
        layer: activeLayer.name,
        geometry: null,
        geometryText: '',
        properties: {},
        dirty: false,
        status: 'idle',
        validationErrors: {},
        error: null,
      },
    });
    setStatusMessage('وضع الإنشاء نشط. ارسم الهندسة على الخريطة.');
  }, [activeLayer, clearSelection, dispatch]);

  const handleStartUpdate = useCallback(() => {
    if (!selectedFeature) return;
    const properties = Object.fromEntries(
      activeLayer.editableFields.map((field) => [field, selectedFeature.properties?.[field] ?? '']),
    );
    dispatch({
      type: 'set-edit-draft',
      draft: {
        mode: 'update',
        layer: activeLayer.name,
        featureId: selectedFeature.id,
        expectedVersion: selectedFeature.properties?.row_version,
        geometry: selectedFeature.geometry,
        geometryText: JSON.stringify(selectedFeature.geometry, null, 2),
        properties,
        dirty: false,
        status: 'idle',
        validationErrors: {},
        error: null,
      },
    });
    setStatusMessage('وضع التعديل نشط. عدّل الهندسة أو الخصائص ثم احفظ.');
  }, [activeLayer, dispatch, selectedFeature]);

  const handleCancelEdit = useCallback(() => {
    const hadUnsavedChanges = Boolean(state.editDraft?.dirty);
    dispatch({ type: 'set-edit-draft', draft: null });
    setStatusMessage('تم إغلاق وضع التحرير.');
    if (hadUnsavedChanges) toast.info('تم تجاهل التغييرات غير المحفوظة.');
  }, [dispatch, state.editDraft?.dirty, toast]);

  const handleSave = useCallback(async (event) => {
    event.preventDefault();
    const draft = state.editDraft;
    if (!draft || !activeLayer) return;

    const validationErrors = validationErrorsFor(draft, activeLayer);
    if (Object.keys(validationErrors).length > 0) {
      dispatch({ type: 'set-edit-result', status: 'failed', validationErrors });
      return;
    }

    dispatch({ type: 'set-edit-result', status: 'saving', validationErrors: {} });
    const payload = {
      type: 'Feature',
      geometry: draft.geometry,
      properties: cleanProperties(draft, activeLayer),
      ...(draft.mode === 'update' && draft.expectedVersion ? { expectedVersion: draft.expectedVersion } : {}),
    };

    try {
      const savedFeature = draft.mode === 'create'
        ? await createFeature(activeLayer.name, payload)
        : await updateFeature(activeLayer.name, draft.featureId, payload);
      dispatch({ type: 'set-edit-draft', draft: null });
      dispatch({ type: 'set-selected-feature', featureId: savedFeature.id });
      setSelectedFeature(savedFeature);
      setRelatedRecords({});
      setQueryStatus('ready');
      setQueryError(null);
      setRefreshToken((value) => value + 1);
      await refreshActiveResults();
      const successMessage = draft.mode === 'create' ? 'تم إنشاء المعلم وتحديث الخريطة.' : 'تم تعديل المعلم وتحديث الخريطة.';
      setStatusMessage(successMessage);
      toast.success(successMessage);
    } catch (error) {
      const message = error?.response?.data?.message ?? error?.message ?? 'تعذر حفظ المعلم.';
      dispatch({
        type: 'set-edit-result',
        status: 'failed',
        error: message,
      });
      toast.error(message);
    }
  }, [activeLayer, dispatch, refreshActiveResults, state.editDraft, toast]);

  const handleDelete = useCallback(async () => {
    if (!selectedFeature || !activeLayer) return false;
    setDeleteStatus('deleting');
    try {
      await deleteFeature(activeLayer.name, selectedFeature.id);
      dispatch({ type: 'set-edit-draft', draft: null });
      clearSelection();
      setRefreshToken((value) => value + 1);
      await refreshActiveResults();
      setDeleteStatus('idle');
      setStatusMessage('تم حذف المعلم وتحديث الخريطة.');
      return true;
    } catch (error) {
      setDeleteStatus('error');
      setQueryError(error?.response?.data?.message ?? error?.message ?? 'تعذر حذف المعلم.');
      setStatusMessage('فشل حذف المعلم.');
      return false;
    }
  }, [activeLayer, clearSelection, dispatch, refreshActiveResults, selectedFeature]);

  const handleReorderLayer = useCallback((sourceName, targetName) => {
    setLayerOrder((current) => {
      const sourceIndex = current.indexOf(sourceName);
      const targetIndex = current.indexOf(targetName);
      if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return current;
      const next = [...current];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
    setStatusMessage('تم تحديث ترتيب عرض الطبقات.');
  }, []);

  const handleMoveLayer = useCallback((layerName, direction) => {
    setLayerOrder((current) => {
      const currentIndex = current.indexOf(layerName);
      const nextIndex = currentIndex + direction;
      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[currentIndex], next[nextIndex]] = [next[nextIndex], next[currentIndex]];
      return next;
    });
  }, []);

  const handleLayerStyleChange = useCallback((layerName, style) => {
    setLayerColors((current) => ({ ...current, [layerName]: style.color }));
    setLayerOutlines((current) => ({ ...current, [layerName]: style.outline }));
    setLayerOpacities((current) => ({ ...current, [layerName]: style.opacity }));
    setLayerRules((current) => ({ ...current, [layerName]: style.rules }));
    const layer = getLayerConfiguration(layerName);
    setStatusMessage('تم تحديث نمط تمثيل ' + (layer?.label ?? 'الطبقة') + '.');
  }, []);
  return (
    <div className="map-page">
      <div className="map-sidebar-stack">
        <EditPanel
          layer={activeLayer}
          selectedFeature={selectedFeature}
          draft={state.editDraft}
          deleteStatus={deleteStatus}
          onStartCreate={handleStartCreate}
          onStartUpdate={handleStartUpdate}
          onPropertyChange={(field, value) => dispatch({ type: 'update-edit-properties', field, value })}
          onGeometryTextChange={(text) => dispatch({ type: 'update-edit-geometry-text', text })}
          onSave={handleSave}
          onCancel={handleCancelEdit}
          onDelete={handleDelete}
        />

        <MapNavigationPanel
          basemapId={basemapId}
          searchQuery={placeSearchQuery}
          searchStatus={placeSearchStatus}
          searchResults={placeSearchResults}
          onBasemapChange={handleBasemapChange}
          onSearchQueryChange={handlePlaceSearchQueryChange}
          onSearch={handlePlaceSearch}
          onSelectPlace={handlePlaceSelect}
        />

        <LayerPanel
          key={state.activeLayer}
          visibleLayers={state.visibleLayers}
          activeLayerName={state.activeLayer}
          layerOrder={layerOrder}
          filter={state.filter}
          filterStatus={filterStatus}
          filterResultCount={filterResultCount}
          onToggleLayer={handleToggleLayer}
          onZoomLayer={handleZoomLayer}
          onRetry={handleRetry}
          onChangeActiveLayer={handleActiveLayerChange}
          onApplyFilter={handleApplyFilter}
          onClearFilter={handleClearFilter}
          onReorderLayer={handleReorderLayer}
          onMoveLayer={handleMoveLayer}
        />

        <FeatureDetails
          feature={selectedFeature}
          layer={activeLayer}
          relatedRecords={relatedRecords}
          status={queryStatus}
          error={queryError}
          statusMessage={statusMessage}
          onClose={clearSelection}
        />
      </div>

      <div className="map-canvas-column">
        <section className="map-stage" aria-label="منطقة الخريطة">
        {state.status === 'idle' || state.status === 'loading' ? (
          <div className="map-state-overlay"><LoadingState label="جاري تجهيز الخريطة..." /></div>
        ) : null}
        {state.error ? (
          <div className="map-error-banner">
            <ErrorState message={state.error} onRetry={handleRetry} />
          </div>
        ) : null}
        <MapCanvas
          key={retryKey}
          visibleLayers={state.visibleLayers}
          activeLayerName={state.activeLayer}
          layerOrder={layerOrder}
          layerColors={layerColors}
          layerOutlines={layerOutlines}
          layerOpacities={layerOpacities}
          layerRules={layerRules}
          filter={state.filter}
          selectedFeature={selectedFeature}
          editDraft={state.editDraft}
          editGeometryTypes={activeLayer?.geometryTypes}
          refreshToken={refreshToken}
          zoomRequest={zoomRequest}
          basemapId={basemapId}
          placeRequest={placeRequest}
          processingArtifactId={processingArtifactId}
          retryKey={retryKey}
          onReady={handleReady}
          onServiceError={handleServiceError}
          onQueryError={handleQueryError}
          onFeaturePick={handleFeaturePick}
          onEditGeometryChange={(geometry) => dispatch({ type: 'update-edit-geometry', geometry })}
        />
        </section>
        <MapLegend
        visibleLayers={state.visibleLayers}
        activeLayerName={state.activeLayer}
        layerOrder={layerOrder}
        layerColors={layerColors}
        layerOutlines={layerOutlines}
        layerOpacities={layerOpacities}
        layerRules={layerRules}
        onStyleChange={handleLayerStyleChange}
        />
      </div>
    </div>
  );
}



