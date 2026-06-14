import { sanitizeAssistantResponse, StreamingResponseSanitizer } from './response-sanitizer.util';

describe('response sanitizer', () => {
  it('removes a complete think block from one response', () => {
    expect(sanitizeAssistantResponse('<think>private reasoning</think>Final answer.')).toBe('Final answer.');
  });

  it('removes a think block split across streamed chunks', () => {
    const sanitizer = new StreamingResponseSanitizer();

    expect(sanitizer.push('<thi')).toBe('');
    expect(sanitizer.push('nk>private ')).toBe('');
    expect(sanitizer.push('reasoning</thi')).toBe('');
    expect(sanitizer.push('nk>Final ')).toBe('Final ');
    expect(sanitizer.push('answer.')).toBe('Final answer.');
    expect(sanitizer.finish()).toBe('Final answer.');
  });

  it('discards an unclosed think block and everything after it', () => {
    expect(sanitizeAssistantResponse('Visible intro.<think>private reasoning')).toBe('Visible intro.');
  });

  it('removes multiple think blocks', () => {
    expect(sanitizeAssistantResponse(
      '<think>first</think>Answer one. <think>second</think>Answer two.',
    )).toBe('Answer one. Answer two.');
  });

  it('preserves a normal response without think tags', () => {
    expect(sanitizeAssistantResponse('A normal final answer.')).toBe('A normal final answer.');
  });
});
