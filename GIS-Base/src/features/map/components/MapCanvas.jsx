import "ol/ol.css";
import { useEffect, useRef } from "react";
import Feature from "ol/Feature.js";
import GeoJSON from "ol/format/GeoJSON.js";
import Point from "ol/geom/Point.js";
import OlMap from "ol/Map.js";
import View from "ol/View.js";
import TileLayer from "ol/layer/Tile.js";
import VectorLayer from "ol/layer/Vector.js";
import { fromLonLat, transformExtent } from "ol/proj.js";
import OSM from "ol/source/OSM.js";
import XYZ from "ol/source/XYZ.js";
import TileWMS from "ol/source/TileWMS.js";
import VectorSource from "ol/source/Vector.js";
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from "ol/style.js";
import { defaults as defaultControls } from "ol/control/defaults.js";
import Draw from "ol/interaction/Draw.js";
import Modify from "ol/interaction/Modify.js";
import {
  basemapConfigurations,
  withBasemapCacheRevision,
} from "../config/basemaps.js";
import { publishedLayers } from "../config/layers.js";
import { buildCqlFilter, getWorkspaceWmsUrl } from "../services/geoserver.js";
import { listFeatures } from "../services/featuresApi.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FEATURE_PICK_BUFFER_PX = 18;
const INITIAL_SYRIA_EXTENT_4326 = [35.7, 32.2, 42.5, 37.5];
const labelStyleCache = new globalThis.Map();
const mapTilerApiKey = import.meta.env.VITE_MAPTILER_KEY?.trim();

function getFeatureLabelStyle(feature) {
  const label = feature.get("labelText");
  const geometryType = feature.getGeometry()?.getType() ?? "";
  if (!label) return null;

  const cacheKey = `${geometryType}:${label}`;
  if (labelStyleCache.has(cacheKey)) return labelStyleCache.get(cacheKey);

  const style = new Style({
    text: new Text({
      text: label,
      font: '600 12px "ITF Qomra Arabic", sans-serif',
      placement: geometryType.includes("LineString") ? "line" : "point",
      offsetY: geometryType.includes("Point") ? -16 : 0,
      maxAngle: Math.PI / 5,
      overflow: false,
      fill: new Fill({ color: "rgba(7, 29, 31, 0.96)" }),
      stroke: new Stroke({ color: "rgba(255, 255, 255, 0.96)", width: 3 }),
    }),
  });
  labelStyleCache.set(cacheKey, style);
  return style;
}

const conditionalStyleCache = new globalThis.Map();

function matchesConditionalRule(value, rule) {
  const actualText = String(value ?? '').trim();
  const expectedText = String(rule.value ?? '').trim();
  const actualNumber = Number(actualText);
  const expectedNumber = Number(expectedText);
  const numeric = actualText !== '' && expectedText !== '' && Number.isFinite(actualNumber) && Number.isFinite(expectedNumber);
  if (rule.operator === 'contains') return actualText.toLocaleLowerCase('ar').includes(expectedText.toLocaleLowerCase('ar'));
  if (rule.operator === 'eq') return numeric ? actualNumber === expectedNumber : actualText === expectedText;
  if (rule.operator === 'neq') return numeric ? actualNumber !== expectedNumber : actualText !== expectedText;
  if (!numeric) return false;
  if (rule.operator === 'gt') return actualNumber > expectedNumber;
  if (rule.operator === 'gte') return actualNumber >= expectedNumber;
  if (rule.operator === 'lt') return actualNumber < expectedNumber;
  if (rule.operator === 'lte') return actualNumber <= expectedNumber;
  return false;
}

function colorWithAlpha(color, alpha) {
  const safe = /^#[0-9a-f]{6}$/i.test(color ?? '') ? color : '#DC2626';
  return safe + Math.round(Math.min(1, Math.max(0, alpha)) * 255).toString(16).padStart(2, '0');
}

function getConditionalFeatureStyle(feature, rulesByLayer, opacities) {
  const layerName = feature.get('styleLayerName');
  const rules = rulesByLayer[layerName] ?? [];
  const rule = rules.find((candidate) => matchesConditionalRule(feature.get(candidate.field), candidate));
  if (!rule) return null;
  const geometryType = feature.getGeometry()?.getType() ?? '';
  const opacity = Math.min(1, Math.max(0.15, Number(opacities[layerName] ?? 100) / 100));
  const cacheKey = `${geometryType}:${rule.color}:${opacity}`;
  if (conditionalStyleCache.has(cacheKey)) return conditionalStyleCache.get(cacheKey);
  const style = new Style({
    image: geometryType.includes('Point') ? new CircleStyle({
      radius: 7,
      fill: new Fill({ color: colorWithAlpha(rule.color, opacity) }),
      stroke: new Stroke({ color: colorWithAlpha('#FFFFFF', opacity), width: 1.5 }),
    }) : undefined,
    stroke: new Stroke({ color: colorWithAlpha(rule.color, opacity), width: geometryType.includes('LineString') ? 4 : 2 }),
    fill: geometryType.includes('Polygon') ? new Fill({ color: colorWithAlpha(rule.color, opacity * 0.36) }) : undefined,
  });
  conditionalStyleCache.set(cacheKey, style);
  return style;
}

function extractFeatureIdentifier(feature) {
  const propertyId = feature?.properties?.id;
  const featureId =
    typeof feature?.id === "string" ? feature.id.split(".").at(-1) : null;
  const candidate = propertyId || featureId;
  return typeof candidate === "string" && UUID_PATTERN.test(candidate)
    ? candidate
    : null;
}

function findClosestFeatureIdentifier(collection, coordinate) {
  const rawFeatures = collection?.features ?? [];
  if (!rawFeatures.length) return null;

  const projectedFeatures = new GeoJSON().readFeatures(collection, {
    dataProjection: "EPSG:4326",
    featureProjection: "EPSG:3857",
  });
  let closestMatch = null;

  projectedFeatures.forEach((feature, index) => {
    const featureId = extractFeatureIdentifier(rawFeatures[index]);
    const geometry = feature.getGeometry();
    if (!featureId || !geometry) return;

    const closestPoint = geometry.getClosestPoint(coordinate);
    const deltaX = closestPoint[0] - coordinate[0];
    const deltaY = closestPoint[1] - coordinate[1];
    const squaredDistance = deltaX * deltaX + deltaY * deltaY;
    if (!closestMatch || squaredDistance < closestMatch.squaredDistance) {
      closestMatch = { featureId, squaredDistance };
    }
  });

  return closestMatch?.featureId ?? null;
}

const selectedFeatureStyle = new Style({
  image: new CircleStyle({
    radius: 9,
    fill: new Fill({ color: "rgba(79, 224, 189, 0.35)" }),
    stroke: new Stroke({ color: "#4fe0bd", width: 3 }),
  }),
  fill: new Fill({ color: "rgba(79, 224, 189, 0.22)" }),
  stroke: new Stroke({ color: "#4fe0bd", width: 4 }),
});

const placeResultStyle = new Style({
  image: new CircleStyle({
    radius: 9,
    fill: new Fill({ color: "#ffbe5c" }),
    stroke: new Stroke({ color: "#071d1f", width: 3 }),
  }),
});

const editFeatureStyle = new Style({
  image: new CircleStyle({
    radius: 8,
    fill: new Fill({ color: "rgba(255, 190, 92, 0.42)" }),
    stroke: new Stroke({ color: "#ffbe5c", width: 3 }),
  }),
  fill: new Fill({ color: "rgba(255, 190, 92, 0.2)" }),
  stroke: new Stroke({ color: "#ffbe5c", width: 4 }),
});

function getDrawType(geometryTypes = []) {
  if (geometryTypes.some((type) => type.includes("Polygon"))) return "Polygon";
  if (geometryTypes.some((type) => type.includes("LineString")))
    return "LineString";
  return "Point";
}

export function MapCanvas({
  visibleLayers,
  activeLayerName,
  layerOrder,
  layerColors,
  layerOutlines,
  layerOpacities,
  layerRules,
  filter,
  selectedFeature,
  editDraft,
  editGeometryTypes,
  refreshToken,
  zoomRequest,
  basemapId,
  placeRequest,
  processingArtifactId,
  retryKey,
  onReady,
  onServiceError,
  onQueryError,
  onFeaturePick,
  onEditGeometryChange,
}) {
  const targetRef = useRef(null);
  const mapRef = useRef(null);
  const basemapIdRef = useRef(basemapId);
  const basemapLayersRef = useRef(new globalThis.Map());
  const basemapReferenceLayersRef = useRef(new globalThis.Map());
  const wmsLayersRef = useRef(new globalThis.Map());
  const wmsSourcesRef = useRef(new globalThis.Map());
  const selectedSourceRef = useRef(new VectorSource());
  const editSourceRef = useRef(new VectorSource());
  const labelSourceRef = useRef(new VectorSource());
  const placeSourceRef = useRef(new VectorSource());
  const processingSourceRef = useRef(new VectorSource());
  const editInteractionRef = useRef(null);
  const selectionRequestRef = useRef(null);
  const activeLayerRef = useRef(activeLayerName);
  const layerRulesRef = useRef(layerRules);
  const layerOpacitiesRef = useRef(layerOpacities);
  const onFeaturePickRef = useRef(onFeaturePick);
  const onQueryErrorRef = useRef(onQueryError);
  const onEditGeometryChangeRef = useRef(onEditGeometryChange);
  const editMode = editDraft?.mode;
  const editGeometry = editDraft?.geometry;

  useEffect(() => {
    basemapIdRef.current = basemapId;
  }, [basemapId]);
  useEffect(() => {
    activeLayerRef.current = activeLayerName;
  }, [activeLayerName]);
  useEffect(() => {
    layerRulesRef.current = layerRules;
    layerOpacitiesRef.current = layerOpacities;
    labelSourceRef.current.changed();
    mapRef.current?.render();
  }, [layerOpacities, layerRules]);
  useEffect(() => {
    onFeaturePickRef.current = onFeaturePick;
  }, [onFeaturePick]);
  useEffect(() => {
    onQueryErrorRef.current = onQueryError;
  }, [onQueryError]);
  useEffect(() => {
    onEditGeometryChangeRef.current = onEditGeometryChange;
  }, [onEditGeometryChange]);

  useEffect(() => {
    if (!targetRef.current) return undefined;

    const basemapLayers = new globalThis.Map();
    const basemapReferenceLayers = new globalThis.Map();
    const wmsLayers = new globalThis.Map();
    const wmsSources = new globalThis.Map();
    const selectedSource = selectedSourceRef.current;
    const editSource = editSourceRef.current;
    const labelSource = labelSourceRef.current;
    const placeSource = placeSourceRef.current;
    const processingSource = processingSourceRef.current;
    const basemaps = basemapConfigurations.map((configuration) => {
      const usesMapTiler = "maptilerMapId" in configuration && mapTilerApiKey;
      const source =
        configuration.kind === "osm"
          ? new OSM({
              crossOrigin: "anonymous",
              url: withBasemapCacheRevision(
                "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
              ),
            })
          : new XYZ({
              url: withBasemapCacheRevision(
                usesMapTiler
                  ? `https://api.maptiler.com/maps/${configuration.maptilerMapId}/256/{z}/{x}/{y}.png?key=${encodeURIComponent(mapTilerApiKey)}`
                  : configuration.url,
              ),
              attributions: usesMapTiler
                ? '<a href="https://www.maptiler.com/copyright/">آ© MapTiler</a> <a href="https://www.openstreetmap.org/copyright">آ© OpenStreetMap contributors</a>'
                : configuration.attribution,
              crossOrigin: "anonymous",
              maxZoom: usesMapTiler ? 22 : configuration.maxZoom,
              transition: 0,
            });
      const layer = new TileLayer({
        source,
        visible: configuration.id === basemapIdRef.current,
        properties: { layerName: "basemap-" + configuration.id },
      });
      basemapLayers.set(configuration.id, layer);
      return layer;
    });

    const basemapReferences = basemapConfigurations.flatMap((configuration) => {
      if (!("referenceUrl" in configuration)) return [];
      if ("maptilerMapId" in configuration && mapTilerApiKey) return [];
      const layer = new TileLayer({
        source: new XYZ({
          url: withBasemapCacheRevision(configuration.referenceUrl),
          attributions: configuration.attribution,
          crossOrigin: "anonymous",
          maxZoom: configuration.maxZoom,
          transition: 0,
        }),
        visible: configuration.id === basemapIdRef.current,
        properties: { layerName: "basemap-reference-" + configuration.id },
      });
      basemapReferenceLayers.set(configuration.id, layer);
      return [layer];
    });
    const overlays = publishedLayers.map((configuration) => {
      const source = new TileWMS({
        url: getWorkspaceWmsUrl(),
        params: {
          LAYERS: configuration.wmsName,
          TILED: true,
          VERSION: "1.3.0",
        },
        serverType: "geoserver",
        crossOrigin: "anonymous",
        transition: 0,
      });

      source.on("tileloaderror", () => {
        onServiceError(
          "تعذر تحميل طبقات GeoServer. تحقق من تشغيل الخدمة ثم أعد المحاولة.",
        );
      });

      const layer = new TileLayer({
        source,
        className: "ol-layer mgos-layer-" + configuration.name,
        visible: configuration.visibleByDefault,
        properties: { layerName: configuration.name },
      });
      // Style WMS pixels after rendering. This keeps tiled GetMap URLs short
      // and supports a client-side fill plus an optional outline.
      layer.on("postrender", (event) => {
        const color = layer.get("displayColor");
        const outline = layer.get("displayOutline");
        const context = event.context;
        if (!color || !context || typeof context.save !== "function") return;

        if (!outline?.enabled || outline.width <= 0) {
          context.save();
          context.globalCompositeOperation = "source-in";
          context.fillStyle = color;
          context.fillRect(0, 0, context.canvas.width, context.canvas.height);
          context.restore();
          return;
        }

        const width = context.canvas.width;
        const height = context.canvas.height;
        const fillCanvas = document.createElement("canvas");
        const outlineCanvas = document.createElement("canvas");
        fillCanvas.width = outlineCanvas.width = width;
        fillCanvas.height = outlineCanvas.height = height;
        const fillContext = fillCanvas.getContext("2d");
        const outlineContext = outlineCanvas.getContext("2d");
        if (!fillContext || !outlineContext) return;

        fillContext.drawImage(context.canvas, 0, 0);
        const outlineWidth = Math.min(3, Math.max(0.5, Number(outline.width) || 1));
        for (let radius = 1; radius <= outlineWidth; radius += 1) {
          for (let angle = 0; angle < 360; angle += 45) {
            const radians = angle * Math.PI / 180;
            outlineContext.drawImage(context.canvas, Math.cos(radians) * radius, Math.sin(radians) * radius);
          }
        }
        outlineContext.globalCompositeOperation = "source-in";
        outlineContext.fillStyle = outline.color;
        outlineContext.fillRect(0, 0, width, height);
        fillContext.globalCompositeOperation = "source-in";
        fillContext.fillStyle = color;
        fillContext.fillRect(0, 0, width, height);

        context.clearRect(0, 0, width, height);
        context.drawImage(outlineCanvas, 0, 0);
        context.drawImage(fillCanvas, 0, 0);
      });
      wmsLayers.set(configuration.name, layer);
      wmsSources.set(configuration.name, source);
      return layer;
    });

    const conditionalLayer = new VectorLayer({
      source: labelSource,
      style: (feature) => getConditionalFeatureStyle(feature, layerRulesRef.current, layerOpacitiesRef.current),
      properties: { layerName: "conditional-styles" },
      zIndex: 200,
    });
    const labelLayer = new VectorLayer({
      source: labelSource,
      style: getFeatureLabelStyle,
      declutter: true,
      minZoom: 7,
      properties: { layerName: "feature-labels" },
      zIndex: 210,
    });
    const placeLayer = new VectorLayer({
      source: placeSource,
      style: placeResultStyle,
      properties: { layerName: "place-search-result" },
    });
    const processingLayer = new VectorLayer({
      source: processingSource,
      style: (feature,resolution) => { const classColors={ground:'#c89b62',building:'#78a8ff',vegetation:'#52d273',vehicle:'#ff8b57',unknown:'#a8afb8'};const predicted=feature.get('predictedClass');const color=classColors[predicted]??'#ffe06b';const confidence=Number(feature.get('confidence')??100);return new Style({image:new CircleStyle({radius:predicted?5:4,fill:new Fill({color}),stroke:new Stroke({color:'#071d1f',width:1.5})}),stroke:new Stroke({color,width:3}),fill:new Fill({color:`${color}${Math.max(35,Math.round(confidence*1.5)).toString(16).padStart(2,'0')}`}),text:predicted&&resolution<20?new Text({text:`${({ground:'أرض',building:'مبانٍ',vegetation:'نباتات',vehicle:'مركبات',unknown:'غير محدد'})[predicted]??predicted} ${Math.round(confidence)}%`,offsetY:-13,font:'600 11px sans-serif',fill:new Fill({color:'#fff'}),stroke:new Stroke({color:'#071d1f',width:3})}):undefined});},
      properties: { layerName: 'processing-artifact' },
      zIndex: 90,
    });
    const selectedLayer = new VectorLayer({
      source: selectedSource,
      style: selectedFeatureStyle,
      properties: { layerName: "selected-feature" },
    });
    const editLayer = new VectorLayer({
      source: editSource,
      style: editFeatureStyle,
      properties: { layerName: "edit-feature" },
    });

    const map = new OlMap({
      target: targetRef.current,
      controls: defaultControls({ attribution: true, rotate: false }),
      layers: [
        ...basemaps,
        ...overlays,
        conditionalLayer,
        ...basemapReferences,
        labelLayer,
        placeLayer,
        processingLayer,
        selectedLayer,
        editLayer,
      ],
      view: new View({
        center: fromLonLat([39, 35]),
        zoom: 6,
        minZoom: 4,
      }),
    });

    const handleMapClick = async (event) => {
      if (editInteractionRef.current) return;
      selectionRequestRef.current?.abort();
      const controller = new AbortController();
      selectionRequestRef.current = controller;

      const layerName = activeLayerRef.current;
      const source = wmsSources.get(layerName);
      const resolution = map.getView().getResolution();
      if (!source || !resolution) return;

      const url = source.getFeatureInfoUrl(
        event.coordinate,
        resolution,
        "EPSG:3857",
        {
          INFO_FORMAT: "application/json",
          FEATURE_COUNT: 10,
          BUFFER: FEATURE_PICK_BUFFER_PX,
        },
      );
      if (!url) return;

      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok)
          throw new Error(
            "GeoServer GetFeatureInfo failed with " + response.status,
          );
        const collection = await response.json();
        const featureId = findClosestFeatureIdentifier(
          collection,
          event.coordinate,
        );
        onFeaturePickRef.current(featureId ? { layerName, featureId } : null);
      } catch (error) {
        if (controller.signal.aborted) return;
        onQueryErrorRef.current(
          error instanceof Error ? error.message : "تعذر تحديد المعلم.",
        );
      }
    };

    map.on("singleclick", handleMapClick);
    mapRef.current = map;
    basemapLayersRef.current = basemapLayers;
    basemapReferenceLayersRef.current = basemapReferenceLayers;
    wmsLayersRef.current = wmsLayers;
    wmsSourcesRef.current = wmsSources;

    const updateMapSize = () => map.updateSize();
    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(updateMapSize);
    resizeObserver?.observe(targetRef.current);
    window.addEventListener("resize", updateMapSize);
    const initialResizeFrame = window.requestAnimationFrame(() => {
      updateMapSize();
      map
        .getView()
        .fit(
          transformExtent(INITIAL_SYRIA_EXTENT_4326, "EPSG:4326", "EPSG:3857"),
          {
            padding: [36, 36, 36, 36],
            duration: 0,
            maxZoom: 7,
          },
        );
    });
    onReady();

    return () => {
      window.cancelAnimationFrame(initialResizeFrame);
      window.removeEventListener("resize", updateMapSize);
      resizeObserver?.disconnect();
      selectionRequestRef.current?.abort();
      map.un("singleclick", handleMapClick);
      map.setTarget(undefined);
      mapRef.current = null;
      basemapLayersRef.current = new globalThis.Map();
      basemapReferenceLayersRef.current = new globalThis.Map();
      wmsLayersRef.current = new globalThis.Map();
      wmsSourcesRef.current = new globalThis.Map();
      selectedSource.clear();
      editSource.clear();
      labelSource.clear();
      placeSource.clear();
    };
  }, [retryKey, onReady, onServiceError]);

  useEffect(() => {
    for (const [name, layer] of wmsLayersRef.current) {
      layer.setVisible(visibleLayers.has(name));
    }
  }, [visibleLayers]);

  useEffect(() => {
    const layerCount = layerOrder.length;
    layerOrder.forEach((name, index) => {
      wmsLayersRef.current.get(name)?.setZIndex(100 + layerCount - index);
    });
  }, [layerOrder]);

  useEffect(() => {
    for (const [name, layer] of basemapLayersRef.current) {
      layer.setVisible(name === basemapId);
    }
    for (const [name, layer] of basemapReferenceLayersRef.current) {
      layer.setVisible(name === basemapId);
    }
  }, [basemapId]);

  useEffect(() => {
    try {
      for (const [name, source] of wmsSourcesRef.current) {
        const params = { ...source.getParams() };
        delete params.CQL_FILTER;
        delete params.SLD_BODY;
        if (name === activeLayerName) {
          const cqlFilter = buildCqlFilter(name, filter);
          if (cqlFilter) params.CQL_FILTER = cqlFilter;
        }
        source.setParams(params);
      }
    } catch (error) {
      onQueryError(error?.message ?? "تعذر تطبيق فلتر الخريطة.");
    }
  }, [activeLayerName, filter, onQueryError]);

  useEffect(() => {
    for (const [name, layer] of wmsLayersRef.current) {
      layer.set("displayColor", layerColors[name], true);
      layer.set("displayOutline", layerOutlines[name], true);
      layer.setOpacity(Math.min(1, Math.max(0.15, Number(layerOpacities[name] ?? 100) / 100)));
      layer.changed();
    }
  }, [layerColors, layerOpacities, layerOutlines]);

  useEffect(() => {
    const source = labelSourceRef.current;
    const controller = new AbortController();
    source.clear();

    const labelLayers = publishedLayers.filter(
      (layer) => visibleLayers.has(layer.name) && layer.labelField,
    );
    Promise.all(
      labelLayers.map(async (layer) => {
        try {
          const collection = await listFeatures(layer.name, {
            filter: layer.name === activeLayerName ? filter : {},
            limit: 500,
            signal: controller.signal,
          });
          return { layer, collection };
        } catch {
          return null;
        }
      }),
    ).then((results) => {
      if (controller.signal.aborted) return;
      const format = new GeoJSON();
      for (const result of results) {
        if (!result) continue;
        const features = format.readFeatures(result.collection, {
          dataProjection: "EPSG:4326",
          featureProjection: "EPSG:3857",
        });
        for (const feature of features) {
          feature.set("styleLayerName", result.layer.name);
          const label = feature.get(result.layer.labelField);
          if (label !== null && label !== undefined && String(label).trim()) {
            feature.set("labelText", String(label).trim());
          }
        }
        source.addFeatures(features);
      }
    });

    return () => controller.abort();
  }, [activeLayerName, filter, refreshToken, visibleLayers]);

  useEffect(() => {
    const source = selectedSourceRef.current;
    source.clear();
    if (!selectedFeature) return;
    const features = new GeoJSON().readFeatures(selectedFeature, {
      dataProjection: "EPSG:4326",
      featureProjection: "EPSG:3857",
    });
    source.addFeatures(features);
  }, [selectedFeature]);

  useEffect(() => {
    const map = mapRef.current;
    const source = editSourceRef.current;
    if (!map) return undefined;

    if (editInteractionRef.current) {
      map.removeInteraction(editInteractionRef.current);
      editInteractionRef.current = null;
    }
    source.clear();
    if (!editMode) return undefined;

    const format = new GeoJSON();
    const emitGeometry = (feature) => {
      const geometry = feature?.getGeometry();
      if (!geometry) return;
      onEditGeometryChangeRef.current(
        format.writeGeometryObject(geometry, {
          dataProjection: "EPSG:4326",
          featureProjection: "EPSG:3857",
        }),
      );
    };

    if (editGeometry) {
      const features = format.readFeatures(
        {
          type: "Feature",
          geometry: editGeometry,
          properties: {},
        },
        {
          dataProjection: "EPSG:4326",
          featureProjection: "EPSG:3857",
        },
      );
      source.addFeatures(features);
    }

    let interaction;
    if (editMode === "create") {
      interaction = new Draw({ source, type: getDrawType(editGeometryTypes) });
      interaction.on("drawstart", () => source.clear());
      interaction.on("drawend", (event) => emitGeometry(event.feature));
    } else {
      interaction = new Modify({ source });
      interaction.on("modifyend", (event) =>
        emitGeometry(event.features.item(0)),
      );
    }

    map.addInteraction(interaction);
    editInteractionRef.current = interaction;
    return () => {
      map.removeInteraction(interaction);
      if (editInteractionRef.current === interaction)
        editInteractionRef.current = null;
    };
  }, [editMode, editGeometry, editGeometryTypes]);

  useEffect(() => {
    if (!refreshToken) return;
    for (const source of wmsSourcesRef.current.values()) source.refresh();
  }, [refreshToken]);

  useEffect(() => {
    const map = mapRef.current;
    const source = placeSourceRef.current;
    source.clear();
    if (!placeRequest || !map) return;

    const center = fromLonLat([placeRequest.longitude, placeRequest.latitude]);
    source.addFeature(
      new Feature({
        geometry: new Point(center),
        placeLabel: placeRequest.label,
      }),
    );

    const duration = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches
      ? 0
      : 300;
    const extent = placeRequest.extent4326;
    if (
      Array.isArray(extent) &&
      extent.length === 4 &&
      extent.every(Number.isFinite)
    ) {
      map.getView().fit(transformExtent(extent, "EPSG:4326", "EPSG:3857"), {
        padding: [72, 112, 72, 112],
        duration,
        maxZoom: 14,
      });
      return;
    }
    map.getView().animate({ center, zoom: 13, duration });
  }, [placeRequest]);

  useEffect(() => {
    const source = processingSourceRef.current;
    source.clear();
    if (!processingArtifactId || !mapRef.current) return undefined;
    const controller = new AbortController();
    fetch(`/api/processing/jobs/${encodeURIComponent(processingArtifactId)}/output`, { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error('تعذر تحميل مخرج المعالجة.'); return response.json(); })
      .then((collection) => {
        const features = new GeoJSON().readFeatures(collection, { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' });
        source.addFeatures(features);
        if (features.length) mapRef.current?.getView().fit(source.getExtent(), { padding: [70,70,70,70], maxZoom: 13, duration: 650 });
      })
      .catch((error) => { if (error.name !== 'AbortError') onQueryErrorRef.current?.(error.message); });
    return () => controller.abort();
  }, [processingArtifactId]);
  useEffect(() => {
    if (!zoomRequest || !mapRef.current) return;
    const featureExtent = zoomRequest.featureCollection?.features?.length
      ? new VectorSource({
          features: new GeoJSON().readFeatures(zoomRequest.featureCollection, {
            dataProjection: "EPSG:4326",
            featureProjection: "EPSG:3857",
          }),
        }).getExtent()
      : null;
    const extent = featureExtent?.every(Number.isFinite)
      ? featureExtent
      : transformExtent(zoomRequest.extent4326, "EPSG:4326", "EPSG:3857");
    mapRef.current.getView().fit(extent, {
      padding: [56, 128, 56, 128],
      duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 0
        : 250,
      maxZoom: 13,
    });
  }, [zoomRequest]);

  return (
    <div className="map-canvas-shell">
      <div
        ref={targetRef}
        className="map-canvas"
        role="region"
        aria-label="خريطة طبقات MGOS"
      />
      <p className="sr-only" role="status">
        الخريطة جاهزة. انقر على معلم في طبقة الاستعلام لعرض خصائصه.
      </p>
    </div>
  );
}






