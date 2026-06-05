import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';

import { Flight, FlightFilters, FlightStat } from './flight.model';

@Injectable({
  providedIn: 'root'
})
export class FlightOperationsService {
  private readonly http = inject(HttpClient);
  private readonly flightsUrl = '/flight-operations.json';

  readonly flights$ = this.http.get<Flight[]>(this.flightsUrl).pipe(
    shareReplay({ bufferSize: 1, refCount: true })
  );

  getStats(flights: Flight[]): FlightStat[] {
    return [
      { label: 'Total Flights', value: flights.length, tone: 'neutral' },
      { label: 'Active Flights', value: flights.filter((flight) => flight.status === 'On Time' || flight.status === 'Boarding').length, tone: 'success' },
      { label: 'Arrived Flights', value: flights.filter((flight) => flight.status === 'Arrived').length, tone: 'info' },
      { label: 'Delayed Flights', value: flights.filter((flight) => flight.status === 'Delayed').length, tone: 'warning' }
    ];
  }

  filterFlights(flights: Flight[], filters: FlightFilters): Flight[] {
    const query = filters.search.trim().toLowerCase();

    return flights.filter((flight) => {
      const matchesQuery = !query || [
        flight.flightNumber,
        flight.callsign,
        flight.origin,
        flight.originCity,
        flight.destination,
        flight.destinationCity,
        flight.status
      ].some((value) => value.toLowerCase().includes(query));

      const matchesStatus = filters.status === 'All' || flight.status === filters.status;
      const matchesOrigin = filters.origin === 'All' || flight.origin === filters.origin;
      const matchesDestination = filters.destination === 'All' || flight.destination === filters.destination;

      return matchesQuery && matchesStatus && matchesOrigin && matchesDestination;
    });
  }

  findFlight(flightNumber: string): Observable<Flight | undefined> {
    return this.flights$.pipe(
      map((flights) => flights.find((flight) => flight.flightNumber === flightNumber))
    );
  }
}
