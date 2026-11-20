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
      croppedImages.value = Array.isArray(parsed) ? parsed : []
      savedImagesState.value = croppedImages.value
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
  <div class="editor-page">
    <div class="editor-container">
      <!-- Top Header Card (Katulad ng sa Image Cropper) -->
      <header class="top-bar">
        <div>
          <h1 class="title">Saved Cropped Images</h1>
          <p class="subtitle">
            Manage, preview, or download your cropped images ({{ croppedImages.length }}).
          </p>
        </div>

        <div class="header-actions">
          <button type="button" class="btn btn-outline" @click="backToCropper">
            Crop Another Image
          </button>

          <button
            v-if="croppedImages.length > 0"
            type="button"
            class="btn btn-danger-outline"
            @click="clearSavedImages"
          >
            Clear All
          </button>
        </div>
      </header>

      <!-- Gallery Card (Kapag may saved images) -->
      <section v-if="croppedImages.length > 0" class="card">
        <div class="card-header">
          <h2>Saved Images</h2>
        </div>

        <div class="gallery-grid">
          <div
            v-for="(imgSrc, index) in croppedImages"
            :key="index"
            class="item-card"
          >
            <div class="item-top">
              <span class="item-label">
                Image #{{ croppedImages.length - index }}
                <span v-if="index === 0" class="latest-tag">(Latest)</span>
              </span>

              <button
                type="button"
                class="icon-btn"
                title="Delete image"
                @click="deleteImage(index)"
              >
                <v-icon icon="mdi-delete-outline" size="18" color="error" />
              </button>
            </div>

            <div
              class="image-box"
              title="Click to preview"
              @click="openPreview(imgSrc, `Image #${croppedImages.length - index}`)"
            >
              <img
                :src="imgSrc"
                :alt="`Cropped image ${index + 1}`"
                class="preview-img"
              />
            </div>

            <div class="item-actions">
              <button
                type="button"
                class="btn btn-outline btn-sm"
                @click="openPreview(imgSrc, `Image #${croppedImages.length - index}`)"
              >
                Preview
              </button>

              <a
                :href="imgSrc"
                :download="`cropped-image-${croppedImages.length - index}.png`"
                class="btn btn-outline btn-sm btn-link"
              >
                Download
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- Empty State Card (Kapag walang saved image) -->
      <section v-else class="card">
        <div class="card-header">
          <h2>Saved Images</h2>
        </div>

        <div class="empty-box">
          <div class="empty-title">No image has been saved yet</div>
          <div class="empty-hint">
            Start cropping a photo and your saved results will appear here.
          </div>
        </div>
      </section>
    </div>

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

        <div class="modal-image-box">
          <img
            :src="previewSrc"
            :alt="previewTitle"
            class="modal-preview-img"
          />
        </div>

        <div class="d-flex justify-end ga-2 mt-4">
          <v-btn
            :href="previewSrc"
            :download="`${previewTitle.toLowerCase().replace(/\s+/g, '-')}.png`"
            variant="outlined"
            rounded="lg"
          >
            Download Image
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.editor-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
  padding: 32px 16px;
  color: #0f172a;
}

.editor-container {
  max-width: 860px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px 24px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.title {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.subtitle {
  margin: 6px 0 0;
  color: #475569;
  font-size: 14px;
}

.card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px 24px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.empty-box {
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  padding: 28px 20px;
  text-align: center;
  background: #f8fafc;
}

.empty-title {
  font-weight: 600;
  font-size: 15px;
  color: #1e293b;
}

.empty-hint {
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 16px;
}

.item-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.item-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-label {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.latest-tag {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  margin-left: 4px;
}

.icon-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  background: #fef2f2;
}

.image-box {
  height: 190px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
}

.preview-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 6px;
}

.item-actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #1e293b;
}

.btn:hover {
  background: #f1f5f9;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
  border-radius: 8px;
  flex: 1;
}

.btn-link {
  text-decoration: none;
}

.btn-danger-outline {
  border-color: #fecaca;
  color: #dc2626;
}

.btn-danger-outline:hover {
  background: #fef2f2;
}

.modal-image-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-preview-img {
  max-width: 100%;
  max-height: 65vh;
  object-fit: contain;
  border-radius: 6px;
}
</style>