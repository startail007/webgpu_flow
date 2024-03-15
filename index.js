import Shader from "./Shader.js";
import Geometry from "./Geometry.js";
import Texture from "./Texture.js";
import { require } from "./fun.js";

const initGPU = async () => {
  if (!navigator.gpu) {
    console.error("WebGPU cannot be initialized - navigator.gpu not found");
    return null;
  }
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    console.error("WebGPU cannot be initialized - Adapter not found");
    return null;
  }
  const device = await adapter.requestDevice();
  device.lost.then(() => {
    console.error("WebGPU cannot be initialized - Device has been lost");
    return null;
  });

  const canvas = document.getElementById("glcanvas");
  const context = canvas.getContext("webgpu");
  if (!context) {
    console.error("WebGPU cannot be initialized - Canvas does not support WebGPU");
    return null;
  }

  const devicePixelRatio = window.devicePixelRatio || 1;
  const presentationSize = [canvas.clientWidth * devicePixelRatio, canvas.clientHeight * devicePixelRatio];
  context.configure({
    device,
    format: "bgra8unorm",
    size: presentationSize,
  });
  return { canvas, context, device };
};

const init = async () => {
  const gpuInfo = await initGPU();
  if (!gpuInfo) return;
  const { canvas, context, device } = await gpuInfo;
  const geometry = Geometry.Box(device, 1, 1);
  const shaderCode = await require("./sharder.wgsl");

  const uniformValues = new Float32Array(16 + 16);
  const uniformBuffer = device.createBuffer({
    size: uniformValues.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  const projectionMatrixValue = uniformValues.subarray(0, 16);
  const modelViewMatrixValue = uniformValues.subarray(16, 16 + 16);

  const projectionMatrix = mat4.create();
  mat4.ortho(projectionMatrix, 0, canvas.clientWidth, canvas.clientHeight, 0, -1, 1);
  projectionMatrixValue.set(projectionMatrix, 0);

  const modelViewMatrix = mat4.create();
  mat4.identity(modelViewMatrix);
  mat4.translate(modelViewMatrix, modelViewMatrix, [400.0, 300.0, 0.0]);
  mat4.rotateZ(modelViewMatrix, modelViewMatrix, 0 * (Math.PI / 180));
  mat4.scale(modelViewMatrix, modelViewMatrix, [100.0, 100.0, 0.0]);
  modelViewMatrixValue.set(modelViewMatrix, 0);

  const uniform = { type: "uniform", data: uniformBuffer };

  const sampler = {
    type: "sampler",
    data: device.createSampler({
      magFilter: "linear",
      minFilter: "linear",
    }),
  };
  const texture = { type: "texture", data: await Texture.from(device, "./image.jpg") };

  const shader = Shader.from(device, geometry.getVertexBuffersDescriptors(), shaderCode, shaderCode, [
    { group: 0, binding: 0, data: uniform },
    { group: 0, binding: 1, data: sampler },
    { group: 0, binding: 2, data: texture },
  ]);

  function frame() {
    device.queue.writeBuffer(uniformBuffer, 0, uniformValues);

    shader.setView(context.getCurrentTexture().createView());
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass(shader.renderPassDescriptor);

    shader.use(passEncoder);
    geometry.use(passEncoder);
    passEncoder.drawIndexed(geometry.indexLength);
    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
};

init();
