import { describe, expect, it } from 'vitest';
import { pki } from 'node-forge';
import { parseCertificateChain } from './certificate-viewer.service';

const ecdsaPem = [
  '-----BEGIN CERTIFICATE-----',
  'MIIBxzCCAW2gAwIBAgIUIojXLJ3TBfxh3DbmoHnJInthdIowCgYIKoZIzj0EAwIw',
  'OTEXMBUGA1UEAwwOZWMuZXhhbXBsZS5jb20xETAPBgNVBAoMCElUIFRvb2xzMQsw',
  'CQYDVQQGEwJVUzAeFw0yNjA3MTAwNTIzMjBaFw0yNzA3MTAwNTIzMjBaMDkxFzAV',
  'BgNVBAMMDmVjLmV4YW1wbGUuY29tMREwDwYDVQQKDAhJVCBUb29sczELMAkGA1UE',
  'BhMCVVMwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAQFfTBAudGCNVyeQ7JtL0SD',
  'Ty9snFqWOFi63vt7ko2bvt9kP8V/OKbq+yOv29tWpSJwkK9DpLZ+6g4A5UkX7fPd',
  'o1MwUTAdBgNVHQ4EFgQU9FNWYB31zfwMRGCQxF+yjoi6q1cwHwYDVR0jBBgwFoAU',
  '9FNWYB31zfwMRGCQxF+yjoi6q1cwDwYDVR0TAQH/BAUwAwEB/zAKBggqhkjOPQQD',
  'AgNIADBFAiEA9pWh9OsfKXeh4BxrrMMX7txoS/A2KX09euiNopCpnzMCIBSr2UFI',
  '8ThGW4pux7AwxMTsWfohLbFZKQ7RWleMUZvI',
  '-----END CERTIFICATE-----',
].join('\n');

describe('certificate-viewer', () => {
  describe('parseCertificateChain', () => {
    it('parses a single PEM certificate', () => {
      const pem = createSelfSignedPem({
        commonName: 'leaf.example.com',
        dnsNames: ['leaf.example.com'],
      });

      const result = parseCertificateChain(pem);

      expect(result.summary.total).toEqual(1);
      expect(result.summary.successCount).toEqual(1);
      expect(result.summary.failureCount).toEqual(0);
      expect(result.errors).toEqual([]);
      expect(result.certificates[0]?.subject.commonName).toEqual('leaf.example.com');
      expect(result.certificates[0]?.subjectAlternativeNames).toContain('DNS: leaf.example.com');
      expect(result.certificates[0]?.fingerprints.sha256).toMatch(/^([A-F0-9]{2}:)+[A-F0-9]{2}$/);
    });

    it('parses multiple certificates in the same chain text and keeps order', () => {
      const rootPem = createSelfSignedPem({ commonName: 'root.example.com', serialNumber: '1001' });
      const leafPem = createSelfSignedPem({ commonName: 'leaf.example.com', serialNumber: '1002' });

      const chain = `${leafPem}\n\n${rootPem}`;
      const result = parseCertificateChain(chain);

      expect(result.summary.total).toEqual(2);
      expect(result.summary.successCount).toEqual(2);
      expect(result.summary.failureCount).toEqual(0);
      expect(result.certificates.map(c => c.subject.commonName)).toEqual(['leaf.example.com', 'root.example.com']);
      expect(result.certificates.map(c => c.serialNumber)).toEqual(['1002', '1001']);
    });

    it('returns partial success when one certificate block is invalid', () => {
      const validPem = createSelfSignedPem({ commonName: 'valid.example.com' });
      const invalidPem = [
        '-----BEGIN CERTIFICATE-----',
        'NOT_A_VALID_CERTIFICATE_BLOCK',
        '-----END CERTIFICATE-----',
      ].join('\n');

      const result = parseCertificateChain(`${validPem}\n${invalidPem}`);

      expect(result.summary.total).toEqual(2);
      expect(result.summary.successCount).toEqual(1);
      expect(result.summary.failureCount).toEqual(1);
      expect(result.certificates[0]?.subject.commonName).toEqual('valid.example.com');
      expect(result.errors[0]?.index).toEqual(2);
      expect(result.errors[0]?.message.length).toBeGreaterThan(0);
    });

    it('returns an empty result on empty input', () => {
      const result = parseCertificateChain('   ');

      expect(result.summary.total).toEqual(0);
      expect(result.summary.successCount).toEqual(0);
      expect(result.summary.failureCount).toEqual(0);
      expect(result.certificates).toEqual([]);
      expect(result.errors).toEqual([]);
    });

    it('returns a parse error when no certificate blocks are found', () => {
      const result = parseCertificateChain('this is plain text and has no certificate');

      expect(result.summary.total).toEqual(1);
      expect(result.summary.successCount).toEqual(0);
      expect(result.summary.failureCount).toEqual(1);
      expect(result.errors[0]?.message).toContain('No certificate blocks were found');
    });

    it('uses all-algorithms mode by default', () => {
      const result = parseCertificateChain(ecdsaPem);

      expect(result.summary.total).toEqual(1);
      expect(result.summary.successCount).toEqual(1);
      expect(result.summary.failureCount).toEqual(0);
      expect(result.errors).toEqual([]);
      expect(result.certificates[0]?.subject.commonName).toEqual('ec.example.com');
    });

    it('fails on non-RSA certificates in RSA mode', () => {
      const result = parseCertificateChain(ecdsaPem, { mode: 'rsa' });

      expect(result.summary.total).toEqual(1);
      expect(result.summary.successCount).toEqual(0);
      expect(result.summary.failureCount).toEqual(1);
      expect(result.errors[0]?.message).toContain('OID is not RSA');
    });

    it('parses non-RSA certificates in all-algorithms mode', () => {
      const result = parseCertificateChain(ecdsaPem, { mode: 'all' });

      expect(result.summary.total).toEqual(1);
      expect(result.summary.successCount).toEqual(1);
      expect(result.summary.failureCount).toEqual(0);
      expect(result.errors).toEqual([]);
      expect(result.certificates[0]?.subject.commonName).toEqual('ec.example.com');
      expect(result.certificates[0]?.fingerprints.sha256).toMatch(/^([A-F0-9]{2}:)+[A-F0-9]{2}$/);
    });
  });
});

function createSelfSignedPem({
  commonName,
  serialNumber = '01',
  dnsNames = [],
}: {
  commonName: string
  serialNumber?: string
  dnsNames?: string[]
}) {
  const keys = pki.rsa.generateKeyPair({ bits: 512, e: 0x10001 });
  const certificate = pki.createCertificate();

  certificate.publicKey = keys.publicKey;
  certificate.serialNumber = serialNumber;

  const notBefore = new Date('2026-01-01T00:00:00.000Z');
  const notAfter = new Date('2030-01-01T00:00:00.000Z');
  certificate.validity.notBefore = notBefore;
  certificate.validity.notAfter = notAfter;

  const attributes = [
    { name: 'commonName', value: commonName },
    { name: 'organizationName', value: 'IT Tools' },
    { name: 'countryName', value: 'US' },
  ];

  certificate.setSubject(attributes);
  certificate.setIssuer(attributes);
  certificate.setExtensions([
    {
      name: 'subjectAltName',
      altNames: dnsNames.map(name => ({ type: 2, value: name })),
    },
  ]);

  certificate.sign(keys.privateKey);

  return pki.certificateToPem(certificate);
}
