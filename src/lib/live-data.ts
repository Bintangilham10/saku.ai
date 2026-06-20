type ErrorLogger = (message: string, error: unknown) => void

export class LiveDataUnavailableError extends Error {
  constructor(cause: unknown) {
    super("Gagal memuat data finansial live.", { cause })
    this.name = "LiveDataUnavailableError"
  }
}

export async function loadLiveData<T>(
  loader: () => Promise<T>,
  logError: ErrorLogger = console.error
) {
  try {
    return await loader()
  } catch (error) {
    logError("Live Saku data load failed.", error)
    throw new LiveDataUnavailableError(error)
  }
}
