import Shader from "./lib/Shader.js";
import Geometry from "./lib/Geometry.js";
import Texture from "./lib/Texture.js";
import Mesh from "./lib/Mesh.js";
import Uniform from "./lib/Uniform.js";
import { require } from "./lib/fun.js";

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

  const uniforms = new Uniform(device, {
    projectionMatrix: new Float32Array(16),
  });

  const projectionMatrix = mat4.create();
  mat4.ortho(projectionMatrix, 0, canvas.clientWidth, canvas.clientHeight, 0, -1, 1);
  uniforms.updateBuffer("projectionMatrix", projectionMatrix);

  const sampler = device.createSampler({
    magFilter: "linear",
    minFilter: "linear",
  });
  const texture = await Texture.from(device, "./image.jpg");

  const shader = Shader.from(device, geometry.getVertexBuffersDescriptors(), shaderCode, shaderCode);

  const meshList = [];
  for (let i = 0; i < 1000; i++) {
    const mesh = new Mesh(device, geometry, shader.pipeline, [
      { group: 0, binding: 0, data: { buffer: uniforms.buffer } },
      { group: 0, binding: 2, data: sampler },
      { group: 0, binding: 3, data: texture.createView() },
    ]);
    mesh.transform([Math.random() * 800, Math.random() * 400], [50, 50], Math.random() * 360);
    meshList.push(mesh);
  }

  const renderPassDescriptor = {
    colorAttachments: [
      {
        //clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 0.0 },
        loadOp: "clear",
        storeOp: "store",
      },
    ],
  };
  function renderPass(passEncoder) {
    shader.use(passEncoder);
    meshList.forEach((mesh) => {
      mesh.use(passEncoder);
      mesh.draw(passEncoder);
    });
  }
  function frame() {
    //mesh.rotation += 4;
    meshList.forEach((mesh) => {
      mesh.rotation += 4;
    });

    renderPassDescriptor.colorAttachments[0].view = context.getCurrentTexture().createView();

    const renderBundleEncoder = device.createRenderBundleEncoder({
      colorFormats: ["bgra8unorm"],
    });
    renderPass(renderBundleEncoder);
    const renderBundle = renderBundleEncoder.finish();
    
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.executeBundles([renderBundle]);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);

    /*const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    renderPass(passEncoder);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);*/

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
};

init();
