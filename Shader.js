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
  static from(device, vertexBuffersDescriptors, vertexSrc, fragmentSrc, uniforms) {
    return new Shader(device, initShaderPipeline(device, vertexBuffersDescriptors, vertexSrc, fragmentSrc), uniforms);
  }
  constructor(device, pipeline, data) {
    this.device = device;
    this.pipeline = pipeline;
    const groups = {};
    data.forEach((el) => {
      if (!groups[el.group]) groups[el.group] = [];
      let resource;
      if (el.data.type == "uniform") {
        resource = { buffer: el.data.data };
      } else if (el.data.type == "sampler") {
        resource = el.data.data;
      } else if (el.data.type == "texture") {
        resource = el.data.data.createView();
      }
      groups[el.group].push({
        binding: el.binding,
        resource,
      });
    });
    const bindGroups = {};
    for (let key in groups) {
      bindGroups[key] = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(key),
        entries: groups[key],
      });
    }
    this.bindGroups = bindGroups;
    this.data = data;
  }
  use(passEncoder) {
    passEncoder.setPipeline(this.pipeline);
    for (let key in this.bindGroups) {
      passEncoder.setBindGroup(key, this.bindGroups[key]);
    }
  }
}
