import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest, map, shareReplay } from 'rxjs';

import { Flight } from '@features/Flight/dashboard-home/flight.model';
import { FlightOperationsService } from '@features/Flight/dashboard-home/flight-operations.service';

@Component({
  selector: 'app-flight-selected',
  imports: [AsyncPipe, CommonModule, RouterLink],
  templateUrl: './flight-selected.component.html',
  styleUrl: './flight-selected.component.scss'
})
export class FlightSelectedComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly flightOperations = inject(FlightOperationsService);

  readonly flights$ = this.flightOperations.flights$;

  readonly stats$ = this.flights$.pipe(
    map((flights) => this.flightOperations.getStats(flights))
  );

  readonly selectedFlight$ = combineLatest([
    this.flights$,
    this.route.paramMap.pipe(map((params) => params.get('flightNumber')))
  ]).pipe(
    map(([flights, flightNumber]) => flights.find((flight) => flight.flightNumber === flightNumber) ?? flights[0]),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  selectFlight(flight: Flight): void {
    void this.router.navigate(['/flights', flight.flightNumber]);
  }

  trackFlight(_: number, flight: Flight): string {
    return flight.flightNumber;
  }
}
