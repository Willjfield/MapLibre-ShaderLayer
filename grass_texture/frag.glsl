  #version 300 es

precision highp float;

// Passed in from the vertex shader.
in vec2 v_texcoord;

// The texture.
uniform sampler2D u_texture;

out highp vec4 fragColor;


    void main(void) {
      fragColor = texture(u_texture, v_texcoord);
    }