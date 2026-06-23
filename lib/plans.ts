export type PlanId = 'free' | 'base' | 'premium'
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled'

export interface PlanLimits {
  maxMasters: number        // -1 = безлимит
  maxServices: number
  maxGalleryPhotos: number
  customDomain: boolean
  themeCustomization: boolean
}

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    maxMasters: 2,
    maxServices: 10,
    maxGalleryPhotos: 5,
    customDomain: false,
    themeCustomization: false,
  },
  base: {
    maxMasters: 10,
    maxServices: -1,
    maxGalleryPhotos: 20,
    customDomain: false,
    themeCustomization: false,
  },
  premium: {
    maxMasters: -1,
    maxServices: -1,
    maxGalleryPhotos: -1,
    customDomain: true,
    themeCustomization: true,
  },
}

export function isActiveSubscription(status: SubscriptionStatus): boolean {
  return status === 'trialing' || status === 'active'
}

export function getPlanLimits(planId: PlanId, status: SubscriptionStatus): PlanLimits {
  if (!isActiveSubscription(status)) {
    // Просроченная/отменённая подписка — минимальные лимиты free
    return PLAN_LIMITS.free
  }
  return PLAN_LIMITS[planId] ?? PLAN_LIMITS.free
}
export interface PlanDisplay {
  id: PlanId
  name: string
  description: string
  priceMonthly: number // ₽/мес при помесячной оплате, 0 для free
  priceYearly: number  // ₽/мес при оплате за год
  features: string[]
  highlighted?: boolean
}

export const PLAN_DISPLAY: Record<PlanId, PlanDisplay> = {
  free: {
    id: 'free',
    name: 'Бесплатно',
    description: '14 дней, чтобы попробовать Aptio без риска',
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      'До 2 мастеров',
      'До 10 услуг',
      'До 5 фото в галерее',
      'Онлайн-запись клиентов',
      'Базовая статистика',
    ],
  },
  base: {
    id: 'base',
    name: 'Базовый',
    description: 'Для салона с постоянным потоком клиентов',
    priceMonthly: 1590,
    priceYearly: 1290,
    features: [
      'До 8 мастеров',
      'Безлимит услуг',
      'До 20 фото в галерее',
      'Складской учёт',
      'Полная статистика и отчёты',
      'Управление командой',
    ],
  },
  premium: {
    id: 'premium',
    name: 'Премиум',
    description: 'Для сети салонов и своего бренда',
    priceMonthly: 3690,
    priceYearly: 2990,
    features: [
      'Безлимит мастеров',
      'Безлимит услуг',
      'Безлимит фото в галерее',
      'Свой домен (white-label)',
      'Кастомизация темы',
      'Приоритетная поддержка',
    ],
    highlighted: true,
  },
}