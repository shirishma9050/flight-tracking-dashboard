export type FlightStatus = 'On Time' | 'Delayed' | 'Cancelled' | 'Boarding' | 'Arrived';

export interface FlightPosition {
  lat: number;
  lng: number;
}

export interface Flight {
  flightNumber: string;
  callsign: string;
  aircraftType: string;
  origin: string;
  originCity: string;
  destination: string;
  destinationCity: string;
  status: FlightStatus;
  etd: string;
  eta: string;
  progress: number;
  altitude: number;
  speed: number;
  position: FlightPosition;
  originPosition?: FlightPosition;
  destinationPosition?: FlightPosition;
}

export interface FlightFilters {
  search: string;
  status: FlightStatus | 'All';
  origin: string;
  destination: string;
}

export interface FlightStat {
  label: string;
  value: number;
  tone: 'neutral' | 'success' | 'warning' | 'info';
}
