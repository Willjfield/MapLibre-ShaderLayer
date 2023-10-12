#version 300 es
precision mediump float;
uniform float u_frame;
uniform vec4 u_bbox;
uniform highp vec2 u_resolution;

out highp vec4 fragColor;
//https://github.com/msfeldstein/glsl-map/blob/master/index.glsl
vec2 map(vec2 value, vec2 inMin, vec2 inMax, vec2 outMin, vec2 outMax) {
  return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
}

highp vec2 normalizedFragCoordFromLatLng() {

  highp vec2 uv = gl_FragCoord.xy/u_resolution;
  
  float pixelAspect = 1.063;//??????

  return map(uv, vec2(0.,0.), vec2(pixelAspect, pixelAspect),u_bbox.xy, u_bbox.zw);

}

void main() {

    vec2 normFrag = normalizedFragCoordFromLatLng();
    float thresh = .1;

    vec2 nyc = vec2(-71.5802,41.1693);
    bool distNYC = (distance(normFrag,nyc)>thresh);

    vec2 sw = u_bbox.xy;
    vec2 ne = u_bbox.zw;
    bool distSW = (distance(normFrag,sw) > thresh);
    bool distNE = (distance(normFrag,ne) > thresh);

    vec3 color = distNYC ? vec3(1.,.5,0.) : vec3(0.,.5,1.);

    fragColor = vec4(color,1.0);
}