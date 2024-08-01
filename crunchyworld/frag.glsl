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


highp vec2 normalizedLatLngFromFragCoord() {

  highp vec2 uv = gl_FragCoord.xy/u_resolution;

  return map(uv, u_bbox.xy, u_bbox.zw, vec2(0.), vec2(u_devicePixelRatio));

}
    void main(void) {
      float _pow = u_zoom > 7. ? 3.25 : 2.;
      float _zoom = max(pow(u_zoom*2.,_pow),1.);
      vec3 fragWorldPosition = vec3(normalizedLatLngFromFragCoord(),0.);
      //Get gl_FragCoord's latlng
      //Normalize to 0-1 to match camera's position
      //Then get the vec from fragment to camera
      highp vec2 uv = gl_FragCoord.xy/u_resolution;

      highp vec3 uvwvec = normalize(vec3((uv.xy*2.-1.5),-.15)-u_camera.xyz);

      vec3 normSample = texture(u_normal, v_texcoord*_zoom).xyz;
      float dotCamera = dot(uvwvec,normSample.xyz)*-2.;
      
      vec4 rgb = texture(u_texture, v_texcoord*_zoom)*dotCamera;
      //float dotPos = dot(u_camera.xzy,normSample.xyz);
      fragColor = vec4(max(rgb.x,.1),max(rgb.y,.1),max(rgb.z,.1),1.);
    }