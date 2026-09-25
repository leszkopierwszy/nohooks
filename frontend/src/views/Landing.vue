<template>
  <div class="landing min-h-dvh bg-[#ffffff] text-[#111827]">
    <header class="landing-nav absolute inset-x-0 top-0 z-20">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <p class="font-landing-display text-2xl tracking-tight text-[#111827] sm:text-3xl">
          {{ appName }}
        </p>
        <div class="flex items-center gap-2 sm:gap-3">
          <RouterLink
            :to="{ name: 'Login' }"
            class="rounded-md px-3 py-2 text-sm/6 font-semibold text-[#374151] transition hover:text-[#111827]"
          >
            {{ lt('nav.login') }}
          </RouterLink>
          <RouterLink
            :to="{ name: 'Login', query: { mode: 'register' } }"
            class="rounded-md bg-[#4f46e5] px-3.5 py-2 text-sm/6 font-semibold text-white shadow-xs transition hover:bg-[#4338ca]"
          >
            {{ lt('nav.cta') }}
          </RouterLink>
        </div>
      </div>
    </header>

    <section class="landing-hero relative flex min-h-dvh flex-col justify-end overflow-hidden pb-16 pt-28 sm:justify-center sm:pb-24 sm:pt-32">
      <div class="landing-hero-bg pointer-events-none absolute inset-0" aria-hidden="true" />
      <LandingDotField />
      <div class="relative z-10 mx-auto w-full max-w-6xl px-5 sm:px-8">
        <p class="landing-fade landing-fade-1 font-landing-display text-5xl leading-[0.95] tracking-tight text-[#111827] sm:text-7xl md:text-8xl lg:text-9xl">
          {{ appName }}
        </p>
        <h1 class="landing-fade landing-fade-2 mt-6 max-w-2xl font-landing-sans text-xl font-semibold leading-snug text-[#374151] sm:text-2xl md:text-3xl">
          {{ lt('hero.headline') }}
        </h1>
        <p class="landing-fade landing-fade-3 mt-4 max-w-xl text-base leading-7 text-[#4b5563] sm:text-lg">
          {{ lt('hero.sub') }}
        </p>
        <div class="landing-fade landing-fade-4 mt-8 flex flex-wrap items-center gap-3">
          <RouterLink
            :to="{ name: 'Login', query: { mode: 'register' } }"
            class="inline-flex items-center rounded-md bg-[#4f46e5] px-4 py-2.5 text-sm/6 font-semibold text-white shadow-xs transition hover:bg-[#4338ca]"
          >
            {{ lt('hero.ctaPrimary') }}
          </RouterLink>
          <RouterLink
            :to="{ name: 'Login' }"
            class="inline-flex items-center rounded-md bg-[#ffffff] px-4 py-2.5 text-sm/6 font-semibold text-[#4f46e5] shadow-xs ring-1 ring-inset ring-[#c7d2fe] transition hover:bg-[#eef2ff]"
          >
            {{ lt('hero.ctaSecondary') }}
          </RouterLink>
        </div>
      </div>
    </section>

    <section id="features" class="relative bg-[#ffffff] py-20 sm:py-28">
      <div class="mx-auto max-w-6xl px-5 sm:px-8">
        <h2 class="font-landing-display text-3xl tracking-tight text-[#111827] sm:text-4xl">
          {{ lt('features.title') }}
        </h2>
        <p class="mt-3 max-w-xl text-base leading-7 text-[#4b5563]">
          {{ lt('features.subtitle') }}
        </p>

        <div class="mt-12 grid grid-cols-1 gap-4 md:grid-cols-6 md:grid-rows-2 md:gap-4">
          <article
            class="landing-tile relative overflow-hidden rounded-2xl bg-[#f9fafb] p-6 ring-1 ring-[#e5e7eb] md:col-span-4 md:row-span-1 md:min-h-55"
          >
            <p class="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b7280]">
              {{ lt('features.style.eyebrow') }}
            </p>
            <h3 class="mt-3 font-landing-display text-2xl text-[#111827] sm:text-3xl">
              {{ lt('features.style.title') }}
            </h3>
            <p class="mt-3 max-w-md text-sm leading-6 text-[#4b5563] sm:text-base">
              {{ lt('features.style.body') }}
            </p>
          </article>

          <article
            class="landing-tile relative overflow-hidden rounded-2xl bg-[#f9fafb] p-6 ring-1 ring-[#e5e7eb] md:col-span-2 md:row-span-2 md:min-h-70"
          >
            <p class="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b7280]">
              {{ lt('features.prim.eyebrow') }}
            </p>
            <h3 class="mt-3 font-landing-display text-2xl text-[#111827] sm:text-3xl">
              {{ lt('features.prim.title') }}
            </h3>
            <p class="mt-3 text-sm leading-6 text-[#4b5563] sm:text-base">
              {{ lt('features.prim.body') }}
            </p>
          </article>

          <article
            class="landing-tile relative overflow-hidden rounded-2xl bg-[#f9fafb] p-6 ring-1 ring-[#e5e7eb] md:col-span-2 md:min-h-50"
          >
            <p class="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b7280]">
              {{ lt('features.finance.eyebrow') }}
            </p>
            <h3 class="mt-3 font-landing-display text-xl text-[#111827] sm:text-2xl">
              {{ lt('features.finance.title') }}
            </h3>
            <p class="mt-3 text-sm leading-6 text-[#4b5563]">
              {{ lt('features.finance.body') }}
            </p>
          </article>

          <article
            class="landing-tile relative overflow-hidden rounded-2xl bg-[#f9fafb] p-6 ring-1 ring-[#e5e7eb] md:col-span-2 md:min-h-50"
          >
            <p class="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b7280]">
              {{ lt('features.wellbeing.eyebrow') }}
            </p>
            <h3 class="mt-3 font-landing-display text-xl text-[#111827] sm:text-2xl">
              {{ lt('features.wellbeing.title') }}
            </h3>
            <p class="mt-3 text-sm leading-6 text-[#4b5563]">
              {{ lt('features.wellbeing.body') }}
            </p>
          </article>
        </div>
      </div>
    </section>

    <section id="subscribe" class="bg-[#f9fafb] py-16 sm:py-20">
      <div class="mx-auto max-w-6xl px-5 sm:px-8">
        <div class="rounded-2xl bg-[#ffffff] px-6 py-10 shadow-sm ring-1 ring-[#e5e7eb] sm:px-10 sm:py-12 lg:flex lg:items-center lg:justify-between lg:gap-12">
          <div class="max-w-xl">
            <h2 class="font-landing-sans text-2xl font-bold tracking-tight text-[#111827] sm:text-3xl">
              {{ lt('subscribe.title') }}
              <span class="block">{{ lt('subscribe.titleLine2') }}</span>
            </h2>
          </div>
          <form class="mt-8 w-full max-w-md lg:mt-0" @submit.prevent="onSubscribe">
            <div class="flex flex-col gap-3 sm:flex-row">
              <label for="landing-subscribe-email" class="sr-only">
                {{ lt('subscribe.emailLabel') }}
              </label>
              <input
                id="landing-subscribe-email"
                v-model="subscribeEmail"
                type="email"
                required
                autocomplete="email"
                :placeholder="lt('subscribe.placeholder')"
                class="min-w-0 flex-auto rounded-md bg-[#ffffff] px-3.5 py-2.5 text-sm text-[#111827] shadow-xs outline-1 -outline-offset-1 outline-[#d1d5db] placeholder:text-[#9ca3af] focus:outline-2 focus:-outline-offset-2 focus:outline-[#4f46e5]"
              />
              <button
                type="submit"
                class="shrink-0 rounded-md bg-[#4f46e5] px-3.5 py-2.5 text-sm/6 font-semibold text-white shadow-xs transition hover:bg-[#4338ca]"
              >
                {{ lt('subscribe.cta') }}
              </button>
            </div>
            <p class="mt-3 text-sm leading-6 text-[#4b5563]">
              {{ lt('subscribe.privacy') }}
              <a href="#" class="font-semibold text-[#4f46e5] hover:text-[#4338ca]">
                {{ lt('subscribe.privacyLink') }}
              </a>.
            </p>
          </form>
        </div>
      </div>
    </section>

    <section class="bg-[#ffffff] py-16 sm:py-20">
      <div class="mx-auto flex max-w-6xl flex-col items-start gap-6 px-5 sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div>
          <h2 class="font-landing-display text-3xl tracking-tight text-[#111827] sm:text-4xl">
            {{ lt('footerCta.title') }}
          </h2>
          <p class="mt-3 max-w-md text-base leading-7 text-[#4b5563]">
            {{ lt('footerCta.body') }}
          </p>
        </div>
        <RouterLink
          :to="{ name: 'Login', query: { mode: 'register' } }"
          class="inline-flex shrink-0 items-center rounded-md bg-[#4f46e5] px-4 py-2.5 text-sm/6 font-semibold text-white shadow-xs transition hover:bg-[#4338ca]"
        >
          {{ lt('footerCta.cta') }}
        </RouterLink>
      </div>
    </section>

    <footer class="border-t border-[#e5e7eb] bg-[#ffffff]" aria-labelledby="landing-footer-heading">
      <h2 id="landing-footer-heading" class="sr-only">{{ appName }}</h2>
      <div class="mx-auto max-w-6xl px-5 pt-16 pb-8 sm:px-8">
        <div class="xl:grid xl:grid-cols-3 xl:gap-8">
          <div class="space-y-4">
            <p class="font-landing-display text-2xl tracking-tight text-[#111827]">
              {{ appName }}
            </p>
            <p class="max-w-xs text-sm leading-6 text-[#4b5563]">
              {{ lt('hero.sub') }}
            </p>
          </div>
          <div class="mt-12 grid grid-cols-2 gap-8 md:grid-cols-4 xl:col-span-2 xl:mt-0">
            <div>
              <h3 class="text-sm/6 font-semibold text-[#111827]">
                {{ lt('footer.product.title') }}
              </h3>
              <ul role="list" class="mt-6 space-y-4">
                <li>
                  <a href="#features" class="text-sm/6 text-[#4b5563] transition hover:text-[#111827]">
                    {{ lt('footer.product.style') }}
                  </a>
                </li>
                <li>
                  <a href="#features" class="text-sm/6 text-[#4b5563] transition hover:text-[#111827]">
                    {{ lt('footer.product.finance') }}
                  </a>
                </li>
                <li>
                  <a href="#features" class="text-sm/6 text-[#4b5563] transition hover:text-[#111827]">
                    {{ lt('footer.product.wellbeing') }}
                  </a>
                </li>
                <li>
                  <a href="#features" class="text-sm/6 text-[#4b5563] transition hover:text-[#111827]">
                    {{ lt('footer.product.prims') }}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 class="text-sm/6 font-semibold text-[#111827]">
                {{ lt('footer.account.title') }}
              </h3>
              <ul role="list" class="mt-6 space-y-4">
                <li>
                  <RouterLink
                    :to="{ name: 'Login' }"
                    class="text-sm/6 text-[#4b5563] transition hover:text-[#111827]"
                  >
                    {{ lt('footer.account.login') }}
                  </RouterLink>
                </li>
                <li>
                  <RouterLink
                    :to="{ name: 'Login', query: { mode: 'register' } }"
                    class="text-sm/6 text-[#4b5563] transition hover:text-[#111827]"
                  >
                    {{ lt('footer.account.register') }}
                  </RouterLink>
                </li>
              </ul>
            </div>
            <div>
              <h3 class="text-sm/6 font-semibold text-[#111827]">
                {{ lt('footer.company.title') }}
              </h3>
              <ul role="list" class="mt-6 space-y-4">
                <li>
                  <a href="#" class="text-sm/6 text-[#4b5563] transition hover:text-[#111827]">
                    {{ lt('footer.company.about') }}
                  </a>
                </li>
                <li>
                  <a href="#features" class="text-sm/6 text-[#4b5563] transition hover:text-[#111827]">
                    {{ lt('footer.company.growth') }}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 class="text-sm/6 font-semibold text-[#111827]">
                {{ lt('footer.legal.title') }}
              </h3>
              <ul role="list" class="mt-6 space-y-4">
                <li>
                  <a href="#" class="text-sm/6 text-[#4b5563] transition hover:text-[#111827]">
                    {{ lt('footer.legal.terms') }}
                  </a>
                </li>
                <li>
                  <a href="#" class="text-sm/6 text-[#4b5563] transition hover:text-[#111827]">
                    {{ lt('footer.legal.privacy') }}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div class="mt-16 flex flex-col items-start justify-between gap-6 border-t border-[#111827]/10 pt-8 md:flex-row md:items-center">
          <p class="text-sm/6 text-[#6b7280]">
            {{ lt('footer.copyright') }}
          </p>
          <div class="flex gap-x-6">
            <a
              href="#"
              class="text-[#9ca3af] transition hover:text-[#6b7280]"
              :aria-label="lt('footer.social.facebook')"
            >
              <svg class="size-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill-rule="evenodd"
                  d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                  clip-rule="evenodd"
                />
              </svg>
            </a>
            <a
              href="#"
              class="text-[#9ca3af] transition hover:text-[#6b7280]"
              :aria-label="lt('footer.social.instagram')"
            >
              <svg class="size-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill-rule="evenodd"
                  d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                  clip-rule="evenodd"
                />
              </svg>
            </a>
            <a
              href="#"
              class="text-[#9ca3af] transition hover:text-[#6b7280]"
              :aria-label="lt('footer.social.x')"
            >
              <svg class="size-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M13.6823 10.6218L20.2391 3H18.6854L12.9921 9.61788L8.44486 3H3.2002L10.0765 13.0074L3.2002 21H4.75404L10.7663 14.0113L15.5685 21H20.8131L13.6819 10.6218H13.6823ZM11.5541 13.0956L10.8574 12.0991L5.31391 4.16971H7.70053L12.1742 10.5689L12.8709 11.5655L18.6861 19.8802H16.2995L11.5541 13.096V13.0956Z"
                />
              </svg>
            </a>
            <a
              href="#"
              class="text-[#9ca3af] transition hover:text-[#6b7280]"
              :aria-label="lt('footer.social.github')"
            >
              <svg class="size-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill-rule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clip-rule="evenodd"
                />
              </svg>
            </a>
            <a
              href="#"
              class="text-[#9ca3af] transition hover:text-[#6b7280]"
              :aria-label="lt('footer.social.youtube')"
            >
              <svg class="size-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill-rule="evenodd"
                  d="M19.812 5.418c.785.19 1.419.824 1.609 1.609.24 1.004.24 3.098.24 3.098s0 2.094-.24 3.098a2.287 2.287 0 01-1.609 1.609c-1.004.24-5.012.24-5.012.24s-4.008 0-5.012-.24a2.287 2.287 0 01-1.609-1.609C9.096 6.176 13.104 6.176 13.104 6.176s4.008 0 5.012.24h.696zM9.945 15.005V8.216l5.403 3.395-5.403 3.394z"
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
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import LandingDotField from '../components/LandingDotField.vue'
import { useLandingCopy } from '../composables/useLandingCopy'
import { useSiteConfigStore } from '../stores/siteConfig'

const { appName, lt } = useLandingCopy()
const router = useRouter()
const siteConfig = useSiteConfigStore()
const subscribeEmail = ref('')

function onSubscribe() {
  const email = subscribeEmail.value.trim()
  if (!email) return
  router.push({
    name: 'Login',
    query: { mode: 'register', email },
  })
}

onMounted(() => {
  siteConfig.load()
})
</script>

<style scoped>
.landing-hero-bg {
  background: linear-gradient(180deg, #ffffff 0%, #f9fafb 100%);
}

.landing-fade {
  opacity: 0;
  transform: translateY(14px);
  animation: landingRise 0.65s ease forwards;
}

.landing-fade-1 {
  animation-delay: 0.05s;
}
.landing-fade-2 {
  animation-delay: 0.16s;
}
.landing-fade-3 {
  animation-delay: 0.28s;
}
.landing-fade-4 {
  animation-delay: 0.4s;
}

.landing-tile {
  transition: background-color 0.2s ease;
}

.landing-tile:hover {
  background-color: #f3f4f6;
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
}
</style>
