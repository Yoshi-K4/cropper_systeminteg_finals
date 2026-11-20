<template>
  <v-container class="py-8" style="max-width: 820px;">
    <div v-if="user">
      <!-- Welcome / Dashboard Header -->
      <div class="mb-5">
        <h1 class="text-h5 font-weight-bold">Dashboard</h1>
        <div class="text-body-2 text-medium-emphasis">
          Welcome back,  Choose a tool or check your saved images.
        </div>
      </div>

      <!-- Summary Row (Saved Cropped Images only) -->
      <v-row class="mb-4">
        <v-col cols="12">
          <v-card variant="outlined" rounded="xl" class="pa-4">
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-caption text-medium-emphasis">Saved Cropped Images</div>
                <div class="text-h4 font-weight-bold mt-1">{{ savedImagesCount }}</div>
              </div>
              <v-avatar color="blue-lighten-5" size="44" rounded="lg">
                <v-icon icon="mdi-image-multiple-outline" color="primary" />
              </v-avatar>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Module Cards (Cropper & Saved Images only) -->
      <v-row>
        <v-col cols="12" sm="6">
          <v-card
            rounded="xl"
            elevation="1"
            class="dash-card pa-4 h-100 d-flex flex-column"
            @click="navigateTo('/cropper')"
          >
            <v-icon icon="mdi-crop" color="primary" size="28" class="mb-3" />
            <div class="text-subtitle-1 font-weight-bold mb-1">Image Cropper</div>
            <div class="text-caption text-medium-emphasis mb-4">
              Upload and crop photos cleanly.
            </div>
            <v-btn
              variant="tonal"
              color="primary"
              size="small"
              rounded="lg"
              class="mt-auto"
              append-icon="mdi-arrow-right"
            >
              Open Cropper
            </v-btn>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6">
          <v-card
            rounded="xl"
            elevation="1"
            class="dash-card pa-4 h-100 d-flex flex-column"
            @click="navigateTo('/saved_image')"
          >
            <v-icon icon="mdi-folder-image" color="teal" size="28" class="mb-3" />
            <div class="text-subtitle-1 font-weight-bold mb-1">Saved Images</div>
            <div class="text-caption text-medium-emphasis mb-4">
              View, preview, or download saved crops.
            </div>
            <v-btn
              variant="tonal"
              color="teal"
              size="small"
              rounded="lg"
              class="mt-auto"
              append-icon="mdi-arrow-right"
            >
              View Gallery
            </v-btn>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script setup lang="ts">
//@ts-nocheck
import { ref, computed, onMounted } from 'vue'

const user = ref<any>(null)
const savedImagesCount = ref(0)

const displayName = computed(() => {
  if (!user.value || typeof user.value !== 'object') return 'User'
  return (
    user.value.name ||
    user.value.fullName ||
    user.value.given_name ||
    user.value.email ||
    'User'
  )
})

onMounted(() => {
  if (!import.meta.client) return

  const savedUser =
    localStorage.getItem('google_user') || localStorage.getItem('user')

  if (savedUser) {
    try {
      const parsed = JSON.parse(savedUser)
      user.value = parsed && typeof parsed === 'object' ? parsed : { name: 'User' }
    } catch {
      user.value = { name: 'User' }
    }
  } else {
    user.value = { name: 'User' }
  }

  const storedImages = localStorage.getItem('croppedImages')
  if (storedImages) {
    try {
      const parsed = JSON.parse(storedImages)
      savedImagesCount.value = Array.isArray(parsed) ? parsed.length : 0
    } catch {
      savedImagesCount.value = 0
    }
  }
})
</script>

<style scoped>
.dash-card {
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.dash-card:hover {
  transform: translateY(-3px);
}
</style>