#version 300 es
precision mediump float;

// uniform float u_frame;
// uniform vec4 u_bbox;
// uniform highp vec2 u_resolution;
// uniform vec2 u_location;
uniform vec4 u_color;
out highp vec4 fragColor;


void main() {
    fragColor = u_color;
}