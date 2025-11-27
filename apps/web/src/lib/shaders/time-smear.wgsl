// Time Smear Effect Shader
// Creates motion trail effect by blending current frame with previous frames

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) texCoord: vec2f,
}

struct Uniforms {
  decay: f32,      // How fast trails fade (0.0 = instant, 1.0 = permanent)
  intensity: f32,  // Trail opacity multiplier
  time: f32,       // Animation time
  _padding: f32,
}

@group(0) @binding(0) var texSampler: sampler;
@group(0) @binding(1) var currentFrame: texture_2d<f32>;
@group(0) @binding(2) var previousFrame: texture_2d<f32>;
@group(0) @binding(3) var<uniform> uniforms: Uniforms;

// Fullscreen triangle vertex shader
@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
  var pos = array<vec2f, 3>(
    vec2f(-1.0, -1.0),
    vec2f(3.0, -1.0),
    vec2f(-1.0, 3.0)
  );
  
  var texCoords = array<vec2f, 3>(
    vec2f(0.0, 1.0),
    vec2f(2.0, 1.0),
    vec2f(0.0, -1.0)
  );
  
  var output: VertexOutput;
  output.position = vec4f(pos[vertexIndex], 0.0, 1.0);
  output.texCoord = texCoords[vertexIndex];
  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  let current = textureSample(currentFrame, texSampler, input.texCoord);
  let previous = textureSample(previousFrame, texSampler, input.texCoord);
  
  // Blend current frame with decayed previous frame
  let decayedPrevious = previous * uniforms.decay;
  let blended = mix(current, max(current, decayedPrevious), uniforms.intensity);
  
  return vec4f(blended.rgb, 1.0);
}

