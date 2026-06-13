import { MODEL_PROFILES, modelProfile } from './settings.model';

describe('model profiles', () => {
  it('defines four distinct supported local models', () => {
    expect(MODEL_PROFILES.map((profile) => profile.id)).toEqual([
      'fast',
      'balanced',
      'smart',
      'high-quality',
    ]);
    expect(new Set(MODEL_PROFILES.map((profile) => profile.modelId)).size).toBe(4);
  });

  it('uses Fast as the safe fallback profile', () => {
    expect(modelProfile('fast').modelName).toBe('SmolLM2 1.7B');
  });
});
