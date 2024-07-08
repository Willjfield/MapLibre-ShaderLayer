//https://github.com/WebGLSamples/WebGL2Samples/blob/master/samples/sampler_object.html
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

let shaderLayer;

let u_resolutionLocation, u_pixelRatio;

map.once('load', () => {
  shaderLayer = new ShaderLayer(map, 'shaderLayer', ['Water'], { fragmentSource: frag, vertexSource: vert });
  map.addLayer(shaderLayer, 'Aeroway');
  const gl = shaderLayer.context;
  const prog = shaderLayer.program;
  
  gl.useProgram(prog);
  console.log(gl.getProgramInfoLog(prog))

  //shaderLayer.loadTexture(gl,'grass_texture/Textures/01C.png')

  // let u_colorLocation = gl.getUniformLocation(prog, 'u_color');
  // gl.uniform4fv(u_colorLocation, [0.0, 1.0, 0.0, 1.0]);
});

map.on('render', () => {
  // loc_location = gl.getUniformLocation(prog, 'u_location');

  // const nyc = [-71.5802, 41.1853];
  // const nyc3857 = proj4('EPSG:4326', 'EPSG:3857', nyc);

 // gl.uniform2fv(loc_location, nyc3857);
  //shaderLayer.render()
  
})



// window.addEventListener('resize', () => {
//   updateResolution(shaderLayerA);
//   updateGeometry();
// });

// map.on('move', () => {
//   updateGeometry();
// });

// function updateResolution(_shaderLayer) {

//   if(!_shaderLayer) return;

//   const gl = _shaderLayer.context;
//   const prog = _shaderLayer.program;

//   gl.useProgram(prog);

//   u_resolutionLocation = gl.getUniformLocation(prog, 'u_resolution');
//   gl.uniform2fv(u_resolutionLocation, [map.getContainer().offsetWidth, map.getContainer().offsetHeight]);
//   u_pixelRatio = gl.getUniformLocation(prog, 'u_devicePixelRatio');
//   gl.uniform1f(u_pixelRatio, window.devicePixelRatio);
// }

// function updateGeometry() {
//   shaderLayerA.updateMapBBox();
// }

// function animation() {
//   frameNum++;

//   const gl = shaderLayerA.context;
//   const prog = shaderLayerA.program;

//   gl.useProgram(prog);

//   if (!u_frame) {
//     u_frame = gl.getUniformLocation(prog, 'u_frame');
//   } else {
//     gl.uniform1f(u_frame, frameNum/100);
//   }
 
//   requestAnimationFrame(() => { animation() });

//   map.triggerRepaint();
// }

