export type UserRole = "student" | "entity";

export interface CampusConfig {
  id: string;
  name: string;           
  shortName: string;      
  domain: string;         
  tagline: string;       
  color: string;          
  colorRaw: string;      
  logo: string;
  isPublic?: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  campus: CampusConfig | null;
  studentId?: string;
  rewardPoints: number;
}

export interface TrendPoint {
  time: string;
  predicted: number;
}

export interface ZoneData {
  id: string;
  name: string;
  shortName: string;
  category: "food" | "study" | "sport" | "service" | "outdoor" | "health";
  floor: string;
  capacity: number;
  currentOccupancy: number;
  wifiConnections: number;
  cvCount: number;
  waitTime: number;
  isOpen: boolean;
  historicalPeak: number;
  coordinates: { x: number; y: number; radius: number };
  lng: number;
  lat: number;
  trend: TrendPoint[];
}