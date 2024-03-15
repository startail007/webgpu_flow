export default class Mesh {
  constructor(gl, geometry, shader) {
    this.gl = gl;
    this.geometry = geometry;
    this.shader = shader;
    this.modelViewMatrix = { type: "matrix", data: mat4.create() };
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
    mat4.identity(this.modelViewMatrix.data);
    mat4.translate(this.modelViewMatrix.data, this.modelViewMatrix.data, [...this._pos, 0.0]);
    mat4.rotateZ(this.modelViewMatrix.data, this.modelViewMatrix.data, this._rotation * (Math.PI / 180));
    mat4.scale(this.modelViewMatrix.data, this.modelViewMatrix.data, [...this._size, 0.0]);
  }
  use(uniforms) {
    const gl = this.gl;
    gl.useProgram(this.shader.program);
    this.geometry.use(this.shader.program);
    this.shader.use({ uModelViewMatrix: this.modelViewMatrix, ...uniforms });
  }
  draw() {
    const gl = this.gl;
    gl.drawElements(gl.TRIANGLE_STRIP, this.geometry.indexLength, gl.UNSIGNED_SHORT, 0);
  }
}
