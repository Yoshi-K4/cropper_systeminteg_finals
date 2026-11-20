<template>
  <v-app>
    <!-- Navigation Drawer -->
    <v-navigation-drawer
      v-model="drawer"
      color="black"
      temporary
    >
      <v-list>
        <v-list-item
          :prepend-avatar="userPicture"
          :subtitle="userEmail"
          :title="userName"
        ></v-list-item>
      </v-list>

      <v-divider></v-divider>

      <v-list density="compact" nav>
        <v-list-item
          prepend-icon="mdi-view-dashboard"
          title="Dashboard"
          to="/"
          @click="drawer = false"
        ></v-list-item>

        <v-list-item
          prepend-icon="mdi-image-check"
          title="Saved Images"
          to="/saved_image"
          @click="drawer = false"
        ></v-list-item>

        <v-list-item
          prepend-icon="mdi-image-edit"
          title="Cropper"
          to="/cropper"
          @click="drawer = false"
        ></v-list-item>
      </v-list>

      <!-- Logout Section sa ibaba ng Drawer -->
      <template v-slot:append>
        <v-divider></v-divider>
        <div class="pa-3">
          <v-btn
            block
            color="error"
            variant="tonal"
            prepend-icon="mdi-logout"
            :loading="isLoggingOut"
            @click="logout"
          >
            Logout
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- App Bar -->
    <v-app-bar color="black" elevation="1">
      <template v-slot:prepend>
        <v-app-bar-nav-icon
          class="hover-icon"
          @click="drawer = !drawer"
        ></v-app-bar-nav-icon>
      </template>

      <v-app-bar-title>Cropper</v-app-bar-title>
    </v-app-bar>

    <!-- Main Content -->
    <v-main>
      <slot />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const drawer = ref(false)
const isLoggingOut = ref(false)

// Default account information
const userName = ref('Guest User')
const userEmail = ref('No email available')
const userPicture = ref('/raf.jpg')

const resetUserState = () => {
  userName.value = 'Guest User'
  userEmail.value = 'No email available'
  userPicture.value = '/raf.jpg'
}

// Load logged-in Cropper / Google account
const loadUser = () => {
  const savedUser =
    localStorage.getItem('cropper_user') || localStorage.getItem('google_user')

  if (savedUser) {
    try {
      const user = JSON.parse(savedUser)

      userName.value =
        user.name ||
        user.displayName ||
        user.given_name ||
        'Guest User'

      userEmail.value =
        user.email ||
        'No email available'

      userPicture.value =
        user.picture ||
        user.avatar ||
        user.image ||
        '/raf.jpg'
    } catch (error) {
      console.error('Error loading Cropper user:', error)
      resetUserState()
    }
  } else {
    resetUserState()
  }
}

const logout = async () => {
  if (isLoggingOut.value) return
  isLoggingOut.value = true

  try {
    const token =
      localStorage.getItem('cropper_token') || localStorage.getItem('google_token')

    // Optional: revoke Google OAuth token kung available
    if (token && window.google?.accounts?.oauth2?.revoke) {
      await new Promise<void>((resolve) => {
        window.google.accounts.oauth2.revoke(token, () => {
          resolve()
        })
      })
    }
  } catch (error) {
    console.warn('Token revoke skipped/failed:', error)
  } finally {
    // Linisin ang Cropper at lumang Google keys
    localStorage.removeItem('cropper_user')
    localStorage.removeItem('cropper_token')
    localStorage.removeItem('google_user')
    localStorage.removeItem('google_token')

    const cropperSession = useState('cropper_session', () => ({
      user: null,
      token: null
    }))
    cropperSession.value = { user: null, token: null }

    resetUserState()
    drawer.value = false

    window.dispatchEvent(new Event('cropper-session-updated'))
    window.dispatchEvent(new Event('google-user-updated'))

    await navigateTo('/login', { replace: true })
    isLoggingOut.value = false
  }
}

// Listen for successful login or logout
const handleUserUpdate = () => {
  loadUser()
}

// Listen for account changes in other tabs
const handleStorageChange = (event: StorageEvent) => {
  if (event.key === 'cropper_user' || event.key === 'google_user') {
    loadUser()
  }
}

onMounted(() => {
  loadUser()

  window.addEventListener('cropper-session-updated', handleUserUpdate)
  window.addEventListener('google-user-updated', handleUserUpdate)
  window.addEventListener('storage', handleStorageChange)
})

onBeforeUnmount(() => {
  window.removeEventListener('cropper-session-updated', handleUserUpdate)
  window.removeEventListener('google-user-updated', handleUserUpdate)
  window.removeEventListener('storage', handleStorageChange)
})
</script>

<style scoped>
.hover-icon {
  border-radius: 50%;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.hover-icon:hover {
  background-color: rgba(255, 255, 255, 0.1);
  transform: scale(1.08);
}
</style>