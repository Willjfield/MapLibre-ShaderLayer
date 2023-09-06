import earcut from "earcut";
import maplibregl from 'maplibre-gl';
import { classifyRings } from './utils';
import SegmentVector from './SegmentVector';

export default class MapLibreShaderLayer {
    constructor(map, id, fromLayers, fragmentSource, vertexSource) {

        this.id = id;
        this.map = map;
        this.fromLayers = fromLayers;

        this.type = 'custom';
        this.keys = [];

        this.positions = [];

        this.layoutVertexArray=[];
        this.indexArray = [];
        this.indexArray2 = [];

        this.segments = new SegmentVector();
        this.segments2 = new SegmentVector();
       
        // create GLSL source for vertex shader
        const defaultVertexSource = `#version 300 es
    
            uniform mat4 u_matrix;
            in vec2 a_pos;
            void main() {
                gl_Position = u_matrix * vec4(a_pos, 0.0, 1.0);
            }`;

        // create GLSL source for fragment shader
        const defaultFragmentSource = `#version 300 es
    
            out highp vec4 fragColor;
            void main() {
                fragColor = vec4(1.0, 0.0, 0.0, 1.0);
            }`;

        this.fragmentSource = fragmentSource || defaultFragmentSource;
        this.vertexSource = vertexSource || defaultVertexSource;

        this.positionLength = 0;


    }



    // method called when the layer is added to the map
    // Search for StyleImageInterface in https://maplibre.org/maplibre-gl-js/docs/API/
    onAdd(map, gl) {

        // create a vertex shader
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, this.vertexSource);
        gl.compileShader(vertexShader);

        // create a fragment shader
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, this.fragmentSource);
        gl.compileShader(fragmentShader);

        // link the two shaders into a WebGL program
        this.program = gl.createProgram();
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);

        this.aPos = gl.getAttribLocation(this.program, 'a_pos');

        this.calculateVertices(gl);
    }


    // method fired on each animation frame
    render(gl, matrix) {

        this.calculateVertices(gl);

        gl.useProgram(this.program);
        gl.uniformMatrix4fv(
            gl.getUniformLocation(this.program, 'u_matrix'),
            false,
            matrix
        );
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.enableVertexAttribArray(this.aPos);
        gl.vertexAttribPointer(this.aPos, 2, gl.FLOAT, false, 0, 0);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        gl.drawArrays(gl.TRIANGLES, 0, this.positionLength / 2);
    }

    createHash(_str) {
        // console.log(_str)
        var hash = 0,
            i, chr;
        if (_str.length === 0) return hash;
        for (i = 0; i < _str.length; i++) {
            chr = _str.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;

    }

    getFeatureHash(f) {

        return this.createHash(`${f.layer.id}-${f.source}-${f.sourceLayer}-${JSON.stringify(f.properties)}-${JSON.stringify(f.geometry.coordinates)}-${f._vectorTileFeature._x}-${f._vectorTileFeature._y}-${f._vectorTileFeature._z}`)
    }

    getSlayerFeatures() {
        return this.keys;
    }

    calculateVertices(gl) {
        this.features = this.map.queryRenderedFeatures({ layers: this.fromLayers });
        // console.log(this.features);

        const strs = this.features.map(f => this.getFeatureHash(f));

        const polygons = this.features.filter(f => f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon');
        this.addFeature(polygons[0].geometry.coordinates)
        for (var p = 0; p < polygons.length; p++) {
            const hash = this.getFeatureHash(polygons[p]);
            // console.log(polygons[p]._vectorTileFeature.loadGeometry());
            if (this.keys.indexOf(hash) === -1) {
                this.addFeature(polygons[p].geometry);
                if (polygons[p].geometry.type === 'Polygon') {
                   // console.log('solo')
                    var data = earcut.flatten(polygons[p].geometry.coordinates);
                   // console.log(polygons[p].geometry.coordinates)
                    var triangles = earcut(data.vertices, data.holes, data.dimensions);
                   // console.log(triangles)

                    for (var i = 0; i < triangles.length; i++) {
                        if (data.vertices[triangles[i] * 2] && data.vertices[triangles[i] * 2 + 1]) {
                            const mercPos = maplibregl.MercatorCoordinate.fromLngLat({
                                lng: data.vertices[triangles[i] * 2],
                                lat: data.vertices[triangles[i] * 2 + 1]
                            });
                            // console.log(mercPos.x, mercPos.y)
                            this.positions.push(mercPos.x, mercPos.y);
                        }
                    }
                } else if (polygons[p].geometry.type === 'MultiPolygon') {
                   // console.log('multi')
                    const coords = polygons[p].geometry.coordinates;
                    // polygons[p]
                    // let coords = typeof polygons[p].geometry.coordinates[0] === 'number' ? polygons[p].geometry.coordinates : polygons[p].geometry.coordinates
                    coords.forEach((_c) => {
                        //console.log(_c)
                        _c.forEach((c, i) => {
                            const arr = [c]
                            var data = earcut.flatten(arr);
                            //console.log(c)
                            var triangles = earcut(data.vertices, data.holes, data.dimensions);
                            //console.log(triangles)
                            for (var i = 0; i < triangles.length; i++) {

                                if (data.vertices[triangles[i] * 2] && data.vertices[triangles[i] * 2 + 1]) {
                                    const mercPos = maplibregl.MercatorCoordinate.fromLngLat({
                                        lng: data.vertices[triangles[i] * 2],
                                        lat: data.vertices[triangles[i] * 2 + 1]
                                    });
                                    //console.log(mercPos.x, mercPos.y)
                                    this.positions.push(mercPos.x, mercPos.y);
                                }
                            }
                            // for (var i = 0; i < triangles.length; i++) {
                            //     if (data.vertices[triangles[i]]
                            //         && data.vertices[triangles[i]][0]
                            //         && data.vertices[triangles[i]][1]) {
                            //         const mercPos = maplibregl.MercatorCoordinate.fromLngLat({
                            //             lng: data.vertices[triangles[i]][0],
                            //             lat: data.vertices[triangles[i]][1]
                            //         });
                            //         this.positions.push(mercPos.x, mercPos.y);
                            //     }
                            // }
                        })
                    });

                } else {
                    console.log(polygons[p].geometry.type)
                }

            }
        }

        this.keys = this.keys.concat(strs.filter((f, i) => this.keys.indexOf(f) === -1));
        this.positionLength = this.positions.length;

        // create and initialize a WebGLBuffer to store vertex and color data
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(this.positions),
            gl.STATIC_DRAW,
            0
        );
    }


    addFeature(geometry) {
        const EARCUT_MAX_RINGS = 500;
        for (const polygon of classifyRings(geometry, EARCUT_MAX_RINGS)) {
            let numVertices = 0;
            for (const ring of polygon) {
                numVertices += ring.length;
            }

            //console.log(numVertices)

            const triangleSegment = this.segments.prepareSegment(numVertices, this.layoutVertexArray, this.indexArray);
            const triangleIndex = triangleSegment.vertexLength;

            const flattened = [];
            const holeIndices = [];

            for (const ring of polygon) {
                if (ring.length === 0) {
                    continue;
                }

                if (ring !== polygon[0]) {
                    holeIndices.push(flattened.length / 2);
                }

                const lineSegment = this.segments2.prepareSegment(ring.length, this.layoutVertexArray, this.indexArray2);
                const lineIndex = lineSegment.vertexLength;

                this.layoutVertexArray.emplaceBack(ring[0].x, ring[0].y);
                this.indexArray2.emplaceBack(lineIndex + ring.length - 1, lineIndex);
                flattened.push(ring[0].x);
                flattened.push(ring[0].y);

                for (let i = 1; i < ring.length; i++) {
                    this.layoutVertexArray.emplaceBack(ring[i].x, ring[i].y);
                    this.indexArray2.emplaceBack(lineIndex + i - 1, lineIndex + i);
                    flattened.push(ring[i].x);
                    flattened.push(ring[i].y);
                }

                lineSegment.vertexLength += ring.length;
                lineSegment.primitiveLength += ring.length;
            }

            const indices = earcut(flattened, holeIndices);

            for (let i = 0; i < indices.length; i += 3) {
                this.indexArray.emplaceBack(
                    triangleIndex + indices[i],
                    triangleIndex + indices[i + 1],
                    triangleIndex + indices[i + 2]);
            }

            triangleSegment.vertexLength += numVertices;
            triangleSegment.primitiveLength += indices.length / 3;
        }
        console.log(this.layoutVertexArray)
    }

}

// add the custom style layer to the map
// map.on('load', () => {
//     map.addLayer(highlightLayer, 'crimea-fill');
// });

