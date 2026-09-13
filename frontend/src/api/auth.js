import { apiRequest } from './client'

export function loginRequest({ email, password }) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function registerRequest(payload) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function logoutRequest() {
  return apiRequest('/auth/logout', { method: 'POST' })
}

export function meRequest() {
  return apiRequest('/auth/me')
}

export function updateProfileRequest(payload) {
  return apiRequest('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function updatePasswordRequest(payload) {
  return apiRequest('/auth/password', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}
