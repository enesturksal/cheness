import { describe, expect, it } from 'vitest';
import { base64url, codeChallenge, looksLikeToken } from './lichessAuth';
import { sha256 } from './sha256';

const hex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');

describe('sha256 fallback', () => {
  it('matches known vectors', () => {
    expect(hex(sha256(new Uint8Array()))).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
    expect(hex(sha256(new TextEncoder().encode('abc')))).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
    // 56 bytes: exercises the two-block padding path
    expect(
      hex(
        sha256(
          new TextEncoder().encode('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq'),
        ),
      ),
    ).toBe('248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1');
  });

  it('agrees with Web Crypto for the PKCE challenge', async () => {
    // RFC 7636 appendix B
    const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
    expect(await codeChallenge(verifier)).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
    expect(base64url(sha256(new TextEncoder().encode(verifier)))).toBe(
      'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
    );
  });
});

describe('token shape', () => {
  it('accepts lichess-style tokens and rejects junk', () => {
    expect(looksLikeToken('lip_AbC123_xyz')).toBe(true);
    expect(looksLikeToken('  lio_token_1234  ')).toBe(true);
    expect(looksLikeToken('short')).toBe(false);
    expect(looksLikeToken('has spaces in it')).toBe(false);
  });
});
