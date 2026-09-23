import { apiRequest } from './client'

export function fetchSiteConfig() {
  return apiRequest('/config')
}
