import { normalizeSettings } from './settings-store.service';

describe('SettingsStoreService', () => {
  it('migrates the original SmolLM2 setting without losing workspace preferences', () => {
    const settings = normalizeSettings({
      profileName: 'Alex',
      profileRole: 'Frontend Engineer',
      workspaceName: 'Private Lab',
      theme: 'light',
      model: 'SmolLM2 1.7B',
      temperature: 0.4,
      responseStyle: 'Concise',
    });

    expect(settings).toEqual({
      profileName: 'Alex',
      profileRole: 'Frontend Engineer',
      workspaceName: 'Private Lab',
      theme: 'light',
      model: 'fast',
      temperature: 0.4,
      responseStyle: 'Concise',
    });
  });
});
