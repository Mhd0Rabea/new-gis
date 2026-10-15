import { Box, Eye, EyeOff, Map as MapIcon, Mountain, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Cartesian3,
  Color,
  ColorMaterialProperty,
  ConstantProperty,
  GeoJsonDataSource,
  ImageryLayer,
  Math as CesiumMath,
  PointGraphics,
  Rectangle,
  SingleTileImageryProvider,
  UrlTemplateImageryProvider,
  Viewer,
} from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { listFeatures } from '../features/map/services/featuresApi.js';
import { publishedLayers } from '../features/map/config/layers.js';
import { withBasemapCacheRevision } from '../features/map/config/basemaps.js';

const ARABIC_LABELS = { Military_Bases: 'القواعد العسكرية', Checkpoints: 'الحواجز', Operation_Sectors: 'القطاعات العسكرية', Patrol_Routes: 'مسارات الدوريات' };
const COLORS = { Military_Bases: '#4fd5ba', Checkpoints: '#b590ff', Operation_Sectors: '#f06b6b', Patrol_Routes: '#ffb34d' };

export function ScenePage() {
  const sceneRef = useRef(null);
  const viewerRef = useRef(null);
  const sourcesRef = useRef(new globalThis.Map());
  const demLayerRef = useRef(null);
  const [status, setStatus] = useState('checking');
  const [message, setMessage] = useState('جاري فحص قدرة الجهاز…');
  const [opacity, setOpacity] = useState(78);
  const [heightScale, setHeightScale] = useState(1);
  const [demAvailable, setDemAvailable] = useState(false);
  const [demVisible, setDemVisible] = useState(true);
  const [visible, setVisible] = useState(() => Object.fromEntries(publishedLayers.map((layer) => [layer.name, true])));

  useEffect(() => {
    let disposed = false;
    const mountScene = async () => {
      const probe = document.createElement('canvas');
      const gl = probe.getContext('webgl2') || probe.getContext('webgl');
      if (!gl) {
        setStatus('unsupported');
        setMessage('هذا الجهاز لا يدعم WebGL. استخدم الخريطة الثنائية الأبعاد.');
        return;
      }
      try {
        Reflect.set(globalThis, 'CESIUM_BASE_URL', '/cesium/');
        if (disposed || !sceneRef.current) return;
        const maptilerKey = import.meta.env.VITE_MAPTILER_KEY;
        const imageryUrl = withBasemapCacheRevision(maptilerKey
          ? `https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=${maptilerKey}`
          : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png');
        const imageryProvider = new UrlTemplateImageryProvider({ url: imageryUrl, maximumLevel: 20, credit: maptilerKey ? 'MapTiler' : 'OpenStreetMap' });
        const viewer = new Viewer(sceneRef.current, {
          animation: false,
          timeline: false,
          baseLayerPicker: false,
          baseLayer: new ImageryLayer(imageryProvider),
          geocoder: false,
          homeButton: false,
          sceneModePicker: false,
          navigationHelpButton: false,
          fullscreenButton: false,
          selectionIndicator: true,
          infoBox: true,
        });
        viewerRef.current = viewer;
        viewer.scene.globe.baseColor = Color.fromCssColorString('#0b2426');
        viewer.scene.backgroundColor = Color.fromCssColorString('#061516');
        viewer.scene.globe.enableLighting = true;
        viewer.camera.setView({
          destination: Cartesian3.fromDegrees(38.2, 34.9, 620000),
          orientation: { heading: 0, pitch: CesiumMath.toRadians(-48), roll: 0 },
        });

        const results = await Promise.allSettled(publishedLayers.map(async (layer) => {
          const geojson = await listFeatures(layer.name, { limit: 500 });
          const color = Color.fromCssColorString(COLORS[layer.name] || '#4fd5ba');
          const allFeatures = Array.isArray(geojson?.features) ? geojson.features : [];
          const areaFeatures = allFeatures.filter((feature) => feature.geometry?.type !== 'Point');
          const pointFeatures = allFeatures.filter((feature) => feature.geometry?.type === 'Point');
          const source = await GeoJsonDataSource.load({ ...geojson, features: areaFeatures }, {
            stroke: color,
            fill: color.withAlpha(0.3),
            strokeWidth: 3,
            clampToGround: false,
          });
          source.name = ARABIC_LABELS[layer.name] || layer.name;
          pointFeatures.forEach((feature) => {
            const [longitude, latitude, altitude = 0] = feature.geometry.coordinates;
            source.entities.add({
              id: `${layer.name}-${feature.id || crypto.randomUUID()}`,
              position: Cartesian3.fromDegrees(longitude, latitude, altitude),
              point: new PointGraphics({ pixelSize: 12, color, outlineColor: Color.WHITE, outlineWidth: 2, disableDepthTestDistance: Number.POSITIVE_INFINITY }),
              properties: feature.properties,
            });
          });
          source.entities.values.forEach((entity) => {
            if (entity.polygon) entity.polygon.height = new ConstantProperty(80);
            if (entity.polyline) entity.polyline.clampToGround = new ConstantProperty(false);
          });
          viewer.dataSources.add(source);
          sourcesRef.current.set(layer.name, source);
        }));
        if (disposed) return;
        const loaded = results.filter((result) => result.status === 'fulfilled').length;
        try {
          const jobsResponse = await fetch('/api/processing/jobs');
          const jobs = await jobsResponse.json();
          const demJob = jobs.find((job) => job.status === 'completed' && job.operation === 'hillshade' && job.outputFile?.endsWith('.png'));
          if (demJob) {
            const provider = await SingleTileImageryProvider.fromUrl(`/api/processing/jobs/${demJob.id}/output`, {
              rectangle: Rectangle.fromDegrees(36.1, 35.85, 36.2, 35.95),
            });
            const layer = viewer.imageryLayers.addImageryProvider(provider);
            layer.alpha = 0.62;
            demLayerRef.current = layer;
            setDemAvailable(true);
          }
        } catch { /* The scene remains usable when no DEM preview exists. */ }
        setStatus('ready');
        setMessage(`تم تحميل ${loaded} من ${publishedLayers.length} طبقات تشغيلية.`);
      } catch (error) {
        if (!disposed) {
          setStatus('failed');
          setMessage(error?.message || 'تعذر تهيئة المشهد ثلاثي الأبعاد.');
        }
      }
    };
    mountScene();
    const sources = sourcesRef.current;
    return () => {
      disposed = true;
      viewerRef.current?.destroy();
      viewerRef.current = null;
      sources.clear();
      demLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    sourcesRef.current.forEach((source, name) => {
      source.show = visible[name] !== false;
      source.entities.values.forEach((entity) => {
        if (entity.polygon) {
          const color = Color.fromCssColorString(COLORS[name] || '#4fd5ba').withAlpha(opacity / 100);
          entity.polygon.material = new ColorMaterialProperty(color);
          entity.polygon.height = new ConstantProperty(80 * heightScale);
        }
      });
    });
    if (viewerRef.current) {
      viewerRef.current.scene.verticalExaggeration = Math.max(1, heightScale);
      viewerRef.current.scene.requestRender();
    }
    if (demLayerRef.current) demLayerRef.current.show = demVisible;
  }, [visible, opacity, heightScale, demVisible]);

  const toggleLayer = (name) => setVisible((current) => ({ ...current, [name]: !current[name] }));
  const toggleDem = () => {
    setDemVisible((current) => !current);
    if (!viewerRef.current) return;
    viewerRef.current.camera.flyTo({ destination: Cartesian3.fromDegrees(36.15, 35.9, 42000), orientation: { heading: 0, pitch: CesiumMath.toRadians(-50), roll: 0 }, duration: 1.1 });
  };
  const resetCamera = () => {
    if (!viewerRef.current) return;
    viewerRef.current.camera.flyTo({
      destination: Cartesian3.fromDegrees(38.2, 34.9, 620000),
      orientation: { heading: 0, pitch: CesiumMath.toRadians(-48), roll: 0 },
      duration: 1.2,
    });
  };

  if (status === 'unsupported' || status === 'failed') {
    return <div className="ops-page scene-page"><section className="data-pulse"><div><span className="ops-kicker">المشهد الجغرافي</span><h2>العرض ثلاثي الأبعاد</h2><p>{message}</p></div><Box size={38}/></section><section className="ops-panel scene-fallback"><Mountain size={48}/><h3>الخريطة الثنائية جاهزة كبديل</h3><Link className="ops-link" to="/map"><MapIcon size={18}/>فتح الخريطة الثنائية</Link></section></div>;
  }

  return <div className="ops-page scene-page"><section className="scene-workspace"><div className="scene-stage"><div ref={sceneRef} className="cesium-host" aria-label="مشهد جغرافي ثلاثي الأبعاد"/><div className="scene-status"><span className={'capability-dot ' + status}/><span>{message}</span></div></div><aside className="scene-controls"><header><span className="ops-kicker">المشهد الجغرافي</span><h2>العرض ثلاثي الأبعاد</h2><p>استكشف الطبقات التشغيلية ضمن مجسم الأرض.</p></header><div className="scene-control-group"><h3>الطبقات المرئية</h3>{publishedLayers.map((layer) => <button key={layer.name} type="button" className={visible[layer.name] ? 'is-visible' : ''} onClick={() => toggleLayer(layer.name)} aria-pressed={visible[layer.name]}>{visible[layer.name] ? <Eye size={17}/> : <EyeOff size={17}/>}<span>{ARABIC_LABELS[layer.name] || layer.name}</span><i style={{ background: COLORS[layer.name] }}/></button>)}{demAvailable&&<button type="button" className={demVisible ? 'dem-toggle is-visible' : 'dem-toggle'} onClick={toggleDem} aria-pressed={demVisible}>{demVisible ? <Eye size={17}/> : <EyeOff size={17}/>}<span>تظليل DEM المعالج</span><i style={{background:'#ffe06b'}}/></button>}</div><label className="scene-range"><span>شفافية المساحات <b>{opacity}%</b></span><input type="range" min="15" max="100" value={opacity} onChange={(event) => setOpacity(Number(event.target.value))}/></label><label className="scene-range"><span>مقياس الارتفاع <b>{heightScale.toFixed(1)}×</b></span><input type="range" min="0" max="5" step="0.5" value={heightScale} onChange={(event) => setHeightScale(Number(event.target.value))}/></label><div className="scene-actions"><button type="button" onClick={resetCamera}><RotateCcw size={17}/>إعادة التموضع</button><Link to="/map"><MapIcon size={17}/>الخريطة الثنائية</Link></div></aside></section></div>;
}








