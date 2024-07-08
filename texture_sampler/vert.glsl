
#version 300 es
    
uniform mat4 u_matrix;
in vec2 a_pos;
in vec2 a_texcoord;
out vec2 v_texcoord;

void main() {
    gl_Position = u_matrix * vec4(a_pos,0., 1.0);
      v_texcoord = a_texcoord;

}