const initShaderPipeline = (device, vertexBuffersDescriptors, vsSource, fsSource) => {
  const shaderVertexModule = device.createShaderModule({
    code: vsSource,
  });
  const shaderFragmentModule = device.createShaderModule({
    code: fsSource,
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
          format: "bgra8unorm",
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
export default class Shader {
  static from(device, vertexBuffersDescriptors, vertexSrc, fragmentSrc) {
    return new Shader(device, initShaderPipeline(device, vertexBuffersDescriptors, vertexSrc, fragmentSrc));
  }
  constructor(device, pipeline) {
    this.device = device;
    this.pipeline = pipeline;
  }
  use(passEncoder) {
    passEncoder.setPipeline(this.pipeline);    
  }
}
