import maplibre from 'maplibre-gl';
import ShaderLayer from './ShaderLayer.js';
import frag from './frag.glsl';

const map = new maplibre.Map({
  container: 'map',
  style: 'https://api.maptiler.com/maps/dataviz/style.json?key=S5ckYmY9F8cXqKTHBLHV',
  center: [20, 35],
  zoom: 5,
  hash: true
});

let slayer;

map.on('load', () => {
  slayer = new ShaderLayer(map, 'test', ['Water'], { fragmentSource: frag, animate: animation });
  map.addLayer(slayer, 'Aeroway');
});

// map.on('dragend', (e) => {
//   const sw = map.unproject([0, map.getContainer().offsetHeight]);
//      const ne = map.unproject([map.getContainer().offsetWidth, 0]);
//      console.log(sw,ne);

// })



let u_frame;
let u_bboxLocation;
let u_resolutionLocation;

map.on('move',()=>{
  const gl = slayer.context;
  const prog = slayer.program;

  u_bboxLocation = gl.getUniformLocation(prog, 'u_bbox');

  const sw = map.unproject([0, map.getContainer().offsetHeight]);
   const ne = map.unproject([map.getContainer().offsetWidth, 0]);

  gl.uniform4fv(u_bboxLocation, [sw.lng, sw.lat, ne.lng, ne.lat]);
});

let frameNum = 0;
function animation(_slayer) {
  frameNum++;

  const gl = _slayer.context;
  const prog = _slayer.program;

  gl.useProgram(prog);
  if (!u_frame) {
    u_frame = gl.getUniformLocation(prog, 'u_frame');
  } else {
    gl.uniform1f(u_frame, Math.sin(frameNum / 20));
  }

  //This should be on resize instead of in animate:
  if (!u_resolutionLocation) {
    u_resolutionLocation = gl.getUniformLocation(prog, 'u_resolution');
    gl.uniform2fv(u_resolutionLocation, [map.getContainer().offsetWidth, map.getContainer().offsetHeight]);
  }
  
  map.triggerRepaint();
  requestAnimationFrame(() => { animation(_slayer) });
}

