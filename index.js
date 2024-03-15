import Shader from "./Shader.js";
import Geometry from "./Geometry.js";
import Texture from "./Texture.js";
import Mesh from "./Mesh.js";
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
    alphaMode: "premultiplied",
  });
  return { canvas, context, device };
};

const init = async () => {
  const gpuInfo = await initGPU();
  if (!gpuInfo) return;
  const { canvas, context, device } = await gpuInfo;
  const geometry = Geometry.Box(device, 1, 1);
  const shaderCode = await require("./sharder.wgsl");

  const uniformBuffer = device.createBuffer({
    size: 32 * 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const projectionMatrix = mat4.create();
  mat4.ortho(projectionMatrix, 0, canvas.clientWidth, canvas.clientHeight, 0, -1, 1);

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

  const mesh = new Mesh(device, geometry, shader);
  mesh.lockUpdate = true;
  mesh.pos = [400, 300];
  mesh.size = [50, 50];
  mesh.rotation = 15;
  mesh.lockUpdate = false;
  mesh.updateModelViewMatrix();

  const renderPassDescriptor = {
    colorAttachments: [
      {
        //clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 0.0 },
        loadOp: "clear",
        storeOp: "store",
      },
    ],
  };
  function frame() {
    //mesh.rotation += 4;

    const uniformValues = new Float32Array([...projectionMatrix, ...mesh.modelViewMatrix]);
    device.queue.writeBuffer(uniformBuffer, 0, uniformValues);

    renderPassDescriptor.colorAttachments[0].view = context.getCurrentTexture().createView();
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    
    mesh.use(passEncoder);
    mesh.draw(passEncoder);

    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
};

init();
