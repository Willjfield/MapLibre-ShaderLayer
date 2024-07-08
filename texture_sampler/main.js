import maplibre from 'maplibre-gl';
import ShaderLayer from '../ShaderLayer.js';
import frag from './frag.glsl';
import vert from './vert.glsl';
import proj4 from 'proj4';

const map = new maplibre.Map({
  container: 'map',
  style: './style.json',
  center: [-71.5593, 41.1338],
  zoom: 7,
  hash: true
});

let shaderLayerA, shaderLayerB;

let u_resolutionLocation, u_pixelRatio;
//https://mybytestream.com/blog/javascript-webgl-retro-shader-wireframe-material.html
map.once('load', () => {

  shaderLayerB = new ShaderLayer(map, 'shaderLayerB', ['Landcover'], {
    fragmentSource: frag,
    vertexSource: vert
  });
  map.addLayer(shaderLayerB, 'Residential');

  //On render I need to do this again:
  const glb = shaderLayerB.context;
  const progb = shaderLayerB.program;

  const vArray = [];
  for (var i = 0; i < shaderLayerB.positionLength / 2; ++i) {
    // each vertex gets its own vector: 1,0,0 ; 0,1,0 ; 0,0,1
    const vector = [0, 0, 0];
    vector[i % 3] = 1;
    vArray.push(...vector);

  }


  glb.useProgram(progb);
  //shaderLayerB.setBuffer('a1_pos', vArray, 3, glb.FLOAT, false, 0, 0);

  map.on('render', () => {

    const rvArray = [];
    for (var i = 0; i < shaderLayerB.positionLength / 2; ++i) {
      // each vertex gets its own vector: 1,0,0 ; 0,1,0 ; 0,0,1
      const vector = [0, 0, 0];
      vector[i % 3] = 1;
      rvArray.push(...vector);

    }

    //shaderLayerB.setBuffer('a1_pos', rvArray, 3, glb.FLOAT, false, 0, 0);
  })
});


let frameNum = 0;
let u_frame;
function animation() {
  frameNum = (frameNum + 1) % 500;

  const gl = shaderLayerB.context;
  const prog = shaderLayerB.program;

  gl.useProgram(prog);

  if (!u_frame) {
    u_frame = gl.getUniformLocation(prog, 'u_frame');
  } else {
    gl.uniform1f(u_frame, frameNum);
  }

  requestAnimationFrame(() => { animation() });

  map.triggerRepaint();
}

