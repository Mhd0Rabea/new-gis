export type DecisionSource = 'user-uploaded-layer';

export interface RiskFactor {
  key: string;
  label: string;
  value: number;
  weight: number;
  contribution: number;
  available: boolean;
}

export interface RiskAssessment {
  id: string;
  layer: 'Operation_Sectors' | 'Patrol_Routes';
  name: string;
  score: number;
  confidence: number;
  factors: RiskFactor[];
  source: DecisionSource;
  calculatedAt: string;
  reviewRequired: true;
}

export interface RouteReadiness {
  id: string;
  name: string;
  risk: number;
  readiness: number;
  travelTimeMinutes: number | null;
  roadStatus: string | null;
  constraints: string[];
  source: DecisionSource;
  calculatedAt: string;
  reviewRequired: true;
}

export type ReviewDecision = 'accepted' | 'rejected';

export interface TrackingPoint {
  id?: string;
  longitude: number;
  latitude: number;
  timestamp: string;
  speed?: number;
  risk?: number;
}

export interface DecisionAlert {
  id: string;
  pointId: string;
  kind: 'risk-zone-entry' | 'delayed-update' | 'low-readiness' | 'speed-limit';
  reason: string;
  severity: 'medium' | 'high';
  timestamp: string;
  status: 'pending' | ReviewDecision;
  reviewNote?: string;
  reviewedAt?: string;
  source: DecisionSource;
}

export interface TrackingSession {
  id: string;
  sourceFileName: string;
  status: 'running' | 'stopped';
  pointsCount: number;
  alerts: DecisionAlert[];
  startedAt: string;
  stoppedAt?: string;
}

export interface ForecastInsight {
  id: string;
  sourceFileName: string;
  metric: string;
  scope: string;
  periodStart: string;
  periodEnd: string;
  sampleCount: number;
  baseline: number;
  forecast: number;
  confidence: number;
  constraints: string[];
  reviewStatus: 'pending' | ReviewDecision;
  reviewNote?: string;
  reviewedAt?: string;
  source: DecisionSource;
}

export interface GeoJsonMultiPolygon {
  type: 'MultiPolygon';
  coordinates: number[][][][];
}

export interface ChangeCandidate {
  id: string;
  baselineFileName: string;
  currentFileName: string;
  baselineMean: number;
  currentMean: number;
  changePercent: number;
  confidence: number;
  summary: string;
  geometry?: GeoJsonMultiPolygon | null;
  reviewStatus: 'pending' | ReviewDecision;
  reviewNote?: string;
  reviewedAt?: string;
  source: DecisionSource;
}