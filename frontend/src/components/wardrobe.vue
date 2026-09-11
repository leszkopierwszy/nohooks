<template>
  <div class="avatar-builder">
    <input type="file" accept="image/*" @change="handleUpload" />

    <canvas ref="canvasRef" width="400" height="600"></canvas>

    <div v-if="avatar">
      <p>Height ratio: {{ avatar.heightRatio }}</p>
      <p>Shoulder width: {{ avatar.shoulderWidth }}</p>
      <p>Waist width: {{ avatar.waistWidth }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const canvasRef = ref(null)
const avatar = ref(null)

async function handleUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  const image = await loadImage(file)

  // 1. Tu później: remove background / segmentation
  // 2. Tu później: MediaPipe pose detection
  // 3. Na start robimy mock proporcji

  const bodyModel = {
    heightRatio: 1,
    shoulderWidth: 0.42,
    waistWidth: 0.32,
    hipWidth: 0.38,
    pose: 'front'
  }

  avatar.value = bodyModel

  drawSimpleAvatar(bodyModel)
}

function loadImage(file) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.src = URL.createObjectURL(file)
  })
}

function drawSimpleAvatar(model) {
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // head
  ctx.beginPath()
  ctx.arc(200, 90, 35, 0, Math.PI * 2)
  ctx.stroke()

  // torso
  ctx.beginPath()
  ctx.moveTo(200 - model.shoulderWidth * 180, 140)
  ctx.lineTo(200 + model.shoulderWidth * 180, 140)
  ctx.lineTo(200 + model.waistWidth * 180, 300)
  ctx.lineTo(200 - model.waistWidth * 180, 300)
  ctx.closePath()
  ctx.stroke()

  // hips
  ctx.beginPath()
  ctx.moveTo(200 - model.waistWidth * 180, 300)
  ctx.lineTo(200 + model.waistWidth * 180, 300)
  ctx.lineTo(200 + model.hipWidth * 180, 380)
  ctx.lineTo(200 - model.hipWidth * 180, 380)
  ctx.closePath()
  ctx.stroke()
}
</script>