export type ApiErrorKind = 'not-configured' | 'network' | 'invalid-input' | 'server';

/** Error thrown by the attendance service; `kind` decides which message the UI shows. */
export class AttendanceApiError extends Error {
  readonly kind: ApiErrorKind;
  constructor(kind: ApiErrorKind, message: string) {
    super(message);
    this.name = 'AttendanceApiError';
    this.kind = kind;
  }
}
