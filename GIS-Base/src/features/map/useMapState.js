import { useReducer } from 'react';
import { defaultVisibleLayerNames } from './config/layers.js';

export const initialMapState = Object.freeze({
  visibleLayers: new Set(defaultVisibleLayerNames),
  activeLayer: defaultVisibleLayerNames[0] ?? null,
  selectedFeatureId: null,
  filter: {},
  status: 'idle',
  error: null,
  editDraft: null,
});

export function mapStateReducer(state, action) {
  switch (action.type) {
    case 'toggle-layer': {
      const visibleLayers = new Set(state.visibleLayers);
      if (visibleLayers.has(action.layerName)) visibleLayers.delete(action.layerName);
      else visibleLayers.add(action.layerName);
      return { ...state, visibleLayers };
    }
    case 'set-active-layer':
      return { ...state, activeLayer: action.layerName, selectedFeatureId: null, filter: {} };
    case 'set-selected-feature':
      return { ...state, selectedFeatureId: action.featureId };
    case 'set-filter':
      return { ...state, filter: action.filter };
    case 'set-status':
      return { ...state, status: action.status, error: null };
    case 'set-error':
      return { ...state, status: 'error', error: action.message };
    case 'set-edit-draft':
      return { ...state, editDraft: action.draft };
    case 'update-edit-properties':
      return {
        ...state,
        editDraft: state.editDraft ? {
          ...state.editDraft,
          properties: { ...state.editDraft.properties, [action.field]: action.value },
          dirty: true,
          status: 'idle',
          error: null,
          validationErrors: {
            ...state.editDraft.validationErrors,
            [action.field]: undefined,
          },
        } : null,
      };
    case 'update-edit-geometry':
      return {
        ...state,
        editDraft: state.editDraft ? {
          ...state.editDraft,
          geometry: action.geometry,
          geometryText: JSON.stringify(action.geometry, null, 2),
          dirty: true,
          status: 'idle',
          error: null,
          validationErrors: { ...state.editDraft.validationErrors, geometry: undefined },
        } : null,
      };
    case 'update-edit-geometry-text': {
      if (!state.editDraft) return state;
      let geometry = null;
      let geometryError;
      try {
        geometry = JSON.parse(action.text);
        if (!geometry || typeof geometry !== 'object' || !geometry.type || !Array.isArray(geometry.coordinates)) {
          geometry = null;
          geometryError = 'أدخل كائن GeoJSON Geometry يحتوي type وcoordinates.';
        }
      } catch {
        geometryError = 'صيغة GeoJSON غير صالحة.';
      }
      return {
        ...state,
        editDraft: {
          ...state.editDraft,
          geometry,
          geometryText: action.text,
          dirty: true,
          status: 'idle',
          error: null,
          validationErrors: { ...state.editDraft.validationErrors, geometry: geometryError },
        },
      };
    }
    case 'set-edit-result':
      return {
        ...state,
        editDraft: state.editDraft ? {
          ...state.editDraft,
          status: action.status,
          error: action.error ?? null,
          validationErrors: action.validationErrors ?? state.editDraft.validationErrors,
        } : null,
      };
    default:
      return state;
  }
}

export function useMapState() {
  return useReducer(mapStateReducer, initialMapState);
}