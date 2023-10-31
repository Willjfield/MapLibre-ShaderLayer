#version 300 es
precision mediump float;
uniform float u_frame;
uniform float u_devicePixelRatio;
uniform vec4 u_bbox;
uniform highp vec2 u_resolution;
uniform vec2 u_location;
in vec4 fcolor;

out highp vec4 fragColor;
//https://github.com/msfeldstein/glsl-map/blob/master/index.glsl
vec2 map(vec2 value, vec2 inMin, vec2 inMax, vec2 outMin, vec2 outMax) {
  return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
}

highp vec2 normalizedFragCoordFromLatLng() {

  highp vec2 uv = gl_FragCoord.xy/u_resolution;

  return map(uv, vec2(0.), vec2(u_devicePixelRatio),u_bbox.xy, u_bbox.zw);

}

void main() {
    highp vec2 uv = gl_FragCoord.xy/u_resolution;
    fragColor = fcolor;//vec4(1.,0.,1.,1.0);
}