<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue'

const imageSrc = ref<string>('')
const fileName = ref<string>('')
const croppedResultUrl = ref<string>('')
const selectionRef = ref<any>(null)
const canvasRef = ref<any>(null)

const savedImagesState = useState<string[]>('croppedImages', () => [])

const syncSavedCount = () => {
  if (!import.meta.client) return
  const existingRaw = localStorage.getItem('croppedImages')
  if (existingRaw) {
    try {
      const parsed: string[] = JSON.parse(existingRaw)
      savedImagesState.value = parsed
    } catch {
      savedImagesState.value = []
    }
  }
}

onMounted(async () => {
  await import('cropperjs')
  syncSavedCount()
})

const savedCount = computed(() => savedImagesState.value.length)

const onFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  fileName.value = file.name
  croppedResultUrl.value = ''
  imageSrc.value = URL.createObjectURL(file)
}

const handleCropImage = async () => {
  const target = selectionRef.value || canvasRef.value
  if (!target || typeof target.$toCanvas !== 'function') return

  const canvas: HTMLCanvasElement = await target.$toCanvas()
  const dataUrl = canvas.toDataURL('image/png')
  croppedResultUrl.value = dataUrl

  if (import.meta.client) {
    const existingRaw = localStorage.getItem('croppedImages')
    const existingList: string[] = existingRaw ? JSON.parse(existingRaw) : []
    const updatedList = [dataUrl, ...existingList]

    savedImagesState.value = updatedList
    localStorage.setItem('croppedImages', JSON.stringify(updatedList))
  } else {
    savedImagesState.value = [dataUrl, ...savedImagesState.value]
  }
}

const goToSavedPage = async () => {
  await navigateTo('/saved_image')
}
</script>

<template>
  <div class="editor-page">
    <div class="editor-container">
      <!-- Top Header -->
      <header class="top-bar">
        <div>
          
          <h1 class="title">Image Cropper</h1>
          <p class="subtitle">
            Select an image, adjust the crop box, and save the result.
          </p>
        </div>

        <button type="button" class="btn btn-outline" @click="goToSavedPage">
          Saved Images
          <span v-if="savedCount > 0" class="count-pill">{{ savedCount }}</span>
        </button>
      </header>

      <!-- Step 1: Select Image -->
      <section class="card">
        <div class="card-header">
          <h2>Select Image</h2>
        </div>

        <label class="upload-box">
          <input
            type="file"
            accept="image/*"
            class="file-input"
            @change="onFileChange"
          />
          <div class="upload-content">
            <span class="upload-title">
              {{ fileName ? 'Palitan ang napiling larawan' : 'Click to select an image' }}
            </span>
            <span class="upload-hint">
              {{ fileName ? `Napili: ${fileName}` : 'Supports PNG, JPG, WEBP, and others' }}
            </span>
          </div>
        </label>
      </section>

      <!-- Step 2: Crop Selected Image -->
      <section v-if="imageSrc" class="card">
        <div class="card-header">
          
          <h2>Adjust &amp; Crop Image</h2>
        </div>

        <p class="helper-text">
          Drag the selection box to choose an area, pull the edges to resize, or move/zoom the image.
        </p>

        <div class="cropper-wrapper">
          <cropper-canvas
            ref="canvasRef"
            background
            class="cropper-canvas-box"
          >
            <cropper-image
              :src="imageSrc"
              alt="Selected image"
              initial-fit="contain"
              rotatable
              scalable
              translatable
            />
            <cropper-handle action="move" plain />
            <cropper-selection
              ref="selectionRef"
              initial-coverage="0.5"
              movable
              resizable
            >
              <cropper-grid role="grid" covered />
              <cropper-crosshair centered />
              <cropper-handle action="select" plain />
              <cropper-handle action="n-resize" />
              <cropper-handle action="e-resize" />
              <cropper-handle action="s-resize" />
              <cropper-handle action="w-resize" />
              <cropper-handle action="ne-resize" />
              <cropper-handle action="nw-resize" />
              <cropper-handle action="se-resize" />
              <cropper-handle action="sw-resize" />
            </cropper-selection>
          </cropper-canvas>
        </div>

        <div class="actions-row">
          <button type="button" class="btn btn-primary" @click="handleCropImage">
            Crop &amp; Save Image
          </button>

          <button
            v-if="croppedResultUrl"
            type="button"
            class="btn btn-secondary"
            @click="goToSavedPage"
          >
            Open Saved Image Page
          </button>
        </div>
      </section>

      <!-- Step 3: Show Cropped Result -->
      <section v-if="croppedResultUrl" class="card result-card">
        <div class="card-header">
          
          <h2>Cropped Result</h2>
        </div>

        <div class="result-preview-box">
          <img
            :src="croppedResultUrl"
            alt="Cropped result"
            class="result-image"
          />
        </div>

        <div class="actions-row">
          <a
            :href="croppedResultUrl"
            download="cropped-image.png"
            class="btn btn-primary btn-link"
          >
            Download Cropped Image
          </a>

          <button type="button" class="btn btn-outline" @click="goToSavedPage">
            View All Saved ({{ savedCount }})
          </button>
        </div>
      </section>
    </div>
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

.badge {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  color: #4338ca;
  background: #e0e7ff;
  padding: 4px 10px;
  border-radius: 999px;
  margin-bottom: 8px;
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

.step-tag {
  font-size: 12px;
  font-weight: 700;
  color: #1d4ed8;
  background: #dbeafe;
  padding: 4px 10px;
  border-radius: 999px;
}

.step-tag-success {
  color: #047857;
  background: #d1fae5;
}

.helper-text {
  margin: 0 0 14px;
  font-size: 14px;
  color: #475569;
}

.upload-box {
  display: block;
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  background: #f8fafc;
  transition: all 0.2s ease;
}

.upload-box:hover {
  border-color: #4f46e5;
  background: #eef2ff;
}

.file-input {
  display: none;
}

.upload-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.upload-title {
  font-weight: 600;
  font-size: 15px;
  color: #1e293b;
}

.upload-hint {
  font-size: 13px;
  color: #64748b;
}

.cropper-wrapper {
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  overflow: hidden;
  background: #0f172a;
}

.cropper-canvas-box {
  height: 400px;
  width: 100%;
  display: block;
}

.actions-row {
  margin-top: 16px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
  border: 1px solid transparent;
}

.btn-link {
  text-decoration: none;
}

.btn-primary {
  background: #4f46e5;
  color: #ffffff;
}

.btn-primary:hover {
  background: #4338ca;
}

.btn-secondary {
  background: #0f172a;
  color: #ffffff;
}

.btn-secondary:hover {
  background: #1e293b;
}

.btn-outline {
  background: #ffffff;
  color: #1e293b;
  border-color: #cbd5e1;
}

.btn-outline:hover {
  background: #f1f5f9;
}

.count-pill {
  background: #4f46e5;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
}

.result-preview-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.result-image {
  max-width: 100%;
  max-height: 360px;
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.08);
}
</style>