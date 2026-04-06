import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiveSessionRoomComponent } from './live-session-room.component';

describe('LiveSessionRoomComponent', () => {
  let component: LiveSessionRoomComponent;
  let fixture: ComponentFixture<LiveSessionRoomComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiveSessionRoomComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LiveSessionRoomComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
