/* Hero "agua": ondas de marea en WebGL (fragment shader), tonos teal que
   respiran despacio. Sin blur ni sombras por frame: todo el coste es un
   único fullscreen quad a media resolución, con DPR limitado a 1. Se pausa
   cuando el hero sale de pantalla o la pestaña se oculta. Si no hay WebGL
   o el usuario prefiere menos movimiento, no se crea nada y queda el
   degradado CSS (.agua-fallback) como primer frame estático. */
(function () {
  "use strict";

  var VERT = [
    "attribute vec2 a_pos;",
    "void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }"
  ].join("\n");

  var FRAG = [
    "precision mediump float;",
    "uniform vec2 u_res; uniform float u_time; uniform vec2 u_mouse; uniform float u_mouseAmt;",
    "float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }",
    "float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);",
    "  return mix(mix(hash(i), hash(i+vec2(1.0,0.0)), f.x), mix(hash(i+vec2(0.0,1.0)), hash(i+vec2(1.0,1.0)), f.x), f.y); }",
    "float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a*noise(p); p = p*2.03 + vec2(1.7, 9.2); a *= 0.5; } return v; }",
    "void main(){",
    "  vec2 uv = gl_FragCoord.xy / u_res; float ar = u_res.x / u_res.y; vec2 p = vec2(uv.x*ar, uv.y);",
    "  float t = u_time * 0.045;",
    "  vec2 q = vec2(fbm(p*1.4 + t*0.6), fbm(p*1.4 - t*0.45 + 3.1));",
    "  float n = fbm(p*2.0 + q*1.5 + t);",
    "  float rip = sin((p.x*5.0 + n*4.0) + t*7.0)*0.5 + 0.5;",
    "  rip *= sin((p.y*4.5 - n*3.0) - t*5.5)*0.5 + 0.5;",
    "  vec2 m = vec2(u_mouse.x*ar, u_mouse.y); float d = length(p - m);",
    "  float ring = sin(d*26.0 - u_time*2.6) * exp(-d*3.2) * u_mouseAmt * 0.06;",
    "  vec3 deep = vec3(0.039, 0.290, 0.369);",   // #0A4A5E
    "  vec3 mid  = vec3(0.059, 0.431, 0.549);",   // #0F6E8C
    "  vec3 lit  = vec3(0.247, 0.690, 0.788);",   // #3FB0C9
    "  vec3 foam = vec3(0.969, 0.957, 0.933);",   // #F7F4EE
    "  vec3 col = mix(deep, mid, smoothstep(0.25, 0.75, n));",
    "  col = mix(col, lit, smoothstep(0.58, 0.95, n) * 0.55);",
    "  col += foam * pow(rip, 7.0) * 0.16;",
    "  col += ring;",
    "  col = mix(col, foam, smoothstep(0.72, 1.25, uv.y) * 0.32);",
    "  col *= 1.0 - 0.16 * length(uv - 0.5);",
    "  gl_FragColor = vec4(col, 1.0);",
    "}"
  ].join("\n");

  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  function createAguaScene(canvas, opts) {
    opts = opts || {};
    var gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power", preserveDrawingBuffer: false })
      || canvas.getContext("experimental-webgl", { antialias: false, alpha: false });
    if (!gl) return null;

    var vs = compile(gl, gl.VERTEX_SHADER, VERT);
    var fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return null;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    var uRes = gl.getUniformLocation(prog, "u_res");
    var uTime = gl.getUniformLocation(prog, "u_time");
    var uMouse = gl.getUniformLocation(prog, "u_mouse");
    var uMouseAmt = gl.getUniformLocation(prog, "u_mouseAmt");

    // Media resolución: el ruido es suave, no se nota, y divide el coste por 4.
    var SCALE = opts.scale || 0.5;
    var w = 0, h = 0;
    function resize() {
      var rect = canvas.getBoundingClientRect();
      var nw = Math.max(1, Math.round(rect.width * SCALE));
      var nh = Math.max(1, Math.round(rect.height * SCALE));
      if (nw === w && nh === h) return;
      w = nw; h = nh;
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
    }

    var mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, amt: 0, tamt: 0 };
    function onMove(e) {
      var rect = canvas.getBoundingClientRect();
      mouse.tx = (e.clientX - rect.left) / rect.width;
      mouse.ty = 1 - (e.clientY - rect.top) / rect.height;
      mouse.tamt = 1;
    }
    function onLeave() { mouse.tamt = 0; }
    if (window.matchMedia("(pointer: fine)").matches) {
      canvas.parentElement.addEventListener("pointermove", onMove, { passive: true });
      canvas.parentElement.addEventListener("pointerleave", onLeave, { passive: true });
    }

    var running = false, raf = 0, start = performance.now(), last = start;
    var visible = true, pageVisible = !document.hidden;

    function frame(now) {
      raf = 0;
      if (!running) return;
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      resize();
      var k = 1 - Math.pow(0.001, dt); // lerp independiente del framerate
      mouse.x += (mouse.tx - mouse.x) * k * 0.6;
      mouse.y += (mouse.ty - mouse.y) * k * 0.6;
      mouse.amt += (mouse.tamt - mouse.amt) * k * 0.5;
      gl.uniform1f(uTime, (now - start) / 1000);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform1f(uMouseAmt, mouse.amt);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(frame);
    }
    function play() {
      if (running || !visible || !pageVisible) return;
      running = true; last = performance.now();
      raf = requestAnimationFrame(frame);
    }
    function pause() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }
    function renderOnce() {
      resize();
      gl.uniform1f(uTime, 0);
      gl.uniform2f(uMouse, 0.5, 0.5);
      gl.uniform1f(uMouseAmt, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) play(); else pause();
      }, { threshold: 0.02 }).observe(canvas);
    }
    document.addEventListener("visibilitychange", function () {
      pageVisible = !document.hidden;
      if (pageVisible) play(); else pause();
    });
    window.addEventListener("resize", resize, { passive: true });

    return { play: play, pause: pause, renderOnce: renderOnce, gl: gl };
  }

  window.createAguaScene = createAguaScene;
})();
