import { AsyncPipe, CommonModule, DecimalPipe } from '@angular/common';
import { AfterViewInit, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import * as L from 'leaflet';
import { combineLatest, debounceTime, distinctUntilChanged, map, shareReplay, startWith } from 'rxjs';

import { Flight, FlightFilters, FlightStatus } from './flight.model';
import { FlightOperationsService } from './flight-operations.service';

type FlightFilterForm = {
  search: FormControl<string>;
  status: FormControl<FlightStatus | 'All'>;
  origin: FormControl<string>;
  destination: FormControl<string>;
};

@Component({
  selector: 'app-dashboard-home',
  imports: [AsyncPipe, CommonModule, DecimalPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.scss'
})
export class DashboardHomeComponent implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly flightOperations = inject(FlightOperationsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private map?: L.Map;
  private markerLayer = L.layerGroup();
  private routeLayer = L.layerGroup();

  readonly statusOptions: Array<FlightStatus | 'All'> = ['All', 'On Time', 'Delayed', 'Cancelled', 'Boarding', 'Arrived'];

  readonly filterForm = new FormGroup<FlightFilterForm>({
    search: new FormControl('', { nonNullable: true }),
    status: new FormControl('All', { nonNullable: true }),
    origin: new FormControl('All', { nonNullable: true }),
    destination: new FormControl('All', { nonNullable: true })
  });

  readonly flights$ = this.flightOperations.flights$;

  readonly filters$ = this.filterForm.valueChanges.pipe(
    startWith(this.filterForm.getRawValue()),
    debounceTime(120),
    map(() => this.filterForm.getRawValue()),
    distinctUntilChanged((previous, current) => JSON.stringify(previous) === JSON.stringify(current)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly filteredFlights$ = combineLatest([this.flights$, this.filters$]).pipe(
    map(([flights, filters]) => this.flightOperations.filterFlights(flights, filters as FlightFilters)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly stats$ = this.flights$.pipe(
    map((flights) => this.flightOperations.getStats(flights))
  );

  readonly origins$ = this.flights$.pipe(
    map((flights) => this.uniqueCodes(flights, 'origin'))
  );

  readonly destinations$ = this.flights$.pipe(
    map((flights) => this.uniqueCodes(flights, 'destination'))
  );

  readonly selectedFlight$ = combineLatest([
    this.filteredFlights$,
    this.route.paramMap.pipe(map((params) => params.get('flightNumber')))
  ]).pipe(
    map(([flights, flightNumber]) => flights.find((flight) => flight.flightNumber === flightNumber) ?? flights[0]),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly selectedRouteLabel$ = this.selectedFlight$.pipe(
    map((flight) => flight ? `${flight.originCity} to ${flight.destinationCity}` : 'No matching route')
  );

  ngAfterViewInit(): void {
    this.createMap();

    combineLatest([this.filteredFlights$, this.selectedFlight$])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([flights, selectedFlight]) => this.renderMarkers(flights, selectedFlight));
  }

  selectFlight(flight: Flight): void {
    void this.router.navigate(['/flights', flight.flightNumber], {
      queryParamsHandling: 'preserve'
    });
  }

  resetFilters(): void {
    this.filterForm.reset({
      search: '',
      status: 'All',
      origin: 'All',
      destination: 'All'
    });
  }

  trackFlight(_: number, flight: Flight): string {
    return flight.flightNumber;
  }

  private createMap(): void {
    this.map = L.map('flight-map', {
      center: [30, -20],
      zoom: 2,
      minZoom: 2,
      worldCopyJump: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.markerLayer.addTo(this.map);
    this.routeLayer.addTo(this.map);
  }

  private renderMarkers(flights: Flight[], selectedFlight: Flight | undefined): void {
    if (!this.map) {
      return;
    }

    this.markerLayer.clearLayers();
    this.routeLayer.clearLayers();

    flights.forEach((flight) => {
      const isSelected = flight.flightNumber === selectedFlight?.flightNumber;
      const marker = L.marker([flight.position.lat, flight.position.lng], {
        icon: L.divIcon({
          className: `flight-marker ${isSelected ? 'flight-marker--selected' : ''}`,
          html: '<span></span>',
          iconSize: [18, 18],
          iconAnchor: [9, 9]
        })
      });

      const popupHtml = `
        <div class="popup">
          <strong>${flight.flightNumber} — ${flight.callsign}</strong>
          <div>${flight.origin} → ${flight.destination}</div>
          <div>Status: <em>${flight.status}</em></div>
        </div>
      `;

      marker.bindTooltip(`${flight.flightNumber} - ${flight.status}`, {
        direction: 'top',
        offset: [0, -8]
      });
      marker.bindPopup(popupHtml, { maxWidth: 220 });
      marker.on('click', () => this.selectFlight(flight));
      marker.addTo(this.markerLayer);
    });

    if (selectedFlight) {
      // center on selected flight
      this.map.flyTo([selectedFlight.position.lat, selectedFlight.position.lng], 4, {
        animate: true,
        duration: 0.8
      });

      // draw route polyline if origin/destination coordinates are available
      if (selectedFlight.originPosition && selectedFlight.destinationPosition) {
        const route = L.polyline([
          [selectedFlight.originPosition.lat, selectedFlight.originPosition.lng],
          [selectedFlight.destinationPosition.lat, selectedFlight.destinationPosition.lng]
        ], { color: '#1e88e5', weight: 3, opacity: 0.85, dashArray: '6 4' });

        this.routeLayer.addLayer(route);
        // fit bounds with some padding for visibility
        this.map.fitBounds(route.getBounds(), { padding: [60, 60] });
      }
    }
  }

  private uniqueCodes(flights: Flight[], key: 'origin' | 'destination'): string[] {
    return [...new Set(flights.map((flight) => flight[key]))].sort();
  }
}
