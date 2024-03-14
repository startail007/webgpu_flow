const require = (src) => {
  return fetch(src).then((response) => {
    if (!response.ok) {
      throw new Error("error");
    }
    return response.text();
  });
};
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
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device,
    format: presentationFormat,
    size: presentationSize,
  });
  return { canvas, context, device, presentationFormat };
};
const createVertexBuffer = (device, data) => {
  const vertices = new Float32Array(data);
  const vertexBuffer = device.createBuffer({
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true,
  });
  new Float32Array(vertexBuffer.getMappedRange()).set(vertices);
  vertexBuffer.unmap();
  return vertexBuffer;
};
const createIndexBuffer = (device, data) => {
  const indexBufferData = new Uint16Array(data);
  const indexBuffer = device.createBuffer({
    size: indexBufferData.byteLength,
    usage: GPUBufferUsage.INDEX,
    mappedAtCreation: true,
  });
  new Uint16Array(indexBuffer.getMappedRange()).set(indexBufferData);
  indexBuffer.unmap();
  return indexBuffer;
};
const createBuffers = (device) => {
  const vertexBuffer = createVertexBuffer(device, [-0.1, 0.1, 0.1, 0.1, 0.1, -0.1, -0.1, -0.1]);
  const colorBuffer = createVertexBuffer(device, [1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1, 1]);
  const uvBuffer = createVertexBuffer(device, [0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0]);
  const indexBuffer = createIndexBuffer(device, [0, 1, 2, 0, 2, 3]);
  return { vertexBuffer, colorBuffer, indexBuffer, uvBuffer };
};
const createPipeline = (device, presentationFormat, shaderVertexCode, shaderFragmentCode) => {
  const vertexBuffersDescriptors = [
    {
      attributes: [
        {
          shaderLocation: 0,
          offset: 0,
          format: "float32x2",
        },
      ],
      arrayStride: 4 * 2,
      stepMode: "vertex",
    },
    {
      attributes: [
        {
          shaderLocation: 1,
          offset: 0,
          format: "float32x4",
        },
      ],
      arrayStride: 4 * 4,
      stepMode: "vertex",
    },
    {
      attributes: [
        {
          shaderLocation: 2,
          offset: 0,
          format: "float32x2",
        },
      ],
      arrayStride: 4 * 2,
      stepMode: "vertex",
    },
  ];

  const shaderVertexModule = device.createShaderModule({
    code: shaderVertexCode,
  });
  const shaderFragmentModule = device.createShaderModule({
    code: shaderFragmentCode,
  });

  const pipeline = device.createRenderPipeline({
    vertex: {
      module: shaderVertexModule,
      entryPoint: "vertex_main",
      buffers: vertexBuffersDescriptors,
    },
    fragment: {
      module: shaderFragmentModule,
      entryPoint: "fragment_main",
      targets: [
        {
          format: presentationFormat,
        },
      ],
    },
    primitive: {
      topology: "triangle-list",
    },
    layout: "auto",
  });
  return pipeline;
};

const loadImageBitmap = async (src) => {
  /*const res = await fetch(src);
  const blob = await res.blob();
  const imageBitmap = await createImageBitmap(blob, { colorSpaceConversion: "none" });
  return imageBitmap;*/
  const img = new Image();
  img.src = src;
  await img.decode();
  const imageBitmap = await createImageBitmap(img);
  return imageBitmap;
};

const getData = (imageBitmap) => {
  const canvas = document.createElement("canvas");
  canvas.width = imageBitmap.width;
  canvas.height = imageBitmap.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(imageBitmap, 0, 0);

  const imageData = ctx.getImageData(0, 0, imageBitmap.width, imageBitmap.height);
  return imageData.data;
};
class Texture {
  static async from(device, src) {
    const imageBitmap = await loadImageBitmap(src);
    const uint8Array = getData(imageBitmap);

    /*const texture = device.createTexture({
      size: [imageBitmap.width, imageBitmap.height],
      format: "rgba8unorm",
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    });
    device.queue.copyExternalImageToTexture({ source: imageBitmap0, flipY: true }, { texture: texture }, { width: imageBitmap.width, height: imageBitmap.height });*/

    const texture = device.createTexture({
      size: [imageBitmap.width, imageBitmap.height, 1],
      format: "rgba8unorm",
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    });
    device.queue.writeTexture({ texture }, uint8Array, { bytesPerRow: imageBitmap.width * 4, rowsPerImage: imageBitmap.height }, [imageBitmap.width, imageBitmap.height, 1]);
    //const texture = device.importExternalTexture({ source: uint8Array, width: imageBitmap.width, height: imageBitmap.height });
    return texture;
  }
}
const init = async () => {
  const gpuInfo = await initGPU();
  if (!gpuInfo) return;
  const { canvas, context, device, presentationFormat } = await gpuInfo;
  const { vertexBuffer, colorBuffer, indexBuffer, uvBuffer } = createBuffers(device);
  const shaderCode = await require("./sharder.wgsl");
  const pipeline = createPipeline(device, presentationFormat, shaderCode, shaderCode);

  const uniformBufferSize = 1 * 4;
  const uniformBuffer = device.createBuffer({
    size: uniformBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  const uniformValues = new Float32Array(uniformBufferSize / 4);
  uniformValues.set([1.0], 0);

  const texture = await Texture.from(device, "./image.jpg");

  const sampler = device.createSampler({
    magFilter: "linear",
    minFilter: "linear",
  });

  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
        },
      },
      {
        binding: 1,
        resource: sampler,
      },
      {
        binding: 2,
        resource: texture.createView(),
      },
    ],
  });

  const renderPassDescriptor = {
    colorAttachments: [
      {
        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
        loadOp: "clear",
        storeOp: "store",
      },
    ],
  };
  let i = 0;
  function frame() {
    i += 0.001;
    i %= 1;
    uniformValues.set([Math.sin(i * 2 * Math.PI) * 0.5 + 0.5], 0);
    device.queue.writeBuffer(uniformBuffer, 0, uniformValues);

    renderPassDescriptor.colorAttachments[0].view = context.getCurrentTexture().createView();
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);

    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.setVertexBuffer(0, vertexBuffer);
    passEncoder.setVertexBuffer(1, colorBuffer);
    passEncoder.setVertexBuffer(2, uvBuffer);
    passEncoder.setIndexBuffer(indexBuffer, "uint16");
    passEncoder.drawIndexed(6);
    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
};

init();
