import { describe, it, expect, vi } from 'vitest';
import { getErrorMessage, applyFieldErrors, isStatus } from '../lib/errors';

describe('errors utilities', () => {
  it('returns specific message for HTTP 429', () => {
    const error = { response: { status: 429 } };
    expect(getErrorMessage(error)).toBe('Too many attempts. Please wait a few minutes.');
  });

  it('returns network message when offline or unreachable', () => {
    const netError = { code: 'ERR_NETWORK' };
    expect(getErrorMessage(netError)).toBe('Cannot reach the server. Check your connection.');

    const reqError = { request: {} };
    expect(getErrorMessage(reqError)).toBe('Cannot reach the server. Check your connection.');
  });

  it('extracts backend envelope message', () => {
    const error = {
      response: {
        status: 400,
        data: { message: 'Incident cannot be cancelled in this status' },
      },
    };
    expect(getErrorMessage(error)).toBe('Incident cannot be cancelled in this status');
  });

  it('maps 422 field errors to setError callback', () => {
    const setError = vi.fn();
    const error = {
      response: {
        status: 422,
        data: {
          errorCode: 'VALIDATION_001',
          errors: [
            { field: 'email', message: 'Email already in use' },
            { field: 'password', message: 'Password is too weak' },
          ],
        },
      },
    };

    applyFieldErrors(error, setError);

    expect(setError).toHaveBeenCalledTimes(2);
    expect(setError).toHaveBeenCalledWith('email', {
      type: 'server',
      message: 'Email already in use',
    });
    expect(setError).toHaveBeenCalledWith('password', {
      type: 'server',
      message: 'Password is too weak',
    });
  });

  it('identifies status codes correctly with isStatus', () => {
    const error404 = { response: { status: 404 } };
    expect(isStatus(error404, 404)).toBe(true);
    expect(isStatus(error404, 500)).toBe(false);
  });
});
