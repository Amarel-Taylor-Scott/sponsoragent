import { describe, it, expect, beforeAll } from 'vitest';
import jwt from 'jsonwebtoken';
import { requireAuth } from './auth';

const SECRET = 'test-secret-sponsoragent';

beforeAll(() => {
  process.env.JWT_SECRET = SECRET;
});

/** Minimal Express res mock that records status + json body. */
function mockRes() {
  const res: any = { statusCode: 200, body: undefined };
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body: unknown) => {
    res.body = body;
    return res;
  };
  return res;
}

describe('requireAuth middleware', () => {
  it('calls next() and attaches the session for a valid Bearer token', () => {
    const token = jwt.sign({ userId: 42 }, SECRET);
    const req: any = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    let nextCalled = false;

    requireAuth(req, res, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
    expect(req.session).toEqual({ userId: 42 });
  });

  it('responds 401 when the Authorization header is missing', () => {
    const req: any = { headers: {} };
    const res = mockRes();
    let nextCalled = false;

    requireAuth(req, res, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(401);
    expect(res.body).toMatchObject({ success: false });
  });

  it('responds 401 for a malformed token', () => {
    const req: any = { headers: { authorization: 'Bearer not-a-real-token' } };
    const res = mockRes();
    let nextCalled = false;

    requireAuth(req, res, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(401);
  });

  it('responds 401 for a token signed with a different secret', () => {
    const token = jwt.sign({ userId: 7 }, 'some-other-secret');
    const req: any = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    let nextCalled = false;

    requireAuth(req, res, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(401);
  });
});
