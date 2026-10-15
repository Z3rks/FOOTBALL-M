import { trustedProxies } from './app.setup';

describe('TRUST_PROXY', () => {
  it('cuenta los proxies delante de la API', () => {
    expect(trustedProxies(undefined)).toBe(0);
    expect(trustedProxies('false')).toBe(0);
    expect(trustedProxies('true')).toBe(1); // Render
    expect(trustedProxies('2')).toBe(2); // Vercel → Render
  });
});
