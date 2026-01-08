export type RiskLevel = 'low' | 'medium' | 'high';
export type AlertSource = 'manual' | 'auto';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export interface AreaWeather {
  temperature: number | null;
  humidity: number | null;
  wind_speed: number | null;
}

export interface AreaCoordinate {
  lat: number;
  lng: number;
}

export interface Area {
  id: number;
  name: string;
  coordinates: AreaCoordinate[];
  risk_level: RiskLevel;
  weather: AreaWeather;
  created_at?: string;
  updated_at?: string;
}

export interface Alert {
  id: number;
  source: AlertSource;
  description: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  image_url: string | null;
  created_at?: string;
  user?: User;
  area?: Area;
}

export interface PredictionStatus {
  is_enabled: boolean;
  updated_at?: string;
}

export interface ApiResource<T> {
  data: T;
}

export interface ApiCollection<T> {
  data: T[];
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface MessageResponse {
  message: string;
}
