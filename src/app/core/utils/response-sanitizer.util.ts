const OPEN_TAG = '<think>';
const CLOSE_TAG = '</think>';

export class StreamingResponseSanitizer {
  private buffer = '';
  private visible = '';
  private insideThinkBlock = false;

  push(chunk: string): string {
    this.buffer += chunk;
    this.process(false);
    return this.visible;
  }

  finish(): string {
    this.process(true);
    return this.visible;
  }

  private process(final: boolean): void {
    while (this.buffer) {
      if (this.insideThinkBlock) {
        const closeIndex = this.buffer.toLowerCase().indexOf(CLOSE_TAG);
        if (closeIndex >= 0) {
          this.buffer = this.buffer.slice(closeIndex + CLOSE_TAG.length);
          this.insideThinkBlock = false;
          continue;
        }

        if (final) {
          this.buffer = '';
          return;
        }

        const retained = this.partialTagLength(this.buffer, CLOSE_TAG);
        this.buffer = retained ? this.buffer.slice(-retained) : '';
        return;
      }

      const openIndex = this.buffer.toLowerCase().indexOf(OPEN_TAG);
      if (openIndex >= 0) {
        this.visible += this.buffer.slice(0, openIndex);
        this.buffer = this.buffer.slice(openIndex + OPEN_TAG.length);
        this.insideThinkBlock = true;
        continue;
      }

      if (final) {
        this.visible += this.buffer;
        this.buffer = '';
        return;
      }

      const retained = this.partialTagLength(this.buffer, OPEN_TAG);
      const visibleLength = this.buffer.length - retained;
      this.visible += this.buffer.slice(0, visibleLength);
      this.buffer = this.buffer.slice(visibleLength);
      return;
    }
  }

  private partialTagLength(value: string, tag: string): number {
    const normalized = value.toLowerCase();
    const maxLength = Math.min(normalized.length, tag.length - 1);
    for (let length = maxLength; length > 0; length--) {
      if (normalized.endsWith(tag.slice(0, length))) {
        return length;
      }
    }
    return 0;
  }
}

export function sanitizeAssistantResponse(value: string): string {
  const sanitizer = new StreamingResponseSanitizer();
  sanitizer.push(value);
  return sanitizer.finish();
}
