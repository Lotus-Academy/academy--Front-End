import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiveSessionCreateComponent } from './live-session-create.component';

describe('LiveSessionCreateComponent', () => {
  let component: LiveSessionCreateComponent;
  let fixture: ComponentFixture<LiveSessionCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiveSessionCreateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LiveSessionCreateComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
