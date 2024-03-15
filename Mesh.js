export default class Mesh {
  constructor(device, geometry, shader) {
    this.device = device;
    this.geometry = geometry;
    this.shader = shader;
    this.modelViewMatrix = mat4.create();
    this._pos = [0, 0];
    this._rotation = 0;
    this._size = [100, 100];
    this.lockUpdate = false;
    this.updateModelViewMatrix();
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
  updateModelViewMatrix() {
    mat4.identity(this.modelViewMatrix);
    mat4.translate(this.modelViewMatrix, this.modelViewMatrix, [...this._pos, 0.0]);
    mat4.rotateZ(this.modelViewMatrix, this.modelViewMatrix, this._rotation * (Math.PI / 180));
    mat4.scale(this.modelViewMatrix, this.modelViewMatrix, [...this._size, 0.0]);
  }
  use(passEncoder) {
    this.shader.use(passEncoder);
    this.geometry.use(passEncoder);
  }
  draw(passEncoder) {  
    passEncoder.drawIndexed(this.geometry.indexLength);
  }
}
