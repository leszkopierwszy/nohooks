<template>
  <div class="landing min-h-dvh bg-[#0c1210] text-[#e8efe9]">
    <header class="landing-nav absolute inset-x-0 top-0 z-20">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <p class="font-landing-display text-2xl tracking-tight text-[#e8efe9] sm:text-3xl">
          {{ appName }}
        </p>
        <div class="flex items-center gap-2 sm:gap-3">
          <RouterLink
            :to="{ name: 'Login' }"
            class="rounded-md px-3 py-2 text-sm font-medium text-[#a8b5ad] transition hover:text-[#e8efe9]"
          >
            {{ t('landing.nav.login') }}
          </RouterLink>
          <RouterLink
            :to="{ name: 'Login', query: { mode: 'register' } }"
            class="rounded-md bg-[#c4f04d] px-3.5 py-2 text-sm font-semibold text-[#0c1210] transition hover:bg-[#d4ff6a]"
          >
            {{ t('landing.nav.cta') }}
          </RouterLink>
        </div>
      </div>
    </header>

    <section class="landing-hero relative flex min-h-dvh flex-col justify-end overflow-hidden pb-16 pt-28 sm:justify-center sm:pb-24 sm:pt-32">
      <div class="landing-hero-bg pointer-events-none absolute inset-0" aria-hidden="true" />
      <div class="relative z-10 mx-auto w-full max-w-6xl px-5 sm:px-8">
        <p class="landing-fade landing-fade-1 font-landing-display text-5xl leading-[0.95] tracking-tight text-[#e8efe9] sm:text-7xl md:text-8xl lg:text-9xl">
          {{ appName }}
        </p>
        <h1 class="landing-fade landing-fade-2 mt-6 max-w-2xl font-landing-sans text-xl font-medium leading-snug text-[#c4f04d] sm:text-2xl md:text-3xl">
          {{ t('landing.hero.headline') }}
        </h1>
        <p class="landing-fade landing-fade-3 mt-4 max-w-xl text-base leading-relaxed text-[#a8b5ad] sm:text-lg">
          {{ t('landing.hero.sub', { name: appName }) }}
        </p>
        <div class="landing-fade landing-fade-4 mt-8 flex flex-wrap items-center gap-3">
          <RouterLink
            :to="{ name: 'Login', query: { mode: 'register' } }"
            class="inline-flex items-center rounded-md bg-[#c4f04d] px-5 py-3 text-sm font-semibold text-[#0c1210] transition hover:bg-[#d4ff6a]"
          >
            {{ t('landing.hero.ctaPrimary') }}
          </RouterLink>
          <RouterLink
            :to="{ name: 'Login' }"
            class="inline-flex items-center rounded-md border border-[#2a3830] px-5 py-3 text-sm font-medium text-[#e8efe9] transition hover:border-[#c4f04d]/40 hover:bg-white/5"
          >
            {{ t('landing.hero.ctaSecondary') }}
          </RouterLink>
        </div>
      </div>
    </section>

    <section id="features" class="relative border-t border-[#1a2420] bg-[#0a0f0d] py-20 sm:py-28">
      <div class="mx-auto max-w-6xl px-5 sm:px-8">
        <h2 class="font-landing-display text-3xl tracking-tight text-[#e8efe9] sm:text-4xl">
          {{ t('landing.features.title') }}
        </h2>
        <p class="mt-3 max-w-xl text-[#a8b5ad]">
          {{ t('landing.features.subtitle') }}
        </p>

        <div class="mt-12 grid grid-cols-1 gap-4 md:grid-cols-6 md:grid-rows-2 md:gap-5">
          <article
            class="landing-tile group relative overflow-hidden rounded-2xl border border-[#1f2c26] bg-[#111916] p-6 md:col-span-4 md:row-span-1 md:min-h-55"
          >
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[#c4f04d]/80">
              {{ t('landing.features.style.eyebrow') }}
            </p>
            <h3 class="mt-3 font-landing-display text-2xl text-[#e8efe9] sm:text-3xl">
              {{ t('landing.features.style.title') }}
            </h3>
            <p class="mt-3 max-w-md text-sm leading-relaxed text-[#a8b5ad] sm:text-base">
              {{ t('landing.features.style.body') }}
            </p>
            <div
              class="pointer-events-none absolute -right-8 -bottom-10 h-40 w-40 rounded-full bg-[#c4f04d]/10 blur-2xl transition group-hover:bg-[#c4f04d]/20"
              aria-hidden="true"
            />
          </article>

          <article
            class="landing-tile group relative overflow-hidden rounded-2xl border border-[#1f2c26] bg-[#111916] p-6 md:col-span-2 md:row-span-2 md:min-h-70"
          >
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[#7dd3c0]/90">
              {{ t('landing.features.prim.eyebrow') }}
            </p>
            <h3 class="mt-3 font-landing-display text-2xl text-[#e8efe9] sm:text-3xl">
              {{ t('landing.features.prim.title') }}
            </h3>
            <p class="mt-3 text-sm leading-relaxed text-[#a8b5ad] sm:text-base">
              {{ t('landing.features.prim.body') }}
            </p>
            <div
              class="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-[#7dd3c0]/10 to-transparent"
              aria-hidden="true"
            />
          </article>

          <article
            class="landing-tile group relative overflow-hidden rounded-2xl border border-[#1f2c26] bg-[#111916] p-6 md:col-span-2 md:min-h-50"
          >
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[#f0b45a]/90">
              {{ t('landing.features.finance.eyebrow') }}
            </p>
            <h3 class="mt-3 font-landing-display text-xl text-[#e8efe9] sm:text-2xl">
              {{ t('landing.features.finance.title') }}
            </h3>
            <p class="mt-3 text-sm leading-relaxed text-[#a8b5ad]">
              {{ t('landing.features.finance.body') }}
            </p>
          </article>

          <article
            class="landing-tile group relative overflow-hidden rounded-2xl border border-[#1f2c26] bg-[#111916] p-6 md:col-span-2 md:min-h-50"
          >
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[#9db8ff]/90">
              {{ t('landing.features.wellbeing.eyebrow') }}
            </p>
            <h3 class="mt-3 font-landing-display text-xl text-[#e8efe9] sm:text-2xl">
              {{ t('landing.features.wellbeing.title') }}
            </h3>
            <p class="mt-3 text-sm leading-relaxed text-[#a8b5ad]">
              {{ t('landing.features.wellbeing.body') }}
            </p>
          </article>
        </div>
      </div>
    </section>

    <section class="border-t border-[#1a2420] bg-[#0c1210] py-20 sm:py-24">
      <div class="mx-auto flex max-w-6xl flex-col items-start gap-6 px-5 sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div>
          <h2 class="font-landing-display text-3xl tracking-tight text-[#e8efe9] sm:text-4xl">
            {{ t('landing.footerCta.title', { name: appName }) }}
          </h2>
          <p class="mt-3 max-w-md text-[#a8b5ad]">
            {{ t('landing.footerCta.body') }}
          </p>
        </div>
        <RouterLink
          :to="{ name: 'Login', query: { mode: 'register' } }"
          class="inline-flex shrink-0 items-center rounded-md bg-[#c4f04d] px-5 py-3 text-sm font-semibold text-[#0c1210] transition hover:bg-[#d4ff6a]"
        >
          {{ t('landing.footerCta.cta') }}
        </RouterLink>
      </div>
    </section>

    <footer class="border-t border-[#1a2420] bg-[#0a0f0d]" aria-labelledby="landing-footer-heading">
      <h2 id="landing-footer-heading" class="sr-only">{{ appName }}</h2>
      <div class="mx-auto max-w-6xl px-5 pt-16 pb-8 sm:px-8">
        <div class="xl:grid xl:grid-cols-3 xl:gap-8">
          <div class="space-y-4">
            <p class="font-landing-display text-2xl tracking-tight text-[#e8efe9]">
              {{ appName }}
            </p>
            <p class="max-w-xs text-sm leading-relaxed text-[#7a8a80]">
              {{ t('landing.hero.sub', { name: appName }) }}
            </p>
          </div>
          <div class="mt-12 grid grid-cols-2 gap-8 md:grid-cols-4 xl:col-span-2 xl:mt-0">
            <div>
              <h3 class="text-sm font-semibold text-[#e8efe9]">
                {{ t('landing.footer.product.title') }}
              </h3>
              <ul role="list" class="mt-4 space-y-3">
                <li>
                  <a href="#features" class="text-sm text-[#7a8a80] transition hover:text-[#e8efe9]">
                    {{ t('landing.footer.product.style') }}
                  </a>
                </li>
                <li>
                  <a href="#features" class="text-sm text-[#7a8a80] transition hover:text-[#e8efe9]">
                    {{ t('landing.footer.product.finance') }}
                  </a>
                </li>
                <li>
                  <a href="#features" class="text-sm text-[#7a8a80] transition hover:text-[#e8efe9]">
                    {{ t('landing.footer.product.wellbeing') }}
                  </a>
                </li>
                <li>
                  <a href="#features" class="text-sm text-[#7a8a80] transition hover:text-[#e8efe9]">
                    {{ t('landing.footer.product.prims') }}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 class="text-sm font-semibold text-[#e8efe9]">
                {{ t('landing.footer.account.title') }}
              </h3>
              <ul role="list" class="mt-4 space-y-3">
                <li>
                  <RouterLink
                    :to="{ name: 'Login' }"
                    class="text-sm text-[#7a8a80] transition hover:text-[#e8efe9]"
                  >
                    {{ t('landing.footer.account.login') }}
                  </RouterLink>
                </li>
                <li>
                  <RouterLink
                    :to="{ name: 'Login', query: { mode: 'register' } }"
                    class="text-sm text-[#7a8a80] transition hover:text-[#e8efe9]"
                  >
                    {{ t('landing.footer.account.register') }}
                  </RouterLink>
                </li>
              </ul>
            </div>
            <div>
              <h3 class="text-sm font-semibold text-[#e8efe9]">
                {{ t('landing.footer.company.title') }}
              </h3>
              <ul role="list" class="mt-4 space-y-3">
                <li>
                  <a href="#" class="text-sm text-[#7a8a80] transition hover:text-[#e8efe9]">
                    {{ t('landing.footer.company.about') }}
                  </a>
                </li>
                <li>
                  <a href="#features" class="text-sm text-[#7a8a80] transition hover:text-[#e8efe9]">
                    {{ t('landing.footer.company.growth') }}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 class="text-sm font-semibold text-[#e8efe9]">
                {{ t('landing.footer.legal.title') }}
              </h3>
              <ul role="list" class="mt-4 space-y-3">
                <li>
                  <a href="#" class="text-sm text-[#7a8a80] transition hover:text-[#e8efe9]">
                    {{ t('landing.footer.legal.terms') }}
                  </a>
                </li>
                <li>
                  <a href="#" class="text-sm text-[#7a8a80] transition hover:text-[#e8efe9]">
                    {{ t('landing.footer.legal.privacy') }}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div class="mt-12 flex flex-col items-start justify-between gap-6 border-t border-[#1a2420] pt-8 md:flex-row md:items-center">
          <p class="text-sm text-[#5c6b63]">
            {{ t('landing.footer.copyright', { year: currentYear, name: appName }) }}
          </p>
          <div class="flex gap-5">
            <a
              href="#"
              class="text-[#5c6b63] transition hover:text-[#e8efe9]"
              :aria-label="t('landing.footer.social.facebook')"
            >
              <svg class="size-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill-rule="evenodd"
                  d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                  clip-rule="evenodd"
                />
              </svg>
            </a>
            <a
              href="#"
              class="text-[#5c6b63] transition hover:text-[#e8efe9]"
              :aria-label="t('landing.footer.social.instagram')"
            >
              <svg class="size-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill-rule="evenodd"
                  d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                  clip-rule="evenodd"
                />
              </svg>
            </a>
            <a
              href="#"
              class="text-[#5c6b63] transition hover:text-[#e8efe9]"
              :aria-label="t('landing.footer.social.x')"
            >
              <svg class="size-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M13.6823 10.6218L20.2391 3H18.6854L12.9921 9.61788L8.44486 3H3.2002L10.0765 13.0074L3.2002 21H4.75404L10.7663 14.0113L15.5685 21H20.8131L13.6819 10.6218H13.6823ZM11.5541 13.0956L10.8574 12.0991L5.31391 4.16971H7.70053L12.1742 10.5689L12.8709 11.5655L18.6861 19.8802H16.2995L11.5541 13.096V13.0956Z"
                />
              </svg>
            </a>
            <a
              href="#"
              class="text-[#5c6b63] transition hover:text-[#e8efe9]"
              :aria-label="t('landing.footer.social.github')"
            >
              <svg class="size-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill-rule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clip-rule="evenodd"
                />
              </svg>
            </a>
            <a
              href="#"
              class="text-[#5c6b63] transition hover:text-[#e8efe9]"
              :aria-label="t('landing.footer.social.youtube')"
            >
              <svg class="size-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill-rule="evenodd"
                  d="M19.812 5.418c.785.19 1.419.824 1.609 1.609.24 1.004.24 3.098.24 3.098s0 2.094-.24 3.098a2.287 2.287 0 01-1.609 1.609c-1.004.24-5.012.24-5.012.24s-4.008 0-5.012-.24a2.287 2.287 0 01-1.609-1.609C6.24 13.217 6.24 11.123 6.24 11.123s0-2.094.24-3.098a2.287 2.287 0 011.609-1.609C9.096 6.176 13.104 6.176 13.104 6.176s4.008 0 5.012.24h.696zM9.945 15.005V8.216l5.403 3.395-5.403 3.394z"
                  clip-rule="evenodd"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useI18n } from '../composables/useI18n'
import { useSiteConfigStore } from '../stores/siteConfig'

const { t } = useI18n()
const siteConfig = useSiteConfigStore()

const appName = computed(() => siteConfig.appName || 'nohooks')
const currentYear = new Date().getFullYear()

onMounted(() => {
  siteConfig.load()
})
</script>

<style scoped>
.landing {
  --landing-lime: #c4f04d;
}

.landing-hero-bg {
  background:
    radial-gradient(ellipse 80% 60% at 70% 20%, rgba(196, 240, 77, 0.14), transparent 55%),
    radial-gradient(ellipse 50% 40% at 10% 80%, rgba(125, 211, 192, 0.12), transparent 50%),
    radial-gradient(ellipse 40% 30% at 90% 90%, rgba(157, 184, 255, 0.08), transparent 45%),
    linear-gradient(165deg, #0c1210 0%, #101816 45%, #0a0f0d 100%);
}

.landing-hero-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.35;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E");
  mix-blend-mode: overlay;
  pointer-events: none;
}

.landing-fade {
  opacity: 0;
  transform: translateY(18px);
  animation: landingRise 0.7s ease forwards;
}

.landing-fade-1 {
  animation-delay: 0.05s;
}
.landing-fade-2 {
  animation-delay: 0.18s;
}
.landing-fade-3 {
  animation-delay: 0.3s;
}
.landing-fade-4 {
  animation-delay: 0.42s;
}

.landing-tile {
  transition: border-color 0.25s ease, transform 0.25s ease;
}

.landing-tile:hover {
  border-color: rgba(196, 240, 77, 0.35);
  transform: translateY(-2px);
}

@keyframes landingRise {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .landing-fade {
    opacity: 1;
    transform: none;
    animation: none;
  }
  .landing-tile:hover {
    transform: none;
  }
}
</style>
