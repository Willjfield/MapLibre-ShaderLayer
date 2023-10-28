#version 300 es
precision mediump float;
uniform float u_frame;
uniform float u_devicePixelRatio;
uniform vec4 u_bbox;
uniform highp vec2 u_resolution;
uniform vec2 u_location;

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
    float circum = 6378137.0;
    vec2 normFrag = normalizedFragCoordFromLatLng();
    float thresh = 7000.;

    float dist = distance(normFrag,u_location);
    bool distNYC = (dist>thresh);
    
    float modThresh = 1.-mod((u_frame*dist)/circum,1.);
   
    vec4 color = distNYC ? vec4(.2,modThresh/3.,modThresh,1.) :  vec4(0.);//smoothstep(vec4(normFrag/circum,1.,1.), vec4(0.,.5,1.,(((sin(u_frame)+1.))-(dist/30000.))),vec4(cos(u_frame)));

    fragColor = color;//vec4(color,1.0);
}