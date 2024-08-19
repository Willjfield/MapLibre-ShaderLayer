  #version 300 es

precision highp float;

// Passed in from the vertex shader.
in vec2 v_texcoord;
in vec2 v_normcoord;
// The texture.
uniform sampler2D u_texture;
uniform sampler2D u_normal;

out highp vec4 fragColor;
uniform float u_zoom;
uniform vec3 u_camera;
uniform highp vec2 u_resolution;

uniform vec4 u_bbox;
uniform float u_devicePixelRatio;

vec2 map(vec2 value, vec2 inMin, vec2 inMax, vec2 outMin, vec2 outMax) {
  return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
}

highp vec2 normalizedFragCoordFromLatLng() {

  highp vec2 uv = gl_FragCoord.xy/u_resolution;

  return map(uv, vec2(0.), vec2(u_devicePixelRatio),u_bbox.xy, u_bbox.zw);

}


    void main(void) {
    float circum = 6378137.0;
    vec2 normFrag = normalizedFragCoordFromLatLng();
    float thresh = 7000.;
    
    float dist = distance(normFrag,u_camera.xy);

      if(dist > 100.){
        fragColor = vec4(1.,1.,1.,1.);
      }else{
        fragColor = vec4(0.,0.,0.,1.);
      }
      
    }