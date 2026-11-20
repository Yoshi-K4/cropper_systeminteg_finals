export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const rawUser = localStorage.getItem('cropper_user')
  let isAuthenticated = false

  if (rawUser && rawUser !== 'undefined' && rawUser !== 'null') {
    try {
      const parsedUser = JSON.parse(rawUser)
      isAuthenticated = Boolean(parsedUser && (parsedUser.sub || parsedUser.email))
    } catch {
      isAuthenticated = false
    }
  }

  if (to.path === '/login' && isAuthenticated) {
    return navigateTo('/')
  }

  if (to.path !== '/login' && !isAuthenticated) {
    return navigateTo('/login')
  }
})