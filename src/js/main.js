/* ======================================================================
   EXPEDICIÓN A LA MONTAÑA SAGRADA - ARCHIVO PRINCIPAL (main.js)
   ====================================================================== */
   import { iniciarZona1 } from './niveles/zona1.js';
   import { iniciarZona2 } from './niveles/zona2.js';
   import { iniciarZona3 } from './niveles/zona3.js';
   
   const canvas = document.getElementById('map-canvas');
   const ctx = canvas.getContext('2d');
   
   // --- SISTEMA DE SONIDOS ---
   export const sonidos = {
       intro: new Audio('src/sonidos/intro.mp3'),
       pasos: new Audio('src/sonidos/adelante.mp3'),
       victoria: new Audio('src/sonidos/nivel_completado.mp3'),
       salto: new Audio('src/sonidos/salto.mp3'),
       abrirCofre: new Audio('src/sonidos/abrir.mp3'),
       correcto: new Audio('src/sonidos/correcto.mp3'),
       error: new Audio('src/sonidos/incorrecto.mp3') 
   };
   
   sonidos.intro.loop = true;
   sonidos.intro.volume = 0.5;
   sonidos.pasos.loop = true;
   
   const mapImg = new Image(); 
   mapImg.src = 'src/imgs/fondos/fondo.png'; 
   const playerImg = new Image(); 
   playerImg.src = 'src/imgs/protagonistas/Niña 01.png';
   
   // --- ESTADO GLOBAL ---
   let player = { x: 450, y: 300, speed: 5, w: 60, h: 70 };
   let gameActive = false;
   let gamePaused = false; 
   let estaEnNivel = false; 
   let puntosTotales = 0;
   let zonasCompletadas = 0; 
   const keys = {};
   let requestID = null;
   
   const PUNTOS_ENTRADA = {
       zona1: { x: 458, y: 510, radio: 25, color: "rgba(255, 215, 0, 0.8)", id: 0 },
       zona2: { x: 330, y: 283, radio: 25, color: "rgba(173, 255, 47, 0.8)", id: 1 },
       zona3: { x: 560, y: 80, radio: 25, color: "rgba(0, 255, 255, 0.8)", id: 2 },
       tesoro: { x: 680, y: 60, radio: 30, color: "rgba(255, 69, 0, 0.9)", id: 3 }
   };
   
   // --- ADAPTACIÓN DE PANTALLA (RESPONSIVE) ---
   function resizeGame() {
       const width = window.innerWidth;
       const height = window.innerHeight;
       const baseWidth = 900;
       const baseHeight = 600;
       const scale = Math.min(width / baseWidth, height / baseHeight);
       document.documentElement.style.setProperty('--game-scale', scale * 0.98);
   }
   
   window.addEventListener('resize', resizeGame);
   window.addEventListener('load', resizeGame);
   resizeGame();
   
   // --- CONTROLES ---
   window.addEventListener('keydown', e => { if(!gamePaused) keys[e.code] = true; });
   window.addEventListener('keyup', e => keys[e.code] = false);
   
   function vincularControlesTactiles() {
       const btnLeft = document.getElementById('btn-left');
       const btnRight = document.getElementById('btn-right');
       const btnJump = document.getElementById('btn-jump');
   
       if (btnLeft) {
           btnLeft.onpointerdown = (e) => { e.preventDefault(); if(!gamePaused) keys['ArrowLeft'] = true; };
           btnLeft.onpointerup = (e) => { e.preventDefault(); keys['ArrowLeft'] = false; };
       }
       if (btnRight) {
           btnRight.onpointerdown = (e) => { e.preventDefault(); if(!gamePaused) keys['ArrowRight'] = true; };
           btnRight.onpointerup = (e) => { e.preventDefault(); keys['ArrowRight'] = false; };
       }
       if (btnJump) {
           btnJump.onpointerdown = (e) => { e.preventDefault(); if(!gamePaused) keys['ArrowUp'] = true; };
           btnJump.onpointerup = (e) => { e.preventDefault(); keys['ArrowUp'] = false; };
       }
   }
   
   function mostrarAviso(texto) {
       const avisoExistente = document.querySelector('.aviso-game');
       if (avisoExistente) avisoExistente.remove();
       const aviso = document.createElement('div');
       aviso.className = 'aviso-game';
       aviso.style.cssText = `position:fixed; top:20%; left:50%; transform:translateX(-50%); background:rgba(255,0,0,0.8); color:white; padding:10px 20px; border-radius:5px; font-family: sans-serif; font-size:12px; z-index:10000; text-align:center; box-shadow: 0 0 10px black;`;
       aviso.innerText = texto;
       document.body.appendChild(aviso);
       sonidos.error.play().catch(()=>{});
       setTimeout(() => aviso.remove(), 2000);
   }
   
   function initUI() {
       const btnStart = document.getElementById('start-game');
       const btnPause = document.getElementById('btn-pause');
       
       // CORRECCIÓN DE IDs PARA QUE COINCIDAN CON TU HTML
       const btnHowTo = document.getElementById('how-to'); 
       const btnCloseHowTo = document.getElementById('close-howto');
       const screenHowTo = document.getElementById('howto-screen');
       const menu = document.getElementById('menu');
   
       vincularControlesTactiles();
   
       if(btnStart) {
           btnStart.onclick = () => {
               menu.classList.add('hidden');
               document.getElementById('map-screen').classList.remove('hidden');
               document.getElementById('mobile-controls').classList.remove('hidden');
               btnPause.classList.remove('hidden'); 
               sonidos.intro.play().catch(() => {});
               gameActive = true;
               gameLoop();
           };
       }
   
       // Lógica para mostrar "Cómo jugar"
       if(btnHowTo) {
           btnHowTo.onclick = () => {
               screenHowTo.classList.remove('hidden');
           };
       }
   
       // Lógica para cerrar "Cómo jugar"
       if(btnCloseHowTo) {
           btnCloseHowTo.onclick = () => {
               screenHowTo.classList.add('hidden');
           };
       }
   
       if(btnPause) {
           btnPause.onclick = () => {
               gamePaused = !gamePaused;
               if (gamePaused) {
                   btnPause.innerText = "REANUDAR";
                   sonidos.intro.pause();
                   sonidos.pasos.pause();
                   Object.keys(keys).forEach(k => keys[k] = false);
               } else {
                   btnPause.innerText = "PAUSA";
                   if(!estaEnNivel) sonidos.intro.play().catch(() => {});
               }
           };
       }
   }
   
   function gameLoop() {
       if (gameActive && !estaEnNivel) {
           if (!gamePaused) update();
           draw();
       }
       requestID = requestAnimationFrame(gameLoop);
   }
   
   function update() {
       let moviendose = false;
       if (keys['ArrowUp'] || keys['KeyW']) { player.y -= player.speed; moviendose = true; }
       if (keys['ArrowDown'] || keys['KeyS']) { player.y += player.speed; moviendose = true; }
       if (keys['ArrowLeft'] || keys['KeyA']) { player.x -= player.speed; moviendose = true; }
       if (keys['ArrowRight'] || keys['KeyD']) { player.x += player.speed; moviendose = true; }
   
       if (moviendose) {
           if (sonidos.pasos.paused) sonidos.pasos.play().catch(()=>{});
       } else {
           sonidos.pasos.pause();
       }
   
       player.x = Math.max(20, Math.min(canvas.width - 20, player.x));
       player.y = Math.max(20, Math.min(canvas.height - 20, player.y));
       verificarEntradaNivel();
   }
   
   function verificarEntradaNivel() {
       if (estaEnNivel || gamePaused) return;
   
       const d1 = Math.sqrt((player.x - PUNTOS_ENTRADA.zona1.x)**2 + (player.y - PUNTOS_ENTRADA.zona1.y)**2);
       const d2 = Math.sqrt((player.x - PUNTOS_ENTRADA.zona2.x)**2 + (player.y - PUNTOS_ENTRADA.zona2.y)**2);
       const d3 = Math.sqrt((player.x - PUNTOS_ENTRADA.zona3.x)**2 + (player.y - PUNTOS_ENTRADA.zona3.y)**2);
       const dT = Math.sqrt((player.x - PUNTOS_ENTRADA.tesoro.x)**2 + (player.y - PUNTOS_ENTRADA.tesoro.y)**2);
   
       if (d1 < PUNTOS_ENTRADA.zona1.radio) {
           if (zonasCompletadas === 0) entrarANivel(iniciarZona1);
           else mostrarAviso("YA COMPLETADO");
       } 
       else if (d2 < PUNTOS_ENTRADA.zona2.radio) {
           if (zonasCompletadas === 1) entrarANivel(iniciarZona2);
           else if (zonasCompletadas < 1) mostrarAviso("BLOQUEADO: Supera la Zona 1");
       } 
       else if (d3 < PUNTOS_ENTRADA.zona3.radio) {
           if (zonasCompletadas === 2) entrarANivel(iniciarZona3);
           else if (zonasCompletadas < 2) mostrarAviso("BLOQUEADO: Supera la Zona 2");
       } 
       else if (dT < PUNTOS_ENTRADA.tesoro.radio) {
           if (zonasCompletadas >= 3) mostrarCofreFinal();
           else mostrarAviso("BLOQUEADO: Reúne las 3 gemas");
       }
   }
   
   function entrarANivel(funcionNivel) {
       estaEnNivel = true;
       sonidos.intro.pause();
       sonidos.pasos.pause();
       Object.keys(keys).forEach(k => keys[k] = false);
       funcionNivel(finalizarNivel);
   }
   
   function finalizarNivel(puntosObtenidos = 0) {
       estaEnNivel = false;
       puntosTotales += puntosObtenidos;
       zonasCompletadas++; 
       vincularControlesTactiles();
       document.getElementById('mobile-controls').classList.remove('hidden');
       const displayPuntos = document.getElementById('gem-count');
       if(displayPuntos) displayPuntos.innerText = puntosTotales;
       document.getElementById('map-screen').classList.remove('hidden');
       sonidos.victoria.play().catch(()=>{});
       setTimeout(() => { if(!estaEnNivel && !gamePaused) sonidos.intro.play().catch(()=>{}); }, 1000);
       player.x += 40; 
       player.y += 40;
   }
   
   function draw() {
       ctx.clearRect(0, 0, canvas.width, canvas.height);
       if (mapImg.complete) ctx.drawImage(mapImg, 0, 0, canvas.width, canvas.height);
       
       function dibujarIndicador(punto, emoji, estado) {
           ctx.save();
           ctx.shadowBlur = (estado === 1) ? 20 : 5;
           ctx.shadowColor = (estado === 0) ? "gray" : (estado === 2) ? "white" : punto.color;
           ctx.font = "40px Arial";
           ctx.textAlign = "center";
           ctx.textBaseline = "middle";
           if (estado === 0) ctx.fillText("🔒", punto.x, punto.y);
           else if (estado === 2) {
               ctx.globalAlpha = 0.5;
               ctx.fillText("✅", punto.x, punto.y);
           } else {
               ctx.fillText(emoji, punto.x, punto.y);
           }
           ctx.restore();
       }
   
       dibujarIndicador(PUNTOS_ENTRADA.zona1, "💎", zonasCompletadas === 0 ? 1 : 2);
       dibujarIndicador(PUNTOS_ENTRADA.zona2, "💎", zonasCompletadas < 1 ? 0 : (zonasCompletadas === 1 ? 1 : 2));
       dibujarIndicador(PUNTOS_ENTRADA.zona3, "💎", zonasCompletadas < 2 ? 0 : (zonasCompletadas === 2 ? 1 : 2));
       dibujarIndicador(PUNTOS_ENTRADA.tesoro, "👑", zonasCompletadas < 3 ? 0 : 1);
   
       if (playerImg.complete) {
           ctx.drawImage(playerImg, player.x - (player.w/2), player.y - (player.h/2), player.w, player.h);
       }
   
       if (gamePaused) {
           ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
           ctx.fillRect(0, 0, canvas.width, canvas.height);
           ctx.fillStyle = "white";
           ctx.font = "30px sans-serif";
           ctx.textAlign = "center";
           ctx.fillText("JUEGO EN PAUSA", canvas.width/2, canvas.height/2);
       }
   }
   
   function mostrarCofreFinal() {
       estaEnNivel = true;
       sonidos.pasos.pause();
       sonidos.intro.pause();
       sonidos.abrirCofre.play().catch(()=>{});
       const finalScreen = document.getElementById('final-treasure-screen');
       const chest = document.getElementById('treasure-chest-anim');
       finalScreen.classList.remove('hidden');
   
       setTimeout(() => {
           chest.classList.replace('chest-closed', 'chest-open');
           sonidos.victoria.play().catch(()=>{});
           let mensaje, color;
           if (puntosTotales >= 15) { mensaje = "🌟 ¡CONCIENCIA BRILLANTE!"; color = "#FFD700"; }
           else if (puntosTotales >= 7) { mensaje = "🌱 CONCIENCIA EN CRECIMIENTO"; color = "#ADFF2F"; }
           else { mensaje = "🧩 CONCIENCIA EN CONSTRUCCIÓN"; color = "#FFA500"; }
           document.getElementById('final-rank-text').innerText = mensaje;
           document.getElementById('final-rank-text').style.color = color;
           document.getElementById('stats-summary').innerHTML = `Has reunido <strong>${puntosTotales} gemas</strong>.<br><br>¡El tesoro es tu encuentro con Dios!`;
       }, 1200);
   
       document.getElementById('btn-restart').onclick = () => location.reload();
   }
   
   initUI();