import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlightSelectedComponent } from './flight-selected.component';

describe('FlightSelectedComponent', () => {
  let component: FlightSelectedComponent;
  let fixture: ComponentFixture<FlightSelectedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlightSelectedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FlightSelectedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
