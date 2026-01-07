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
       error: new Audio('src/sonidos/incorrecto.mp3') // <-- Cambiado de 'incorrecto' a 'error' para coincidir con niveles
   };
   
   sonidos.intro.loop = true;
   sonidos.intro.volume = 0.5;
   sonidos.pasos.loop = true;
   
   const mapImg = new Image(); 
   mapImg.src = 'src/imgs/fondos/fondo.png'; 
   const playerImg = new Image(); 
   playerImg.src = 'src/imgs/protagonistas/Niña 01.png';
   
   // --- ESTADO GLOBAL ---
   let player = { x: 80, y: 520, speed: 5, w: 60, h: 70 };
   let gameActive = false;
   let gamePaused = false; 
   let estaEnNivel = false; 
   let puntosTotales = 0;
   let zonasCompletadas = 0; 
   const keys = {};
   
   const PUNTOS_ENTRADA = {
       zona1: { x: 458, y: 510, radio: 55, color: "rgba(255, 215, 0, 0.8)", id: 0 },
       zona2: { x: 330, y: 283, radio: 55, color: "rgba(173, 255, 47, 0.8)", id: 1 },
       zona3: { x: 560, y: 80, radio: 55, color: "rgba(0, 255, 255, 0.8)", id: 2 },
       tesoro: { x: 860, y: 60, radio: 60, color: "rgba(255, 69, 0, 0.9)", id: 3 }
   };
   
   // --- CONTROLES (TECLADO Y TÁCTIL) ---
   window.addEventListener('keydown', e => { if(!gamePaused) keys[e.code] = true; });
   window.addEventListener('keyup', e => keys[e.code] = false);
   
   function vincularControlesTactiles() {
       const btnLeft = document.getElementById('btn-left');
       const btnRight = document.getElementById('btn-right');
       const btnJump = document.getElementById('btn-jump');
   
       if (btnLeft) {
           btnLeft.onpointerdown = (e) => { e.preventDefault(); keys['ArrowLeft'] = true; };
           btnLeft.onpointerup = (e) => { e.preventDefault(); keys['ArrowLeft'] = false; };
           btnLeft.onpointerleave = () => keys['ArrowLeft'] = false;
       }
       if (btnRight) {
           btnRight.onpointerdown = (e) => { e.preventDefault(); keys['ArrowRight'] = true; };
           btnRight.onpointerup = (e) => { e.preventDefault(); keys['ArrowRight'] = false; };
           btnRight.onpointerleave = () => keys['ArrowRight'] = false;
       }
       if (btnJump) {
           // En el mapa principal, el botón de salto actúa como flecha arriba para moverse
           btnJump.onpointerdown = (e) => { e.preventDefault(); keys['ArrowUp'] = true; };
           btnJump.onpointerup = (e) => { e.preventDefault(); keys['ArrowUp'] = false; };
           btnJump.onpointerleave = () => keys['ArrowUp'] = false;
       }
   }
   
   function mostrarAviso(texto) {
       const aviso = document.createElement('div');
       aviso.style.cssText = `position:fixed; top:20%; left:50%; transform:translateX(-50%); background:rgba(255,0,0,0.8); color:white; padding:10px 20px; border-radius:5px; font-family:'Press Start 2P'; font-size:10px; z-index:10000;`;
       aviso.innerText = texto;
       document.body.appendChild(aviso);
       sonidos.error.play().catch(()=>{}); // <-- Actualizado a .error
       setTimeout(() => aviso.remove(), 2000);
   }
   
   function initUI() {
       const btnStart = document.getElementById('start-game');
       const btnHowTo = document.getElementById('how-to');
       const btnCloseHowTo = document.getElementById('close-howto');
       const btnPause = document.getElementById('btn-pause');
   
       vincularControlesTactiles();
   
       if(btnStart) {
           btnStart.onclick = () => {
               document.getElementById('menu').classList.add('hidden');
               document.getElementById('map-screen').classList.remove('hidden');
               document.getElementById('mobile-controls').classList.remove('hidden'); // Mostrar botones
               btnPause.classList.remove('hidden'); 
               sonidos.intro.play().catch(() => {});
               gameActive = true;
               gameLoop();
           };
       }
   
       if(btnPause) {
           btnPause.onclick = () => {
               gamePaused = !gamePaused;
               const modal = document.getElementById('trivia-modal');
               const titulo = document.getElementById('trivia-title');
               const container = document.getElementById('options-container');
   
               if (gamePaused) {
                   sonidos.pasos.pause();
                   modal.classList.remove('hidden');
                   titulo.innerText = "PAUSA";
                   container.innerHTML = `
                       <div style="text-align:center;">
                           <p style="color:white; margin-bottom:20px;">Expedición detenida temporalmente.</p>
                           <button class="choice" id="btn-resume-game">VOLVER AL JUEGO</button>
                           <button class="choice" id="btn-quit-game" style="background:#ff4444; margin-top:10px;">MENÚ PRINCIPAL</button>
                       </div>
                   `;
                   document.getElementById('btn-resume-game').onclick = () => {
                       modal.classList.add('hidden');
                       gamePaused = false;
                   };
                   document.getElementById('btn-quit-game').onclick = () => location.reload();
               } else {
                   modal.classList.add('hidden');
               }
           };
       }
   
       if(btnHowTo) { btnHowTo.onclick = () => { document.getElementById('menu').classList.add('hidden'); document.getElementById('howto-screen').classList.remove('hidden'); }; }
       if(btnCloseHowTo) { btnCloseHowTo.onclick = () => { document.getElementById('howto-screen').classList.add('hidden'); document.getElementById('menu').classList.remove('hidden'); }; }
   }
   
   function gameLoop() {
       if (gameActive && !gamePaused && !estaEnNivel) {
           update();
           draw();
       }
       requestAnimationFrame(gameLoop);
   }
   
   function update() {
       let moviendose = false;
       // Soporte para flechas y WASD
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
           entrarANivel(iniciarZona1);
       } 
       else if (d2 < PUNTOS_ENTRADA.zona2.radio) {
           if (zonasCompletadas >= 1) entrarANivel(iniciarZona2);
           else mostrarAviso("BLOQUEADO: Supera la Zona 1 primero");
       } 
       else if (d3 < PUNTOS_ENTRADA.zona3.radio) {
           if (zonasCompletadas >= 2) entrarANivel(iniciarZona3);
           else mostrarAviso("BLOQUEADO: Supera la Zona 2 primero");
       } 
       else if (dT < PUNTOS_ENTRADA.tesoro.radio) {
           if (zonasCompletadas >= 3) mostrarCofreFinal();
           else mostrarAviso("BLOQUEADO: Reúne las 3 gemas primero");
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
   
       // Re-vincular controles por si el nivel los limpió
       vincularControlesTactiles();
       document.getElementById('mobile-controls').classList.remove('hidden');
   
       const displayPuntos = document.getElementById('gem-count');
       if(displayPuntos) displayPuntos.innerText = puntosTotales;
   
       document.getElementById('map-screen').classList.remove('hidden');
   
       sonidos.victoria.play().catch(()=>{});
       setTimeout(() => { if(!estaEnNivel && !gamePaused) sonidos.intro.play().catch(()=>{}); }, 1000);
       
       player.x += 80; // Alejar al jugador del punto de entrada
       player.y += 40;
   }
   
   function draw() {
       ctx.clearRect(0, 0, canvas.width, canvas.height);
       if (mapImg.complete) ctx.drawImage(mapImg, 0, 0, canvas.width, canvas.height);
       
       function dibujarIndicador(punto, emoji, bloqueado) {
           ctx.save();
           ctx.shadowBlur = 15;
           ctx.shadowColor = bloqueado ? "gray" : punto.color;
           ctx.font = "40px Arial";
           ctx.textAlign = "center";
           ctx.textBaseline = "middle";
           ctx.fillText(bloqueado ? "🔒" : emoji, punto.x, punto.y);
           ctx.restore();
       }
   
       dibujarIndicador(PUNTOS_ENTRADA.zona1, "💎", false);
       dibujarIndicador(PUNTOS_ENTRADA.zona2, "💎", zonasCompletadas < 1);
       dibujarIndicador(PUNTOS_ENTRADA.zona3, "💎", zonasCompletadas < 2);
       dibujarIndicador(PUNTOS_ENTRADA.tesoro, "👑", zonasCompletadas < 3);
   
       if (playerImg.complete) {
           ctx.drawImage(playerImg, player.x - (player.w/2), player.y - (player.h/2), player.w, player.h);
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