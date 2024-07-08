#version 300 es

precision mediump float;

uniform float u_frame;
out highp vec4 fragColor;

in vec2 v_texcoord;
uniform sampler2D u_texture;

  void main() {
    fragColor = texture(u_texture, vec2(0.5));
  }