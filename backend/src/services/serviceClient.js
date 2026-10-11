export class ServiceError extends Error {
  constructor(message, { status = 502, retryable = false } = {}) {
    super(message);
    this.name = 'ServiceError';
    this.status = status;
    this.retryable = retryable;
  }
}

function createTimeoutSignal(timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    dispose: () => clearTimeout(timer),
  };
}

export async function postVisionForm(baseUrl, endpoint, fields, timeoutMs) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value && typeof value === 'object' && 'value' in value) {
      form.append(key, value.value, value.filename);
    } else {
      form.append(key, value);
    }
  }
  return postJson(baseUrl, endpoint, form, timeoutMs);
}

export async function postJson(baseUrl, endpoint, body, timeoutMs) {
  const timeout = createTimeoutSignal(timeoutMs);
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
      body: body instanceof FormData ? body : JSON.stringify(body),
      signal: timeout.signal,
    });
    const responseText = await response.text();
    let payload;
    try {
      payload = responseText ? JSON.parse(responseText) : null;
    } catch {
      throw new ServiceError(`${endpoint} returned invalid JSON`);
    }
    if (!response.ok) {
      const message = payload?.detail || payload?.error || `${endpoint} failed (${response.status})`;
      throw new ServiceError(message, {
        status: response.status,
        retryable: response.status >= 500,
      });
    }
    if (!payload || typeof payload !== 'object') {
      throw new ServiceError(`${endpoint} returned an empty or invalid response`);
    }
    return payload;
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    throw new ServiceError(`${endpoint} request failed: ${error.message}`, { retryable: true });
  } finally {
    timeout.dispose();
  }
}
