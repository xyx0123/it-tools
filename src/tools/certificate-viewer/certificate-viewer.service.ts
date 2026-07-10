import 'reflect-metadata';
import { asn1, md, pki } from 'node-forge';
import { SubjectAlternativeNameExtension, X509Certificate } from '@peculiar/x509';

export interface CertificateIdentity {
  commonName?: string
  organizationName?: string
  organizationalUnitName?: string
  countryName?: string
  stateOrProvinceName?: string
  localityName?: string
}

export interface ParsedCertificate {
  index: number
  pem: string
  subject: CertificateIdentity
  issuer: CertificateIdentity
  serialNumber: string
  validity: {
    notBefore: string
    notAfter: string
  }
  subjectAlternativeNames: string[]
  fingerprints: {
    sha1: string
    sha256: string
  }
}

export interface ParsedCertificateError {
  index: number
  message: string
}

export interface ParseCertificateChainResult {
  certificates: ParsedCertificate[]
  errors: ParsedCertificateError[]
  summary: {
    total: number
    successCount: number
    failureCount: number
  }
}

export type CertificateParserMode = 'rsa' | 'all';

export interface ParseCertificateChainOptions {
  mode?: CertificateParserMode
}

const CERTIFICATE_PEM_REGEX = /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g;

export function parseCertificateChain(rawInput: string, options: ParseCertificateChainOptions = {}): ParseCertificateChainResult {
  const mode = options.mode ?? 'all';
  const input = rawInput.trim();

  if (input === '') {
    return emptyResult();
  }

  const pemBlocks = extractPemBlocks(input);
  if (pemBlocks.length === 0) {
    return {
      certificates: [],
      errors: [
        {
          index: 1,
          message: 'No certificate blocks were found in the provided text.',
        },
      ],
      summary: {
        total: 1,
        successCount: 0,
        failureCount: 1,
      },
    };
  }

  const certificates: ParsedCertificate[] = [];
  const errors: ParsedCertificateError[] = [];

  pemBlocks.forEach((pem, index) => {
    const itemIndex = index + 1;

    try {
      certificates.push(parseCertificate(pem, itemIndex, mode));
    }
    catch (error) {
      errors.push({
        index: itemIndex,
        message: errorToMessage(error),
      });
    }
  });

  return {
    certificates,
    errors,
    summary: {
      total: pemBlocks.length,
      successCount: certificates.length,
      failureCount: errors.length,
    },
  };
}

function parseCertificate(pem: string, index: number, mode: CertificateParserMode): ParsedCertificate {
  if (mode === 'rsa') {
    return parseCertificateWithForge(pem, index);
  }

  try {
    return parseCertificateWithForge(pem, index);
  }
  catch {
    return parseCertificateWithX509(pem, index);
  }
}

function parseCertificateWithForge(pem: string, index: number): ParsedCertificate {
  const certificate = pki.certificateFromPem(pem);

  return {
    index,
    pem,
    subject: extractIdentity(certificate.subject.attributes),
    issuer: extractIdentity(certificate.issuer.attributes),
    serialNumber: certificate.serialNumber,
    validity: {
      notBefore: certificate.validity.notBefore.toISOString(),
      notAfter: certificate.validity.notAfter.toISOString(),
    },
    subjectAlternativeNames: extractSubjectAlternativeNames(certificate),
    fingerprints: extractFingerprints(certificate),
  };
}

function parseCertificateWithX509(pem: string, index: number): ParsedCertificate {
  const certificate = new X509Certificate(pem);

  return {
    index,
    pem,
    subject: extractIdentityFromX509Name(certificate.subjectName),
    issuer: extractIdentityFromX509Name(certificate.issuerName),
    serialNumber: certificate.serialNumber,
    validity: {
      notBefore: certificate.notBefore.toISOString(),
      notAfter: certificate.notAfter.toISOString(),
    },
    subjectAlternativeNames: extractSubjectAlternativeNamesFromX509(certificate),
    fingerprints: extractFingerprintsFromDer(X509Certificate.toArrayBuffer(pem)),
  };
}

function emptyResult(): ParseCertificateChainResult {
  return {
    certificates: [],
    errors: [],
    summary: {
      total: 0,
      successCount: 0,
      failureCount: 0,
    },
  };
}

function extractPemBlocks(input: string): string[] {
  const pemMatches = input.match(CERTIFICATE_PEM_REGEX);
  if (pemMatches?.length) {
    return pemMatches.map(normalizePem);
  }

  const rawBase64Pem = maybeConvertRawBase64ToPem(input);
  return rawBase64Pem ? [rawBase64Pem] : [];
}

function normalizePem(pem: string): string {
  return pem.trim().replace(/\r\n/g, '\n');
}

function maybeConvertRawBase64ToPem(input: string): string | null {
  const normalized = input.replace(/\s+/g, '');
  if (!normalized || !/^[A-Za-z0-9+/=]+$/.test(normalized)) {
    return null;
  }

  // Prevent plain words from being treated as raw DER/base64 certificate content.
  if (!/[0-9+/=]/.test(normalized)) {
    return null;
  }

  const body = normalized.replace(/(.{64})/g, '$1\n').replace(/\n$/, '');
  return `-----BEGIN CERTIFICATE-----\n${body}\n-----END CERTIFICATE-----`;
}

function extractIdentity(attributes: pki.CertificateField[]): CertificateIdentity {
  return {
    commonName: getAttributeValue(attributes, ['CN', 'commonName']),
    organizationName: getAttributeValue(attributes, ['O', 'organizationName']),
    organizationalUnitName: getAttributeValue(attributes, ['OU', 'organizationalUnitName']),
    countryName: getAttributeValue(attributes, ['C', 'countryName']),
    stateOrProvinceName: getAttributeValue(attributes, ['ST', 'stateOrProvinceName']),
    localityName: getAttributeValue(attributes, ['L', 'localityName']),
  };
}

function extractIdentityFromX509Name(name: { getField: (idOrName: string) => string[] }): CertificateIdentity {
  return {
    commonName: getX509NameField(name, ['CN', 'commonName', '2.5.4.3']),
    organizationName: getX509NameField(name, ['O', 'organizationName', '2.5.4.10']),
    organizationalUnitName: getX509NameField(name, ['OU', 'organizationalUnitName', '2.5.4.11']),
    countryName: getX509NameField(name, ['C', 'countryName', '2.5.4.6']),
    stateOrProvinceName: getX509NameField(name, ['ST', 'stateOrProvinceName', '2.5.4.8']),
    localityName: getX509NameField(name, ['L', 'localityName', '2.5.4.7']),
  };
}

function getX509NameField(name: { getField: (idOrName: string) => string[] }, ids: string[]): string | undefined {
  for (const id of ids) {
    const values = name.getField(id);
    if (values.length > 0) {
      return values.join(', ');
    }
  }

  return undefined;
}

function getAttributeValue(attributes: pki.CertificateField[], names: string[]): string | undefined {
  const attribute = attributes.find(({ shortName, name }) => names.includes(shortName ?? '') || names.includes(name ?? ''));
  const value = attribute?.value;

  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(item => String(item)).join(', ');
  }

  if (value == null) {
    return undefined;
  }

  return String(value);
}

function extractSubjectAlternativeNames(certificate: pki.Certificate): string[] {
  const extension = certificate.getExtension('subjectAltName');
  if (!extension || !('altNames' in extension) || !Array.isArray(extension.altNames)) {
    return [];
  }

  return extension.altNames
    .map((entry) => {
      if (entry.type === 2 && entry.value) {
        return `DNS: ${entry.value}`;
      }

      if (entry.type === 6 && entry.value) {
        return `URI: ${entry.value}`;
      }

      if (entry.type === 7 && entry.ip) {
        return `IP: ${entry.ip}`;
      }

      if (entry.type === 1 && entry.value) {
        return `Email: ${entry.value}`;
      }

      return entry.value || entry.ip || null;
    })
    .filter((entry): entry is string => Boolean(entry));
}

function extractSubjectAlternativeNamesFromX509(certificate: X509Certificate): string[] {
  const extension = certificate.getExtension(SubjectAlternativeNameExtension);
  if (!extension) {
    return [];
  }

  return extension.names.items
    .map(({ type, value }) => {
      if (type === 'dns') {
        return `DNS: ${value}`;
      }

      if (type === 'url') {
        return `URI: ${value}`;
      }

      if (type === 'ip') {
        return `IP: ${value}`;
      }

      if (type === 'email') {
        return `Email: ${value}`;
      }

      return value;
    })
    .filter((entry): entry is string => Boolean(entry));
}

function extractFingerprints(certificate: pki.Certificate): { sha1: string; sha256: string } {
  const bytes = asn1.toDer(pki.certificateToAsn1(certificate)).getBytes();

  return extractFingerprintsFromBytes(bytes);
}

function extractFingerprintsFromDer(der: ArrayBuffer): { sha1: string; sha256: string } {
  return extractFingerprintsFromBytes(arrayBufferToBinaryString(der));
}

function extractFingerprintsFromBytes(bytes: string): { sha1: string; sha256: string } {
  return {
    sha1: toFingerprint(md.sha1.create().update(bytes).digest().toHex()),
    sha256: toFingerprint(md.sha256.create().update(bytes).digest().toHex()),
  };
}

function arrayBufferToBinaryString(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let value = '';

  for (let i = 0; i < bytes.length; i += 1) {
    value += String.fromCharCode(bytes[i] ?? 0);
  }

  return value;
}

function toFingerprint(hex: string): string {
  return hex
    .toUpperCase()
    .match(/.{1,2}/g)
    ?.join(':') ?? '';
}

function errorToMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Unknown certificate parsing error.';
}
