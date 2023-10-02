#version 300 es
precision mediump float;
uniform float u_frame;
uniform vec4 u_bbox;
uniform vec2 u_resolution;

out highp vec4 fragColor;
//https://github.com/msfeldstein/glsl-map/blob/master/index.glsl
vec2 map(vec2 value, vec2 inMin, vec2 inMax, vec2 outMin, vec2 outMax) {
  return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
}

float longToNormalizedX(float lng) {
  return ((lng/180.)+1.)/2.;
}

float latToNormalizedY(float lat) {
  return ((lat/90.)+1.)/2.;
}

vec2 normalizedFragCoordFromLatLng() {
  //0-1 frag coord
  //float normalizedX = gl_FragCoord.x / u_resolution.x;
  //float normalizedY = gl_FragCoord.y / u_resolution.y;
  vec2 uv =gl_FragCoord.xy/u_resolution;
  //uv.x *= u_resolution.x/u_resolution.y;
  uv = uv*2.-1.;
  //Map 0-1 frag coord, which can go from 0,0 to 1,1 to sw, ne bounding box
  vec2 frag_lnglat = map(uv, vec2(-1.,-1.), vec2(1., 1.),u_bbox.xy, u_bbox.zw);
  //The lat/lng of the fragment
  return frag_lnglat;
}




void main() {
    vec2 nyc = vec2(-71.535242,41.2);

    vec2 normFrag = normalizedFragCoordFromLatLng();
    float dist = distance(normFrag,nyc);
    vec3 color = dist > .15 ? vec3(1.,.5,0.) : vec3(0.,.5,1.);
    fragColor = vec4(color,1.0);
}