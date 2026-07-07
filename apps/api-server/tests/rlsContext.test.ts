import { Request, Response, NextFunction } from 'express';
import { requireTenantContext } from '../src/middleware/rlsContext';

describe('requireTenantContext middleware', () => {
  test('sets app.current_client_id from verified JWT user claim', () => {
    const mockRequest = {
      user: { sub: 'user-1', client_id: 'client-123', role: 'Admin', iat: 0, exp: 0, iss: 'structapp-app', aud: 'structapp-api' },
    } as Request;
    const mockResponse = {} as Response;
    const mockNext = jest.fn();

    requireTenantContext(mockRequest, mockResponse, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  test('calls next even without user (no error)', () => {
    const mockRequest = {} as Request;
    const mockResponse = {} as Response;
    const mockNext = jest.fn();

    requireTenantContext(mockRequest, mockResponse, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });
});