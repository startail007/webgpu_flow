import Uniform from "./Uniform.js";
export default class Mesh {
  static getGroups(data) {
    const groups = {};
    data.forEach((el) => {
      if (!groups[el.group]) groups[el.group] = [];
      groups[el.group].push({
        binding: el.binding,
        resource: el.data,
      });
    });
    return groups;
  }
  static getBindGroup(device, pipeline, groups) {
    const bindGroups = {};
    for (let key in groups) {
      bindGroups[key] = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(key),
        entries: groups[key],
      });
    }
    return bindGroups;
  }
  constructor(device, geometry, pipeline, data) {
    this.device = device;
    this.geometry = geometry;
    this.modelViewMatrix = mat4.create();
    this._pos = [0, 0];
    this._rotation = 0;
    this._size = [100, 100];
    this.lockUpdate = false;
    this.modelUniforms = new Uniform(device, {
      modelViewMatrix: new Float32Array(16),
    });
    this.updateModelViewMatrix();
    this.groups = Mesh.getGroups([...data, { group: 0, binding: 1, data: { buffer: this.modelUniforms.buffer } }]);
    this.bindGroups = Mesh.getBindGroup(device, pipeline, this.groups);
  }
  set pos(val) {
    this._pos = val;
    if (this.lockUpdate) return;
    this.updateModelViewMatrix();
  }
  get pos() {
    return this._pos;
  }
  set rotation(val) {
    this._rotation = val;
    if (this.lockUpdate) return;
    this.updateModelViewMatrix();
  }
  get rotation() {
    return this._rotation;
  }
  set size(val) {
    this._size = val;
    if (this.lockUpdate) return;
    this.updateModelViewMatrix();
  }
  get size() {
    return this._size;
  }
  transform(pos, size, rotation) {
    this.lockUpdate = true;
    if (pos != undefined) this.pos = pos;
    if (size != undefined) this.size = size;
    if (rotation != undefined) this.rotation = rotation;
    this.lockUpdate = false;
    this.updateModelViewMatrix();
  }
  updateModelViewMatrix() {
    mat4.identity(this.modelViewMatrix);
    mat4.translate(this.modelViewMatrix, this.modelViewMatrix, [...this._pos, 0.0]);
    mat4.rotateZ(this.modelViewMatrix, this.modelViewMatrix, this._rotation * (Math.PI / 180));
    mat4.scale(this.modelViewMatrix, this.modelViewMatrix, [...this._size, 0.0]);
    this.modelUniforms.updateBuffer("modelViewMatrix", this.modelViewMatrix);
  }
  use(passEncoder) {
    for (let key in this.bindGroups) {
      passEncoder.setBindGroup(key, this.bindGroups[key]);
    }
    this.geometry.use(passEncoder);
  }
  draw(passEncoder) {
    passEncoder.drawIndexed(this.geometry.indexLength);
  }
}
