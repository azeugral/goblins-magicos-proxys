/* Fundo do site inteiro: fumaça bem fraca subindo devagar, só pra dar um movimento a mais.
   É o shader do site do Zaparolli (ruído com domínio torcido que sobe; dois campos defasados
   meio ciclo, trocados por peso triangular, então o ciclo fecha sem emenda), em versão ainda
   mais suave e lenta: véus marrons quentes e fios apagados, rente às laterais e ao pé da tela,
   com o centro livre pro conteúdo. Sem reflexo, sem mouse, sem rolagem.
   Fica numa tela fixa atrás de tudo, em resolução reduzida (é tudo desfocado, não perde nada),
   a 24 quadros; para quando a aba some e fica parada com movimento reduzido. */
(() => {
  "use strict";
  const cv = document.querySelector("[data-fumaca]");
  if (!cv) return;
  const gl = cv.getContext("webgl", { antialias: false, alpha: false, depth: false, powerPreference: "low-power" });
  if (!gl) { cv.remove(); return; }

  const CICLO = 96;   // segundos pra fumaça subir um ciclo inteiro (no Zaparolli: 64)
  const FORCA = .5;   // brilho da fumaça (no Zaparolli: .8)

  const VS = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";
  const FS = `
precision mediump float;
uniform vec2 uRes; uniform float uFase; uniform float uForca; uniform vec3 uFundo;
#define TAU 6.28318530718
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float ruido(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*ruido(p);p=rot(.55)*p*2.03+vec2(1.7,9.2);a*=.5;}return s;}

/* um campo de fumaça subindo "sobe" unidades; c gira em círculo e torce sem emendar */
vec2 campo(vec2 p, float sobe, vec2 c){
  vec2 q=p+vec2(0.,-sobe);
  vec2 w=vec2(fbm(q*.8+c*.14),fbm(q*.8+vec2(5.2,1.3)-c.yx*.14));
  vec2 w2=vec2(fbm(q+w*1.2+vec2(1.7,9.2)),fbm(q+w*1.2+vec2(8.3,2.8)));
  float f=fbm(q*1.05+w2*1.1);
  float fio=pow(1.-abs(fbm(q*1.4+w2*1.6+w)*2.-1.),7.);
  return vec2(f,fio);
}

void main(){
  vec2 fc=gl_FragCoord.xy;
  vec2 c01=fc/uRes;
  float esc=min(uRes.x,uRes.y);
  vec2 p=fc/esc*vec2(1.2,1.);
  vec2 c=vec2(cos(uFase),sin(uFase));

  float t=uFase/TAU;
  float fa=fract(t), fb=fract(t+.5);
  vec2 A=campo(p,fa*.8,c), B=campo(p+vec2(3.7,1.9),fb*.8,c);
  vec2 F=mix(B,A,1.-abs(fa*2.-1.));

  /* rente às laterais e ao pé da tela, centro livre (a versão "calma" do Zaparolli) */
  float ld=1.-smoothstep(.0,.34,min(c01.x,1.-c01.x));
  float pe=1.-smoothstep(.0,.42,c01.y);
  float zona=clamp(ld*.8+pe*.55,0.,1.)*.85;

  float veu=smoothstep(.32,.95,F.x*(.7+.4*zona)+zona*.1)*zona;
  float fio=F.y*smoothstep(.05,.5,veu+zona*.2)*zona;

  /* véu marrom quente e fio cor de pergaminho, os dois bem apagados */
  vec3 veuCor=vec3(.40,.33,.24), fioCor=vec3(.86,.78,.62);
  vec3 col=(veuCor*pow(veu,1.3)*.8+fioCor*fio*.18)*uForca;

  col=uFundo+col;
  col+=(fract(52.9829189*fract(dot(fc,vec2(.06711056,.00583715))))-.5)/255.;
  gl_FragColor=vec4(col,1.);
}`;

  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(o); return o; };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(pr); gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const a = gl.getAttribLocation(pr, "a"); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
  const u = (n) => gl.getUniformLocation(pr, n);
  const uRes = u("uRes"), uFase = u("uFase");
  const hx = (getComputedStyle(document.documentElement).getPropertyValue("--bg").trim() || "#0f0a07").replace("#", "");
  gl.uniform3fv(u("uFundo"), [0, 2, 4].map((i) => parseInt(hx.substr(i, 2), 16) / 255));
  gl.uniform1f(u("uForca"), FORCA);

  const reduzido = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const toque = matchMedia("(pointer: coarse)").matches;
  const ESCALA = toque ? .35 : .45;   // pixels do canvas por pixel CSS
  let w = 0, h = 0;
  function medir() {
    const nw = Math.round(innerWidth * ESCALA);
    const nh = Math.round(Math.max(innerHeight, toque ? screen.height : 0) * ESCALA);
    if (nw === w && Math.abs(nh - h) < 40) return; // a barra do navegador no celular não refaz o canvas
    w = cv.width = nw; h = cv.height = nh;
    gl.viewport(0, 0, w, h);
    gl.uniform2f(uRes, w, h);
  }

  const t0 = performance.now() - Math.random() * CICLO * 1000; // cada visita começa num ponto do ciclo
  let ultimo = 0, rodando = false;
  const desenhar = (agora) => { gl.uniform1f(uFase, ((agora - t0) / 1000 / CICLO) * Math.PI * 2); gl.drawArrays(gl.TRIANGLES, 0, 3); };
  function quadro(agora) {
    if (!rodando) return;
    requestAnimationFrame(quadro);
    if (agora - ultimo < 41) return; // 24 quadros bastam pra algo tão lento
    ultimo = agora;
    desenhar(agora);
  }
  const ligar = () => { if (rodando || reduzido) return; rodando = true; requestAnimationFrame(quadro); };

  medir();
  addEventListener("resize", () => { medir(); desenhar(performance.now()); }, { passive: true });
  document.addEventListener("visibilitychange", () => { if (document.hidden) rodando = false; else ligar(); });
  desenhar(performance.now());
  cv.classList.add("is-on");
  ligar();
})();
