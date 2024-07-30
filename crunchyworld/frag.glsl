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

    void main(void) {
      float _pow = u_zoom > 7. ? 3. : 2.;
      float _zoom = max(pow(u_zoom*2.,_pow),1.);
      fragColor = texture(u_texture, v_texcoord*_zoom);
    }