import { get, post, route } from 'remix/fetch-router/routes'

export const routes = route({
  assets: get('/assets/*path'),
  home: '/',
  auth: '/auth',
  dashboard: '/dashboard',
  events: '/events',
  attendance: '/attendance',
  admin: '/admin',
})
