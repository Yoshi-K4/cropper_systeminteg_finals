<template>
  <v-app class="cropper-app">
    <v-main class="cropper-background">
      <v-container class="fill-height d-flex align-center justify-center px-4">
        <v-card
          width="420"
          max-width="100%"
          class="pa-7 pa-sm-8 rounded-2xl cropper-card"
          elevation="12"
        >
          <!-- Brand Header -->
          <div class="text-center mb-6">
            <v-avatar size="56" color="grey-darken-4" class="mb-3 brand-badge">
              <v-icon icon="mdi-crop" size="28" color="white" />
            </v-avatar>
            <h1 class="text-h5 font-weight-bold mb-1">Cropper</h1>
          </div>

          <!-- Error Alert -->
          <v-alert
            v-if="errorMessage"
            type="error"
            variant="tonal"
            density="compact"
            rounded="lg"
            closable
            class="mb-4 text-body-2"
            @click:close="errorMessage = ''"
          >
            {{ errorMessage }}
          </v-alert>

          <!-- Username & Password Form -->
          <v-form ref="formRef" @submit.prevent="loginWithCredentials">
            <v-text-field
              v-model="username"
              label="Username or Email"
              prepend-inner-icon="mdi-account-outline"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              :rules="[rules.required]"
              :disabled="isSubmitting || isGoogleLoading"
              class="mb-3"
            />

            <v-text-field
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              label="Password"
              prepend-inner-icon="mdi-lock-outline"
              :append-inner-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              :rules="[rules.required]"
              :disabled="isSubmitting || isGoogleLoading"
              class="mb-4"
              @click:append-inner="showPassword = !showPassword"
            />

            <v-btn
              type="submit"
              block
              size="large"
              height="48"
              rounded="lg"
              color="grey-darken-4"
              variant="flat"
              class="text-none font-weight-medium primary-btn"
              :loading="isSubmitting"
              :disabled="isSubmitting || isGoogleLoading"
            >
              {{ isSubmitting ? 'Nagla-log in...' : 'Sign In' }}
            </v-btn>
          </v-form>

          <!-- Divider -->
          <div class="d-flex align-center my-5">
            <v-divider />
            <span class="px-3 text-caption text-medium-emphasis text-uppercase">
              or
            </span>
            <v-divider />
          </div>

          <!-- Other Choice: Sign in with Google -->
          <v-btn
            block
            size="large"
            height="48"
            rounded="lg"
            color="grey-darken-4"
            variant="outlined"
            class="text-none font-weight-medium"
            :loading="isGoogleLoading"
            :disabled="isSubmitting || isGoogleLoading"
            @click="loginWithGoogle"
          >
            <template #prepend>
              <v-icon icon="mdi-google" size="20" class="mr-1" />
            </template>
            {{ isGoogleLoading ? 'Kumokonekta sa Google...' : 'Sign in with Google' }}
          </v-btn>

          
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
// @ts-nocheck

definePageMeta({
  layout: false
})

const config = useRuntimeConfig()
const googleClientId = config.public.googleClientId

const formRef = ref<any>(null)
const username = ref('')
const password = ref('')
const showPassword = ref(false)
const isSubmitting = ref(false)
const isGoogleLoading = ref(false)
const errorMessage = ref('')

const rules = {
  required: (value: string) => Boolean(value && value.trim()) || 'Kinakailangan ang field na ito.'
}

const cropperSession = useState('cropper_session', () => {
  if (import.meta.client) {
    const savedUser = localStorage.getItem('cropper_user')
    const savedToken = localStorage.getItem('cropper_token')
    return {
      user: savedUser ? JSON.parse(savedUser) : null,
      token: savedToken || null
    }
  }
  return { user: null, token: null }
})

declare global {
  interface Window {
    google: any
  }
}

const saveCropperSession = (userInfo: any, token: string, provider: 'local' | 'google') => {
  const normalizedUser = {
    ...userInfo,
    provider
  }

  localStorage.setItem('cropper_user', JSON.stringify(normalizedUser))
  localStorage.setItem('cropper_token', token)

  cropperSession.value = {
    user: normalizedUser,
    token
  }

  window.dispatchEvent(
    new CustomEvent('cropper-session-updated', {
      detail: { user: normalizedUser, token }
    })
  )
}

// 1. Username & Password Login
const loginWithCredentials = async () => {
  errorMessage.value = ''

  const validation = await formRef.value?.validate()
  if (!validation?.valid) return

  isSubmitting.value = true

  try {
    // Kung may backend API ka, palitan ito ng $fetch('/api/auth/login', { method: 'POST', body: { username: username.value, password: password.value } })
    const cleanUsername = username.value.trim()
    const isEmail = cleanUsername.includes('@')

    const localUser = {
      sub: `local-${Date.now()}`,
      name: isEmail ? cleanUsername.split('@')[0] : cleanUsername,
      email: isEmail ? cleanUsername : `${cleanUsername}@cropper.local`,
      picture: '/raf.jpg'
    }

    const sessionToken = `cropper_local_${btoa(unescape(encodeURIComponent(cleanUsername))).slice(0, 24)}_${Date.now()}`

    saveCropperSession(localUser, sessionToken, 'local')
    await navigateTo('/', { replace: true })
  } catch (error: any) {
    console.error('Credential login error:', error)
    errorMessage.value = error?.data?.message || 'Hindi tugma ang username o password.'
  } finally {
    isSubmitting.value = false
  }
}

// 2. Google Login
const loginWithGoogle = () => {
  errorMessage.value = ''

  if (!googleClientId) {
    errorMessage.value = 'Missing Google Client ID. Pakicheck ang environment variables.'
    return
  }

  if (!window.google?.accounts?.oauth2) {
    errorMessage.value = 'Hindi pa handa ang Google login. Paki-refresh ang page.'
    return
  }

  isGoogleLoading.value = true

  const client = window.google.accounts.oauth2.initTokenClient({
    client_id: googleClientId,
    scope: 'openid email profile',
    callback: async (response: any) => {
      if (response.error) {
        isGoogleLoading.value = false
        errorMessage.value = `Google authentication failed: ${response.error}`
        return
      }

      try {
        const userInfo = await $fetch(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: {
              Authorization: `Bearer ${response.access_token}`
            }
          }
        )

        saveCropperSession(userInfo, response.access_token, 'google')
        await navigateTo('/', { replace: true })
      } catch (error) {
        console.error('Cropper user info error:', error)
        errorMessage.value = 'Hindi makuha ang impormasyon ng iyong Google account.'
      } finally {
        isGoogleLoading.value = false
      }
    }
  })

  client.requestAccessToken()
}
</script>

<style scoped>
.cropper-app,
.cropper-background {
  min-height: 100vh;
  background: radial-gradient(circle at top, #ffffff 0%, #ffffff 70%) !important;
}

.cropper-card {
  background-color: #ffffff !important;
  color: #111827 !important;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.brand-badge {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.16);
}

.primary-btn {
  letter-spacing: 0.2px;
}
</style>

<style>
html,
body,
#__nuxt {
  min-height: 100%;
  margin: 0;
  background-color: #050505;
}
</style>