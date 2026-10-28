/* Fundo do site inteiro: fumaça espelhada que se torce devagar.
   É o shader da Kiu Tatu (ruído com domínio torcido espelhado num eixo vertical, brilho de cor,
   fios claros que a fumaça estica e veios de tinta preta cortando), nas cores da logo e em versão
   mais suave e mais lenta: azul de pedra com fios cor de pergaminho, mais densa nas laterais pra
   não brigar com o texto no meio. Sem mouse, sem rolagem.
   Fica numa tela fixa atrás de tudo, em resolução reduzida (é tudo desfocado, não perde nada),
   a 24 quadros; para quando a aba some e fica parada com movimento reduzido. */
(() => {
  "use strict";
  const cv = document.querySelector("[data-fumaca]");
  if (!cv) return;
  const gl = cv.getContext("webgl", { antialias: false, alpha: false, depth: false, powerPreference: "low-power" });
  if (!gl) { cv.remove(); return; }

  const CICLO = 110;  // segundos de uma volta inteira do fluxo (na Kiu: 24)
  const FORCA = .62;  // brilho da fumaça sobre o fundo (na Kiu é a tela toda acesa)

  const VS = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";
  const FS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;   // no celular, mediump estraga o ruído (a fumaça fica chapada e parada)
#else
precision mediump float;
#endif
uniform vec2 uRes; uniform float uFase; uniform float uForca;
uniform vec3 uFundo; uniform vec3 uCorA; uniform vec3 uCorB;
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float ruido(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*ruido(p);p=rot(.6)*p*2.02+vec2(1.7,9.2);a*=.5;}return s;}
/* cristas finas: 1-|2n-1| elevado, oitavas cada vez mais finas */
float crista(vec2 p){float s=0.,a=.6,pe=1.;
  for(int i=0;i<3;i++){float n=1.-abs(ruido(p)*2.-1.);n=pow(n,4.);s+=a*n*(.35+.65*pe);pe=n;p=rot(-.5)*p*2.1+vec2(3.1,.7);a*=.55;}
  return s;}

void main(){
  vec2 fc=gl_FragCoord.xy;
  float esc=min(uRes.x,uRes.y);
  vec2 c=vec2(cos(uFase),sin(uFase));
  /* espelho no meio da tela: x vira a distância até o eixo */
  vec2 p=vec2(abs(fc.x-.5*uRes.x),fc.y-.5*uRes.y)/esc;

  /* fumaça: sobe e se torce bem devagar (offsets em círculo = loop sem emenda) */
  vec2 q=p*1.35+vec2(0.,-.16)*sin(uFase);
  vec2 w=vec2(fbm(q+c*.2),fbm(q+vec2(5.2,1.3)-c.yx*.2));
  vec2 w2=vec2(fbm(q+w*1.5+vec2(1.7,9.2)+c*.22),fbm(q+w*1.5+vec2(8.3,2.8)-c*.22));
  float f0=fbm(q+w2*1.4);

  /* mais densa nas laterais, o meio fica com um véu leve */
  float lado=smoothstep(.12,.95,p.x*esc/uRes.x*2.);
  float zona=(.38+.62*lado)*smoothstep(1.4,.2,abs(p.y));
  float fum=smoothstep(.3,.88,f0*(.6+.4*zona)+zona*.08)*zona;
  float miolo=smoothstep(.56,.95,f0+zona*.1)*fum;
  float fio=smoothstep(.58,1.,crista(q*2.4+w2*2.+c*.12))*fum;
  /* veios de tinta preta e bolsões onde o fluxo dobra */
  float veio=smoothstep(.4,.74,crista(q*1.05+w2*1.2-c*.1))*smoothstep(.08,.4,fum);
  float bolsao=smoothstep(.42,.2,length(w2-w))*.5;

  vec3 col=uCorB*pow(fum,1.7)*1.1;
  col+=uCorA*miolo*.75;
  col+=vec3(.93,.86,.7)*fio*.32;
  col*=1.-clamp(veio*.85+bolsao*fum,0.,.92);
  col=uFundo+(1.-exp(-col*1.2))*uForca;

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
  const css = getComputedStyle(document.documentElement);
  const cor = (v, pad) => { const hx = (css.getPropertyValue(v).trim() || pad).replace("#", ""); return [0, 2, 4].map((i) => parseInt(hx.substr(i, 2), 16) / 255); };
  gl.uniform3fv(u("uFundo"), cor("--bg", "#0f0a07"));
  gl.uniform3fv(u("uCorA"), cor("--blue", "#7fb3e0"));       // miolo: azul claro das letras
  gl.uniform3fv(u("uCorB"), cor("--blue-deep", "#2c5aa0"));  // véu: azul fundo da pedra
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
  const desenhar = (agora) => { gl.uniform1f(uFase, (((agora - t0) / 1000 / CICLO) % 1) * Math.PI * 2); gl.drawArrays(gl.TRIANGLES, 0, 3); }; // fase em [0, 2π): o fluxo fecha o ciclo sem emenda
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
