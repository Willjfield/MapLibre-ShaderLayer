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
  float normalizedX = gl_FragCoord.x / u_resolution.x;
  float normalizedY = gl_FragCoord.y / u_resolution.y;

  vec2 u_bbox = map(vec2(normalizedX, normalizedY), vec2(0., 0.), vec2(1., 1.),u_bbox.xy, u_bbox.zw);
 
  return vec2(longToNormalizedX(u_bbox.x), latToNormalizedY(u_bbox.y));
}




void main() {
vec2 nyc = vec2(40.730610,-73.935242);
float nrmlat = ((nyc.x/90.)+1.)/2.;//latToNormalizedY();
float nrmlng = ((nyc.y/180.)+1.)/2.;//longToNormalizedX(-73.935242);
vec2 normNYC = vec2(nrmlat,nrmlng);
vec2 normFrag = normalizedFragCoordFromLatLng();

 float dist = clamp(distance(vec2(nrmlng,nrmlat),normFrag),0.,.1);
    fragColor = vec4(vec2(dist),0.,1.0);
}