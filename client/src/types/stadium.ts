export type LanguageCode = 'en' | 'es' | 'fr';

export type AccessibilityPreference = 'none' | 'step-free' | 'visual-assistance';

export type CrowdDensity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IncidentType = 'MEDICAL' | 'SAFETY' | 'SPILL' | 'MAINTENANCE';

export interface StadiumNode {
  id: string;
  name: string;
}

export interface CityNode {
  id: string;
  name: string;
  stadiums: StadiumNode[];
}

export interface CountryNode {
  id: string;
  name: string;
  cities: CityNode[];
}

export interface StadiumFacility {
  isOpen: boolean;
}

export interface StadiumZone {
  id: string;
  name: string;
  density: CrowdDensity;
  waitingTime: number;
  riskLevel: string;
  facilities?: StadiumFacility[];
}

export interface StadiumEvent {
  id: string;
  title: string;
  time: string;
}

export interface StadiumIncident {
  id: string;
  type: IncidentType;
  description: string;
  zone: {
    id: string;
    name: string;
  };
}

export interface DashboardKpis {
  totalSpectators: number;
  occupancyPercent: number;
  activeIncidents: number;
  openFacilities: number;
  avgWaitTime: number;
}

export interface DashboardData {
  stadiumName: string;
  zones: StadiumZone[];
  events: StadiumEvent[];
  incidents: StadiumIncident[];
  kpis: DashboardKpis;
}

export interface DashboardApiResponse {
  data: DashboardData;
}

export interface AnalyticsDigestResponse {
  success: boolean;
  data: {
    digest: string;
  };
}
