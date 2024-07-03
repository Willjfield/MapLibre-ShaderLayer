  #version 300 es
  in highp vec2 vTextureCoord;

    uniform sampler2D uSampler;
out highp vec4 fragColor;


    void main(void) {
      fragColor = texture(uSampler, vTextureCoord);
    }