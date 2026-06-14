import { TestBed } from '@angular/core/testing';
import { LocalAiService } from '../../../../core/services/local-ai.service';
import { SettingsStoreService } from '../../../../core/services/settings-store.service';
import { SettingsPageComponent } from './settings-page.component';

describe('SettingsPageComponent', () => {
  const localAi = { reset: vi.fn().mockResolvedValue(undefined) };

  beforeEach(async () => {
    if (typeof localStorage.removeItem === 'function') {
      localStorage.removeItem('aether.settings');
    }
    localAi.reset.mockClear();
    await TestBed.configureTestingModule({
      imports: [SettingsPageComponent],
      providers: [{ provide: LocalAiService, useValue: localAi }],
    }).compileComponents();
  });

  it('keeps form edits in draft until save', () => {
    const component = TestBed.createComponent(SettingsPageComponent).componentInstance;
    const store = TestBed.inject(SettingsStoreService);

    component.updateName('Draft User');

    expect(component.draft().profileName).toBe('Draft User');
    expect(store.settings().profileName).not.toBe('Draft User');
    expect(component.hasChanges()).toBe(true);
  });

  it('applies all draft changes when saved', () => {
    const component = TestBed.createComponent(SettingsPageComponent).componentInstance;
    const store = TestBed.inject(SettingsStoreService);
    component.updateWorkspace('Private Research Lab');
    component.updateResponseStyle('Concise');

    component.save();

    expect(store.settings()).toMatchObject({
      workspaceName: 'Private Research Lab',
      responseStyle: 'Concise',
    });
    expect(component.hasChanges()).toBe(false);
  });

  it('discards draft changes', () => {
    const component = TestBed.createComponent(SettingsPageComponent).componentInstance;
    const original = component.draft();
    component.updateRole('Temporary role');

    component.discard();

    expect(component.draft()).toEqual(original);
  });

  it('resets the active engine only when the saved model changes', () => {
    const component = TestBed.createComponent(SettingsPageComponent).componentInstance;
    component.updateModel('smart');

    component.save();

    expect(localAi.reset).toHaveBeenCalledOnce();
  });

  it('uses understandable creativity presets', () => {
    const component = TestBed.createComponent(SettingsPageComponent).componentInstance;

    component.setCreativity(0.2);

    expect(component.draft().temperature).toBe(0.2);
    expect(component.hasChanges()).toBe(true);
  });
});
