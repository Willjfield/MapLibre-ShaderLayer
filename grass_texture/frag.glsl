  #version 300 es

precision highp float;

// Passed in from the vertex shader.
in vec2 v_texcoord;

// The texture.
uniform sampler2D u_texture;

out highp vec4 fragColor;
uniform float u_zoom;

    void main(void) {
      float _pow = u_zoom > 7. ? 3. : 2.;
      fragColor = texture(u_texture, v_texcoord*max(pow(u_zoom,_pow),1.));
    }