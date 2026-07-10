<script setup lang="ts">
import { useStorage } from '@vueuse/core';
import type { CertificateParserMode, ParsedCertificate } from './certificate-viewer.service';
import { parseCertificateChain } from './certificate-viewer.service';
import type { CKeyValueListItems } from '@/ui/c-key-value-list/c-key-value-list.types';

const rawCertificateInput = useStorage('certificate-viewer:raw-certificate-input', '');
const parserMode = useStorage<CertificateParserMode>('certificate-viewer:parser-mode', 'all');
const parsedCertificateInput = ref(rawCertificateInput.value);
const appliedParserMode = ref<CertificateParserMode>(parserMode.value);

const parseResult = computed(() => parseCertificateChain(parsedCertificateInput.value, { mode: appliedParserMode.value }));
const hasPendingChanges = computed(() => parsedCertificateInput.value !== rawCertificateInput.value || appliedParserMode.value !== parserMode.value);

const summaryItems = computed<CKeyValueListItems>(() => [
  {
    label: 'Total blocks',
    value: parseResult.value.summary.total,
    showCopyButton: false,
  },
  {
    label: 'Parsed certificates',
    value: parseResult.value.summary.successCount,
    showCopyButton: false,
  },
  {
    label: 'Parsing errors',
    value: parseResult.value.summary.failureCount,
    showCopyButton: false,
  },
]);

function toCertificateItems(certificate: ParsedCertificate): CKeyValueListItems {
  return [
    {
      label: 'Subject common name',
      value: certificate.subject.commonName,
      hideOnNil: true,
    },
    {
      label: 'Subject organization',
      value: certificate.subject.organizationName,
      hideOnNil: true,
    },
    {
      label: 'Subject org unit',
      value: certificate.subject.organizationalUnitName,
      hideOnNil: true,
    },
    {
      label: 'Subject country',
      value: certificate.subject.countryName,
      hideOnNil: true,
    },
    {
      label: 'Issuer common name',
      value: certificate.issuer.commonName,
      hideOnNil: true,
    },
    {
      label: 'Issuer organization',
      value: certificate.issuer.organizationName,
      hideOnNil: true,
    },
    {
      label: 'Issuer org unit',
      value: certificate.issuer.organizationalUnitName,
      hideOnNil: true,
    },
    {
      label: 'Issuer country',
      value: certificate.issuer.countryName,
      hideOnNil: true,
    },
    {
      label: 'Valid from',
      value: new Date(certificate.validity.notBefore).toLocaleString(),
    },
    {
      label: 'Valid to',
      value: new Date(certificate.validity.notAfter).toLocaleString(),
    },
    {
      label: 'Serial number',
      value: certificate.serialNumber,
    },
    {
      label: 'Subject alternative names',
      value: certificate.subjectAlternativeNames,
      hideOnNil: true,
    },
    {
      label: 'SHA-1 fingerprint',
      value: certificate.fingerprints.sha1,
      displayedValue: wrapFingerprintForDisplay(certificate.fingerprints.sha1),
    },
    {
      label: 'SHA-256 fingerprint',
      value: certificate.fingerprints.sha256,
      displayedValue: wrapFingerprintForDisplay(certificate.fingerprints.sha256),
    },
  ];
}

function wrapFingerprintForDisplay(value: string): string {
  return value.replace(/:/g, ':\u200B');
}

function runParse() {
  parsedCertificateInput.value = rawCertificateInput.value;
  appliedParserMode.value = parserMode.value;
}
</script>

<template>
  <n-grid cols="1 900:2" x-gap="12" y-gap="12" responsive="screen">
    <n-gi>
      <div flex flex-col gap-3>
        <n-form-item label="Certificate chain input" :show-feedback="false">
          <c-input-text
            v-model:value="rawCertificateInput"
            test-id="input"
            placeholder="Paste PEM / CRT certificate chain content here..."
            rows="22"

            raw-text multiline monospace
            autocapitalize="off"
            autocomplete="off"
            autocorrect="off"
            spellcheck="false"
          />
        </n-form-item>

        <n-button type="primary" data-test-id="parse-button" @click="runParse">
          Parse certificates
        </n-button>

        <n-collapse>
          <n-collapse-item title="Advanced options" name="advanced-options">
            <n-form-item label="Public key parser mode" :show-feedback="false">
              <n-radio-group v-model:value="parserMode" test-id="parser-mode">
                <n-space>
                  <n-radio value="all">
                    All algorithms (recommended)
                  </n-radio>
                  <n-radio value="rsa">
                    RSA only (strict)
                  </n-radio>
                </n-space>
              </n-radio-group>
            </n-form-item>
          </n-collapse-item>
        </n-collapse>

        <c-alert v-if="hasPendingChanges" type="warning" title="Input changed">
          Click Parse certificates to apply the latest input or parser mode.
        </c-alert>
      </div>
    </n-gi>

    <n-gi>
      <div flex flex-col gap-3>
        <c-card>
          <c-key-value-list :items="summaryItems" />
        </c-card>

        <c-alert v-if="parseResult.errors.length > 0" type="error" title="Some certificate blocks could not be parsed">
          <div v-for="error in parseResult.errors" :key="error.index">
            Certificate {{ error.index }}: {{ error.message }}
          </div>
        </c-alert>

        <c-alert v-if="parsedCertificateInput.trim() === ''">
          Paste certificate chain content in the input area to inspect subjects, issuer, validity, SAN, and fingerprints.
        </c-alert>

        <c-alert v-else-if="parseResult.certificates.length === 0" type="error" title="No valid certificate parsed">
          Make sure your content contains one or more complete certificate blocks.
        </c-alert>

        <c-card
          v-for="certificate in parseResult.certificates"
          :key="certificate.index"
          :title="`Certificate ${certificate.index}`"
          data-test-id="certificate-card"
        >
          <c-key-value-list :items="toCertificateItems(certificate)" />

          <n-collapse mt-4>
            <n-collapse-item title="PEM certificate" :name="certificate.index">
              <pre class="pem-block">{{ certificate.pem }}</pre>
            </n-collapse-item>
          </n-collapse>
        </c-card>
      </div>
    </n-gi>
  </n-grid>
</template>

<style lang="less" scoped>
.pem-block {
  white-space: pre-wrap;
  word-break: break-all;
  font-family: var(--font-family-mono);
  font-size: 12px;
  line-height: 1.5;
}
</style>
