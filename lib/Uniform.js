export default class Uniform {
  constructor(device, data) {
    this.device = device;
    let offset = 0;
    this.sections = {};
    for (let key in data) {
      const itemData = data[key];
      this.sections[key] = { data: itemData, offset };
      offset += itemData.length;
    }
    this.len = offset;
    this.values = new Float32Array(offset);
    this.buffer = device.createBuffer({
      size: offset * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  }
  updateBuffer(name, values) {
    const section = this.sections[name];
    section.data = values;
    this.device.queue.writeBuffer(this.buffer, section.offset * Float32Array.BYTES_PER_ELEMENT, values);
  }
}
