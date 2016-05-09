const regl = require('../regl')()
const vectorizeText = require('vectorize-text')
const perspective = require('gl-mat4/perspective')
const lookAt = require('gl-mat4/lookAt')

const textMesh = vectorizeText('hello regl!', {
  textAlign: 'center',
  textBaseline: 'middle'
})

const feedBackTexture = regl.texture({
  copy: true,
  min: 'linear',
  mag: 'linear'
})

const drawFeedback = regl({
  frag: `
  precision mediump float;
  uniform sampler2D texture;
  uniform float t;
  varying vec2 uv;
  void main () {
    vec2 warp = uv + 0.01 * sin(t) * vec2(0.5 - uv.y, uv.x - 0.5)
      - 0.01 * (uv - 0.5);
    gl_FragColor = vec4(0.98 * texture2D(texture, warp).rgb, 1);
  }`,

  vert: `
  precision mediump float;
  attribute vec2 position;
  varying vec2 uv;
  void main () {
    uv = position;
    gl_Position = vec4(2.0 * position - 1.0, 0, 1);
  }`,

  attributes: {
    position: regl.buffer([-2, 0, 0, -2, 2, 2])
  },

  uniforms: {
    texture: feedBackTexture,
    t: (args, id, stats) => 0.001 * stats.count
  },

  depth: {enable: false},

  count: 3
})

const drawText = regl({
  frag: `
  precision mediump float;
  uniform float t;
  void main () {
    gl_FragColor = vec4(
      1.0 + cos(2.0 * t),
      1.0 + cos(2.1 * t + 1.0),
      1.0 + cos(2.2 * t + 2.0),
      1);
  }`,

  vert: `
  attribute vec2 position;
  uniform mat4 projection, view;
  void main () {
    gl_Position = projection * view * vec4(position, 0, 1);
  }`,

  attributes: {
    position: regl.buffer(textMesh.positions)
  },

  elements: regl.elements(textMesh.edges),

  uniforms: {
    t: (args, batchId, stats) => 0.01 * stats.count,

    view: (args, batchId, stats) => {
      var t = 0.01 * stats.count
      return lookAt([],
        [5 * Math.sin(t), 0, -5 * Math.cos(t)],
        [0, 0, 0],
        [0, -1, 0])
    },

    projection: (args, batchId, stats) =>
      perspective([],
        Math.PI / 4,
        stats.width / stats.height,
        0.01,
        1000)
  },

  depth: {enable: false}
})

regl.frame(() => {
  drawFeedback()
  drawText()
  feedBackTexture({
    copy: true,
    min: 'linear',
    mag: 'linear'
  })
})