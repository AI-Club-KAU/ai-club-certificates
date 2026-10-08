/**
 * Runtime configuration read from Vite environment variables.
 * See `.env.example` for what each value means.
 */
export const env = {
  attendanceApiUrl: (import.meta.env.VITE_ATTENDANCE_API_URL ?? '').trim(),
  useMockApi: import.meta.env.VITE_USE_MOCK_API === 'true',
} as const;
