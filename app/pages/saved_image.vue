<script lang="ts" setup>
import { ref, onMounted } from 'vue'

const savedImagesState = useState<string[]>('croppedImages', () => [])
const croppedImages = ref<string[]>([...savedImagesState.value])

const previewDialog = ref(false)
const previewSrc = ref('')
const previewTitle = ref('')

const syncImages = (list: string[]) => {
  croppedImages.value = list
  savedImagesState.value = list
  if (import.meta.client) {
    localStorage.setItem('croppedImages', JSON.stringify(list))
  }
}

onMounted(() => {
  const stored = localStorage.getItem('croppedImages')
  if (stored) {
    try {
      const parsed: string[] = JSON.parse(stored)
      croppedImages.value = parsed
      savedImagesState.value = parsed
    } catch {
      croppedImages.value = []
    }
  }
})

const backToCropper = async () => {
  await navigateTo('/cropper')
}

const deleteImage = (index: number) => {
  const updated = croppedImages.value.filter((_, i) => i !== index)
  syncImages(updated)
}

const clearSavedImages = () => {
  croppedImages.value = []
  savedImagesState.value = []
  if (import.meta.client) {
    localStorage.removeItem('croppedImages')
  }
}

const openPreview = (imgSrc: string, label: string) => {
  previewSrc.value = imgSrc
  previewTitle.value = label
  previewDialog.value = true
}
</script>

<template>
  <v-container class="py-8" style="max-width: 1080px;">
    <!-- Header & Action Buttons -->
    <div class="d-flex flex-column flex-sm-row justify-space-between align-sm-center ga-4 mb-6">
      <div>
        <div class="d-flex align-center ga-2 mb-1">
          <h1 class="text-h5 text-sm-h4 font-weight-bold">Saved Cropped Images</h1>
          <v-chip
            size="small"
            color="primary"
            variant="tonal"
          >
            {{ croppedImages.length }} {{ croppedImages.length === 1 ? 'item' : 'items' }}
          </v-chip>
        </div>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Manage, preview, or download your cropped images stored locally.
        </p>
      </div>

      <div class="d-flex ga-2 flex-wrap">
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-crop"
          rounded="lg"
          @click="backToCropper"
        >
          Crop Another Image
        </v-btn>

        <v-btn
          v-if="croppedImages.length > 0"
          color="error"
          variant="tonal"
          prepend-icon="mdi-delete-sweep-outline"
          rounded="lg"
          @click="clearSavedImages"
        >
          Clear All
        </v-btn>
      </div>
    </div>

    <!-- Gallery Grid -->
    <v-row v-if="croppedImages.length > 0">
      <v-col
        v-for="(imgSrc, index) in croppedImages"
        :key="index"
        cols="12"
        sm="6"
        md="4"
      >
        <v-card
          rounded="lg"
          elevation="2"
          class="gallery-card d-flex flex-column h-100"
        >
          <!-- Card Top Label -->
          <div class="d-flex justify-space-between align-center px-4 pt-3 pb-2">
            <div class="d-flex align-center ga-2">
              <span class="text-subtitle-2 font-weight-bold">
                Image #{{ croppedImages.length - index }}
              </span>
              <v-chip
                v-if="index === 0"
                size="x-small"
                color="success"
                variant="tonal"
              >
                Latest
              </v-chip>
            </div>

            <v-btn
              icon="mdi-delete-outline"
              variant="text"
              size="small"
              color="error"
              title="Delete image"
              @click="deleteImage(index)"
            />
          </div>

          <!-- Image Preview Box -->
          <div
            class="image-box mx-4 pa-2 rounded-lg d-flex align-center justify-center"
            @click="openPreview(imgSrc, `Image #${croppedImages.length - index}`)"
            title="Click to preview"
          >
            <img
              :src="imgSrc"
              :alt="`Cropped image ${index + 1}`"
              class="preview-img"
            />
          </div>

          <!-- Card Footer Actions -->
          <div class="d-flex justify-space-between align-center px-4 py-3 mt-auto">
            <v-btn
              variant="text"
              size="small"
              prepend-icon="mdi-eye-outline"
              @click="openPreview(imgSrc, `Image #${croppedImages.length - index}`)"
            >
              Preview
            </v-btn>

            <v-btn
              :href="imgSrc"
              :download="`cropped-image-${croppedImages.length - index}.png`"
              variant="tonal"
              color="primary"
              size="small"
              prepend-icon="mdi-download"
              rounded="md"
            >
              Download
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-sheet
      v-else
      border
      rounded="xl"
      class="pa-10 text-center bg-grey-lighten-5"
    >
      <v-icon
        icon="mdi-image-off-outline"
        size="52"
        color="grey"
        class="mb-3"
      />
      <div class="text-h6 font-weight-bold mb-1">No image has been saved yet</div>
      <div class="text-body-2 text-medium-emphasis mb-0">
        Start cropping a photo and your saved results will appear here.
      </div>
    </v-sheet>

    <!-- Full Preview Dialog -->
    <v-dialog v-model="previewDialog" max-width="680">
      <v-card rounded="lg" class="pa-4">
        <div class="d-flex justify-space-between align-center mb-3">
          <div class="text-subtitle-1 font-weight-bold">{{ previewTitle }}</div>
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            @click="previewDialog = false"
          />
        </div>

        <div class="d-flex justify-center align-center bg-grey-lighten-4 rounded-lg pa-3">
          <img
            :src="previewSrc"
            :alt="previewTitle"
            style="max-width: 100%; max-height: 65vh; object-fit: contain; border-radius: 6px;"
          />
        </div>

        <div class="d-flex justify-end ga-2 mt-4">
          <v-btn
            :href="previewSrc"
            :download="`${previewTitle.toLowerCase().replace(/\s+/g, '-')}.png`"
            color="primary"
            variant="flat"
            prepend-icon="mdi-download"
            rounded="lg"
          >
            Download Image
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.gallery-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.gallery-card:hover {
  transform: translateY(-3px);
}

.image-box {
  height: 210px;
  background: repeating-conic-gradient(#f1f5f9 0% 25%, #ffffff 0% 50%) 50% / 16px 16px;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  overflow: hidden;
}

.preview-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 4px;
}
</style>