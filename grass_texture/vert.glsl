#version 300 es
    in vec2 a_pos;
    in vec2 aTextureCoord;
  in vec2 a_texcoord;

   uniform mat4 u_matrix;

   out vec2 v_texcoord;

    void main(void) {
      gl_Position = u_matrix * vec4(a_pos,0., 1.0);
      v_texcoord = a_texcoord;
    }

    


// #version 300 es
    
// uniform mat4 u_matrix;
// in vec2 a_pos;

// //in vec4 feature_color;
// //flat out vec4 fcolor;


// void main() {
//     gl_Position = u_matrix * vec4(a_pos,0., 1.0);
//    // fcolor = vec4(mod(a_pos*5.,1.), 0.0, 1.0);
// }