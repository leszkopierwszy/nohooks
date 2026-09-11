import { apiRequest } from './client'

/**
 * Pobiera metadane produktu ze strony sklepu (serwer → product-parser w Dockerze).
 * @returns {Promise<{
 *   source_url: string,
 *   name?: string|null,
 *   brand?: string|null,
 *   description?: string|null,
 *   color?: string|null,
 *   size?: string|null,
 *   category?: string|null,
 *   season?: string|null,
 *   purchase_price?: number|null,
 *   purchase_currency?: string|null,
 *   current_value?: number|null,
 *   image_urls?: string[],
 * }>}
 */
/**
 * @param {object} [options]
 * @param {boolean} [options.isFootwear]
 * @param {'footwear'|'clothing'|'accessories'|null} [options.productClassHint]
 */
export function parseProductFromUrl(
  url,
  { isFootwear = false, productClassHint = null, traceId = null } = {}
) {
  const body = {
    url: url.trim(),
    is_footwear: Boolean(isFootwear),
  }
  if (productClassHint) {
    body.product_class_hint = productClassHint
  }
  if (traceId) {
    body.trace_id = traceId
  }
  return apiRequest('/product-import/parse', {
    method: 'POST',
    timeoutMs: 180000,
    headers: traceId ? { 'X-Langfuse-Trace-Id': traceId } : {},
    body: JSON.stringify(body),
  })
}

export function reportImportImageSelection(payload) {
  return apiRequest('/product-import/selection', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
