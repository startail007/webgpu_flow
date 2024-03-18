struct Uniforms {
    projectionMatrix: mat4x4f,
};
struct ModelUniforms {
    modelViewMatrix: mat4x4f,
};
@group(0) @binding(0) var<uniform> uniforms : Uniforms;
@group(0) @binding(1) var<uniform> modelUniforms : ModelUniforms;
//@group(0) @binding(0) var<uniform> projectionMatrix: mat4x4f;
//@group(0) @binding(1) var<uniform> modelViewMatrix: mat4x4f;
@group(0) @binding(2) var mySampler: sampler;
@group(0) @binding(3) var myTexture: texture_2d<f32>;
//@group(0) @binding(0) var<uniform> scale : f32;
struct VertexIn {
    @location(0) position : vec2f,
    @location(1) color : vec4f,
    @location(2) uv : vec2f,
};
struct Varying {
    @builtin(position) position : vec4f,
    @location(0) color : vec4f,
    @location(1) uv : vec2f,
};

@vertex
fn vertex_main(in : VertexIn) -> Varying
{
    var output : Varying;
    output.position = uniforms.projectionMatrix * (modelUniforms.modelViewMatrix * vec4f(in.position,0.0,1.0));
    output.color = in.color;
    output.uv = in.uv;
    return output;
}

@fragment
fn fragment_main(fragData : Varying) -> @location(0) vec4f
{
    //var color = textureSample(myTexture,mySampler,fragData.uv);
    //return fragData.color*vec4f(vec3f(uniforms.scale),1.0);
    return textureSample(myTexture,mySampler,fragData.uv);
}