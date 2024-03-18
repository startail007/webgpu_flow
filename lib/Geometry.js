export default class Geometry {
  static Box(device, w, h) {
    const geometry = new Geometry(device);
    geometry.addAttribute(0, [-w * 0.5, -h * 0.5, w * 0.5, -h * 0.5, w * 0.5, h * 0.5, -w * 0.5, h * 0.5], 2);
    geometry.addAttribute(1, [1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1, 1], 4);
    geometry.addAttribute(2, [0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0], 2);
    geometry.addIndex([0, 1, 2, 0, 2, 3]);
    return geometry;
  }
  constructor(device) {
    this.device = device;
    this.attributes = [];
    this.indexBuffer = null;
    this.indexLength = 0;
  }
  addAttribute(index, data, size) {
    const device = this.device;
    const vertices = new Float32Array(data);
    const vertexBuffer = device.createBuffer({
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Float32Array(vertexBuffer.getMappedRange()).set(vertices);
    vertexBuffer.unmap();

    this.attributes.push({ index, vertexBuffer, size });
    return this;
  }
  addIndex(data) {
    const device = this.device;
    const indexBufferData = new Uint16Array(data);
    const indexBuffer = device.createBuffer({
      size: indexBufferData.byteLength,
      usage: GPUBufferUsage.INDEX,
      mappedAtCreation: true,
    });
    new Uint16Array(indexBuffer.getMappedRange()).set(indexBufferData);
    indexBuffer.unmap();

    this.indexBuffer = indexBuffer;
    this.indexLength = data.length;
    return this;
  }
  getVertexBuffersDescriptors() {
    return this.attributes.map((el) => {
      return {
        attributes: [
          {
            shaderLocation: el.index,
            offset: 0,
            format: `float32x${el.size}`,
          },
        ],
        arrayStride: el.size * Float32Array.BYTES_PER_ELEMENT,
        stepMode: "vertex",
      };
    });
  }
  use(passEncoder) {
    this.attributes.forEach((el) => {
      passEncoder.setVertexBuffer(el.index, el.vertexBuffer);
    });
    passEncoder.setIndexBuffer(this.indexBuffer, "uint16");
    return this;
  }
}
