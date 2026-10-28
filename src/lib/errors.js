/**
 * Extracts a user-facing error message from an API or runtime error.
 */
export function getErrorMessage(err) {
  if (!err) return 'An unexpected error occurred.';

  // Explicit rate-limit message
  if (err.response?.status === 429) {
    return 'Too many attempts. Please wait a few minutes.';
  }

  // Network offline or server unreachable
  if (err.code === 'ERR_NETWORK' || (!err.response && err.request)) {
    return 'Cannot reach the server. Check your connection.';
  }

  // Backend envelope error message
  if (err.response?.data?.message) {
    return err.response.data.message;
  }

  if (err.message) {
    return err.message;
  }

  return 'An unexpected error occurred.';
}

/**
 * Maps backend validation errors (HTTP 422 errors array) to react-hook-form setError.
 */
export function applyFieldErrors(err, setError) {
  if (!err || typeof setError !== 'function') return;

  const errors = err.response?.data?.errors;
  if (!Array.isArray(errors)) return;

  errors.forEach((e) => {
    if (e && typeof e.field === 'string' && e.message) {
      setError(e.field, {
        type: 'server',
        message: e.message,
      });
    }
  });
}

/**
 * Checks if an error matches a given HTTP status code.
 */
export function isStatus(err, code) {
  return err?.response?.status === code;
}
