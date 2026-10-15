interface Window {
  __GIS_RUNTIME_CONFIG__?: Readonly<{
    apiBaseUrl?: string;
    geoserverBaseUrl?: string;
    geocoderBaseUrl?: string;
  }>;
}

declare var __GIS_RUNTIME_CONFIG__: Window['__GIS_RUNTIME_CONFIG__'];