<script lang="ts" setup>
import { NIcon, useThemeVars } from 'naive-ui';

import { RouterLink } from 'vue-router';
import { Heart, Home2, Menu2 } from '@vicons/tabler';

import { storeToRefs } from 'pinia';
import HeroGradient from '../assets/hero-gradient.svg?component';
import MenuLayout from '../components/MenuLayout.vue';
import NavbarButtons from '../components/NavbarButtons.vue';
import { useStyleStore } from '@/stores/style.store';
import { config } from '@/config';
import type { ToolCategory } from '@/tools/tools.types';
import { useToolStore } from '@/tools/tools.store';
import { useTracker } from '@/modules/tracker/tracker.services';
import CollapsibleToolMenu from '@/components/CollapsibleToolMenu.vue';

const themeVars = useThemeVars();
const styleStore = useStyleStore();
const version = config.app.version;
const commitSha = config.app.lastCommitSha.slice(0, 7);

const { tracker } = useTracker();
const { t } = useI18n();
const showPaymentPanel = ref(false);

const toolStore = useToolStore();
const { favoriteTools, toolsByCategory } = storeToRefs(toolStore);

const tools = computed<ToolCategory[]>(() => [
  ...(favoriteTools.value.length > 0 ? [{ name: t('tools.categories.favorite-tools'), components: favoriteTools.value }] : []),
  ...toolsByCategory.value,
]);
</script>

<template>
  <MenuLayout class="menu-layout" :class="{ isSmallScreen: styleStore.isSmallScreen }">
    <template #sider>
      <RouterLink to="/" class="hero-wrapper">
        <HeroGradient class="gradient" />
        <div class="text-wrapper">
          <div class="title">
            IT - TOOLS
          </div>
          <div class="divider" />
          <div class="subtitle">
            {{ $t('home.subtitle') }}
          </div>
        </div>
      </RouterLink>

      <div class="sider-content">
        <div v-if="styleStore.isSmallScreen" flex flex-col items-center>
          <locale-selector w="90%" />

          <div flex justify-center>
            <NavbarButtons />
          </div>
        </div>

        <CollapsibleToolMenu :tools-by-category="tools" />

        <div class="footer">
          <div>
            IT-Tools

            <c-link target="_blank" rel="noopener" :href="`https://github.com/xyx0123/it-tools/tree/v${version}`">
              v{{ version }}
            </c-link>

            <template v-if="commitSha && commitSha.length > 0">
              -
              <c-link
                target="_blank"
                rel="noopener"
                type="primary"
                :href="`https://github.com/xyx0123/it-tools/tree/${commitSha}`"
              >
                {{ commitSha }}
              </c-link>
            </template>
          </div>
          <div>
            Original author: Corentin Thomasset, consider
            <c-link target="_blank" rel="noopener" href="https://www.buymeacoffee.com/cthmsst">
              sponsoring him
            </c-link>
            .
          </div>
          <div>
            © {{ new Date().getFullYear() }}
            <c-link target="_blank" rel="noopener" href="https://corentin.tech?utm_source=it-tools&utm_medium=footer">
              Corentin Thomasset
            </c-link>
          </div>
        </div>
      </div>
    </template>

    <template #content>
      <div flex items-center justify-center gap-2>
        <c-button
          circle
          variant="text"
          :aria-label="$t('home.toggleMenu')"
          @click="styleStore.isMenuCollapsed = !styleStore.isMenuCollapsed"
        >
          <NIcon size="25" :component="Menu2" />
        </c-button>

        <c-tooltip :tooltip="$t('home.home')" position="bottom">
          <c-button to="/" circle variant="text" :aria-label="$t('home.home')">
            <NIcon size="25" :component="Home2" />
          </c-button>
        </c-tooltip>

        <c-tooltip :tooltip="$t('home.uiLib')" position="bottom">
          <c-button v-if="config.app.env === 'development'" to="/c-lib" circle variant="text" :aria-label="$t('home.uiLib')">
            <icon-mdi:brush-variant text-20px />
          </c-button>
        </c-tooltip>

        <command-palette />

        <locale-selector v-if="!styleStore.isSmallScreen" />

        <div>
          <NavbarButtons v-if="!styleStore.isSmallScreen" />
        </div>

        <c-tooltip position="bottom" :tooltip="$t('home.support')">
          <c-button
            round
            class="support-button"
            :bordered="false"
            @click="() => {
              showPaymentPanel = true;
              tracker.trackEvent({ eventName: 'Support button clicked' });
            }"
          >
            {{ $t('home.buyMeACoffee') }}
            <NIcon v-if="!styleStore.isSmallScreen" :component="Heart" ml-2 />
          </c-button>
        </c-tooltip>
      </div>

      <transition name="payment-panel-fade">
        <div v-if="showPaymentPanel" class="payment-panel-mask" @click="showPaymentPanel = false">
          <div class="payment-panel" @click.stop>
            <button class="payment-panel-close" @click="showPaymentPanel = false">
              Close
            </button>

            <div class="payment-item">
              <div class="payment-title">
                Wechat:
              </div>
              <div class="payment-qr-box">
                <img class="payment-qr-image" :src="'/payments/wechat-qr.JPG'" alt="Wechat QR code">
              </div>
            </div>

            <div class="payment-item">
              <div class="payment-title">
                Alipay:
              </div>
              <div class="payment-qr-box">
                <img class="payment-qr-image" :src="'/payments/alipay-qr.JPG'" alt="Alipay QR code">
              </div>
            </div>

            <div class="payment-attribution">
              <div class="payment-attribution-title">
                Attribution
              </div>
              <ul class="payment-attribution-list">
                <li>
                  This project is forked from CorentinTh/it-tools and is based on the excellent work of Corentin Thomasset.
                  This fork will continue to evolve with additional features and improvements while respecting the original GPL-3.0 license.
                </li>
                <li>
                  This service is free to use and will remain free. Running the servers, maintaining the service,
                  and developing new features all require time and resources.
                  If you find it useful and would like to support the continued development of this fork,
                  please consider making a voluntary donation.
                </li>
                <li>
                  Original project author: Corentin Thomasset
                </li>
              </ul>
              <div class="payment-attribution-support">
                Consider
                <c-link target="_blank" rel="noopener" href="https://buymeacoffee.com/cthmsst">
                  sponsoring him
                </c-link>
                .
              </div>
            </div>
          </div>
        </div>
      </transition>

      <slot />
    </template>
  </MenuLayout>
</template>

<style lang="less" scoped>
// ::v-deep(.n-layout-scroll-container) {
//     @percent: 4%;
//     @position: 25px;
//     @size: 50px;
//     @color: #eeeeee25;
//     background-image: radial-gradient(@color @percent, transparent @percent),
//         radial-gradient(@color @percent, transparent @percent);
//     background-position: 0 0, @position @position;
//     background-size: @size @size;
// }

.support-button {
  background: rgb(37, 99, 108);
  background: linear-gradient(48deg, rgba(37, 99, 108, 1) 0%, rgba(59, 149, 111, 1) 60%, rgba(20, 160, 88, 1) 100%);
  color: #fff !important;
  transition: padding ease 0.2s !important;

  &:hover {
    color: #fff;
    padding-left: 30px;
    padding-right: 30px;
  }
}

.payment-panel-fade-enter-active,
.payment-panel-fade-leave-active {
  transition: opacity 0.2s ease;
}

.payment-panel-fade-enter-from,
.payment-panel-fade-leave-to {
  opacity: 0;
}

.payment-panel-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 1000;
}

.payment-panel {
  width: min(480px, 100%);
  background: v-bind('themeVars.cardColor');
  border: 1px solid rgba(120, 120, 120, 0.25);
  border-radius: 14px;
  padding: 16px;
}

.payment-panel-close {
  margin-left: auto;
  display: block;
  border: 0;
  background: transparent;
  color: v-bind('themeVars.textColor2');
  cursor: pointer;
  margin-bottom: 10px;
}

.payment-item {
  &:not(:last-child) {
    margin-bottom: 14px;
  }
}

.payment-attribution {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(120, 120, 120, 0.08);
  border: 1px solid rgba(120, 120, 120, 0.16);
  color: v-bind('themeVars.textColor2');
  font-size: 11px;
  line-height: 1.55;
}

.payment-attribution-title {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.8;
  margin-bottom: 8px;
}

.payment-attribution-list {
  margin: 0;
  padding-left: 16px;
  display: grid;
  gap: 6px;
}

.payment-attribution-list li {
  margin: 0;
}

.payment-attribution-support {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed rgba(120, 120, 120, 0.3);
}

.payment-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
}

.payment-qr-box {
  width: 190px;
  height: 190px;
  border: 1px dashed rgba(120, 120, 120, 0.5);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: v-bind('themeVars.textColor3');
}

.payment-qr-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 6px;
  display: block;
}

.footer {
  text-align: center;
  color: #838587;
  margin-top: 20px;
  padding: 20px 0;
}

.sider-content {
  padding-top: 160px;
  padding-bottom: 200px;
}

.hero-wrapper {
  position: absolute;
  display: block;
  left: 0;
  width: 100%;
  z-index: 10;
  overflow: hidden;

  .gradient {
    margin-top: -65px;
  }

  .text-wrapper {
    position: absolute;
    left: 0;
    width: 100%;
    text-align: center;
    top: 16px;
    color: #fff;

    .title {
      font-size: 25px;
      font-weight: 600;
    }

    .divider {
      width: 50px;
      height: 2px;
      border-radius: 4px;
      background-color: v-bind('themeVars.primaryColor');
      margin: 0 auto 5px;
    }

    .subtitle {
      font-size: 16px;
    }
  }
}
</style>
