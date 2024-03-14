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
    output.position = vec4f(in.position,0.0,1.0);
    output.color = in.color;
    output.uv = in.uv;
    return output;
}

struct Uniforms {
    scale: f32,
};
@group(0) @binding(0) var<uniform> uniforms : Uniforms;
@group(0) @binding(1) var mySampler: sampler;
@group(0) @binding(2) var myTexture: texture_2d<f32>;
//@group(0) @binding(0) var<uniform> scale : f32;

@fragment
fn fragment_main(fragData : Varying) -> @location(0) vec4f
{
    //var color = textureSample(myTexture,mySampler,fragData.uv);
    //return fragData.color*vec4f(vec3f(uniforms.scale),1.0);
    return textureSample(myTexture,mySampler,fragData.uv)*vec4f(vec3f(uniforms.scale),1.0)+fragData.color*vec4f(vec3f(1.0-uniforms.scale),1.0);
}