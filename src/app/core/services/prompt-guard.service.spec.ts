import { TestBed } from '@angular/core/testing';
import { PromptGuardService } from './prompt-guard.service';

describe('PromptGuardService', () => {
  let guard: PromptGuardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(PromptGuardService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('accepts a normal prompt', () => {
    expect(guard.check('Summarize my architecture notes').allowed).toBe(true);
  });

  it('rejects oversized prompts', () => {
    expect(guard.check('x'.repeat(4_001))).toEqual({
      allowed: false,
      reason: 'Keep messages under 4,000 characters.',
    });
  });

  it('rate limits immediate follow-up messages', () => {
    guard.check('first');
    expect(guard.check('second').allowed).toBe(false);
  });

  it('rejects repeated prompts during the duplicate window', () => {
    vi.spyOn(Date, 'now')
      .mockReturnValueOnce(2_000)
      .mockReturnValueOnce(4_000);
    expect(guard.check('same prompt').allowed).toBe(true);
    expect(guard.check('same   prompt').reason).toBe('That message was just submitted.');
  });
});
