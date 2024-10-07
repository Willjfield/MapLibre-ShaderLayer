#version 300 es
    in vec2 a_pos;

  in vec2 a_texcoord;
  in vec2 a_normcoord;
   uniform mat4 u_matrix;

   out vec2 v_texcoord;
  out vec2 v_normcoord;
    void main(void) {
      gl_Position = u_matrix * vec4(a_pos,0., 1.0);
      v_texcoord = a_texcoord;
      v_normcoord = a_normcoord;
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