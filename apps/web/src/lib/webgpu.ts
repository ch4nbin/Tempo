/**
 * WebGPU utilities and initialization
 */

export interface WebGPUContext {
  device: GPUDevice
  context: GPUCanvasContext
  format: GPUTextureFormat
  canvas: HTMLCanvasElement
}

export async function initWebGPU(canvas: HTMLCanvasElement): Promise<WebGPUContext | null> {
  // Check for WebGPU support
  if (!navigator.gpu) {
    console.warn('WebGPU not supported, falling back to WebGL')
    return null
  }

  const adapter = await navigator.gpu.requestAdapter()
  if (!adapter) {
    console.warn('No GPU adapter found')
    return null
  }

  const device = await adapter.requestDevice()
  const context = canvas.getContext('webgpu')
  
  if (!context) {
    console.warn('Could not get WebGPU context')
    return null
  }

  const format = navigator.gpu.getPreferredCanvasFormat()
  
  context.configure({
    device,
    format,
    alphaMode: 'premultiplied',
  })

  return { device, context, format, canvas }
}

export function createShaderModule(device: GPUDevice, code: string): GPUShaderModule {
  return device.createShaderModule({ code })
}

