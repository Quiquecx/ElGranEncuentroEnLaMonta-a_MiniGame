/* ======================================================================
   ZONA 2: EL SENDERO DEL ESPÍRITU (Profetas y Dilemas) - COMPLETO
   ====================================================================== */
   import { zona2Data } from '../../data/preguntas.js';
   import { sonidos } from '../main.js'; 
   
   export function iniciarZona2(onComplete) {
       const canvas = document.getElementById('map-canvas');
       const ctx = canvas.getContext('2d');
       const modal = document.getElementById('trivia-modal');
       const container = document.getElementById('options-container');
       const titulo = document.getElementById('trivia-title');
       const imgElement = document.getElementById('current-sacramento-img');
       const gemDisplay = document.getElementById('gem-count');
   
       const VIEWPORT_WIDTH = 900;
       const WORLD_WIDTH = 3000; 
       const GROUND_Y = 450;
       
       let nivelActivo = false;
       let esperandoRespuesta = false;
       let cameraX = 0;
       let retosCompletados = 0;
       let requestID = null;
   
       const assets = {
           fondo: new Image(),
           player: new Image(),
           cofreCerrado: new Image(),
           cofreAbierto: new Image()
       };
       assets.fondo.src = 'src/imgs/fondos/fondo_level2.png';
       assets.player.src = 'src/imgs/protagonistas/Niña 01.png';
       assets.cofreCerrado.src = 'src/imgs/general/L8 Cofre cerrado.png';
       assets.cofreAbierto.src = 'src/imgs/general/L8 Cofre abierto.png';
   
       let player = { 
           x: 100, y: GROUND_Y, w: 70, h: 90, 
           speed: 6, vy: 0, gravity: 0.6, jumpPower: -14, 
           isJumping: false, facingRight: true 
       };
   
       const keys = {};
   
       // --- DISTRIBUCIÓN DINÁMICA DE COFRES ---
       const inicioX = 700;
       const finX = WORLD_WIDTH - 500;
       const intervalo = (finX - inicioX) / (zona2Data.length - 1 || 1);
   
       let cofres = zona2Data.map((data, i) => ({
           ...data,
           x: inicioX + (i * intervalo), 
           y: 475,
           w: 60, h: 60,
           abierto: false
       }));
   
       const handleKeyDown = (e) => { 
           keys[e.code] = true; 
           if ((e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') && !player.isJumping && !esperandoRespuesta && nivelActivo) {
               player.vy = player.jumpPower; 
               player.isJumping = true;
               sonidos.salto.currentTime = 0;
               sonidos.salto.play().catch(() => {});
           }
       };
       const handleKeyUp = (e) => keys[e.code] = false;
   
       function mostrarMensajeInicio() {
           esperandoRespuesta = true;
           modal.classList.remove('hidden');
           imgElement.classList.add('hidden');
           
           titulo.innerText = "EL SENDERO DEL ESPÍRITU";
           container.innerHTML = `
               <p style="color:white; margin-bottom:20px; text-align:center; font-family:'Avenir-Next', sans-serif;">
                   Escucha a los profetas y resuelve los dilemas para fortalecer tu espíritu.
               </p>
               <button class="choice" id="btn-comenzar-z2" style="width: 200px; margin: 0 auto;">¡COMENZAR!</button>
           `;
           
           document.getElementById('btn-comenzar-z2').onclick = () => {
               modal.classList.add('hidden');
               esperandoRespuesta = false;
               nivelActivo = true;
               loop();
           };
       }
   
       function abrirReto(reto) {
           esperandoRespuesta = true;
           sonidos.pasos.pause();
           sonidos.abrirCofre.currentTime = 0;
           sonidos.abrirCofre.play().catch(() => {});
           Object.keys(keys).forEach(k => keys[k] = false);
           
           modal.classList.remove('hidden');
           container.innerHTML = '';
           
           // Mostrar imagen del reto
           if (reto.img) {
               imgElement.src = reto.img;
               imgElement.style.display = 'block';
               imgElement.classList.remove('hidden');
           } else {
               imgElement.style.display = 'none';
           }
   
           // --- BLOQUE DE SITUACIÓN (LO QUE FALTABA) ---
           const bloqueTexto = document.createElement('div');
           bloqueTexto.style.cssText = "color: white; margin-bottom: 20px; font-size: 16px; padding: 15px; background: rgba(0,0,0,0.5); border-radius: 12px; border-left: 5px solid var(--accent-orange); text-align: center; font-family: 'Avenir-Next', sans-serif;";
           // Prioriza mostrar 'situacion', si no existe busca 'pregunta' o 'instruccion'
           bloqueTexto.innerText = reto.situacion || reto.pregunta || reto.instruccion || "Resuelve este desafío:";
           container.appendChild(bloqueTexto);
   
           if (reto.tipo === "ordenar") {
               titulo.innerText = "ORDENA LA FRASE";
               const zonaDestino = document.createElement('div');
               zonaDestino.style.cssText = "min-height:50px; border:2px dashed #00FFFF; margin:10px 0; padding:10px; color:#00FFFF; font-weight:bold; background:rgba(0,0,0,0.3); border-radius:8px; text-align:center;";
               zonaDestino.innerText = "Selecciona las palabras...";
   
               const areaPalabras = document.createElement('div');
               areaPalabras.style.cssText = "display:flex; flex-wrap:wrap; gap:8px; justify-content:center; margin-top:10px;";
   
               let seleccionadas = [];
               let mezcladas = [...reto.palabras].sort(() => Math.random() - 0.5);
   
               mezcladas.forEach(p => {
                   const btn = document.createElement('button');
                   btn.className = 'choice';
                   btn.style.width = "auto";
                   btn.innerText = p;
                   btn.onclick = () => {
                       if (seleccionadas.length === 0) zonaDestino.innerText = "";
                       seleccionadas.push(p);
                       zonaDestino.innerText = seleccionadas.join(" ");
                       btn.style.visibility = "hidden";
                       
                       if (zonaDestino.innerText.trim() === reto.solucion) {
                           sonidos.correcto.play().catch(() => {});
                           finalizarReto(titulo, "¡EXCELENTE! ✨", reto);
                       } else if (seleccionadas.length >= reto.palabras.length) {
                           sonidos.error.play().catch(() => {});
                           titulo.innerText = "¡INTENTA DE NUEVO! ❌";
                           setTimeout(() => abrirReto(reto), 1200);
                       }
                   };
                   areaPalabras.appendChild(btn);
               });
               container.appendChild(zonaDestino);
               container.appendChild(areaPalabras);
   
           } else {
               titulo.innerText = "ELIGE TU CAMINO";
               reto.opciones.forEach(opt => {
                   const btn = document.createElement('button');
                   btn.className = 'choice';
                   btn.innerText = opt.texto;
                   btn.onclick = () => {
                       container.innerHTML = "";
                       if (opt.pts > 0) {
                           sonidos.correcto.play().catch(() => {});
                           finalizarReto(titulo, "¡MUY BIEN! ✨", reto);
                       } else {
                           sonidos.error.play().catch(() => {});
                           titulo.innerText = "¡PIENSA OTRA VEZ! ❌";
                           setTimeout(() => abrirReto(reto), 1200);
                       }
                   };
                   container.appendChild(btn);
               });
           }
       }
   
       function finalizarReto(titulo, msg, cofreActual) {
           titulo.innerText = msg;
           cofreActual.abierto = true; 
           setTimeout(() => {
               modal.classList.add('hidden');
               esperandoRespuesta = false;
               retosCompletados++;
               gemDisplay.innerText = parseInt(gemDisplay.innerText) + 1;
               if (retosCompletados >= cofres.length) mostrarMensajeFinal();
           }, 1600);
       }
   
       function mostrarMensajeFinal() {
           nivelActivo = false;
           esperandoRespuesta = true;
           sonidos.pasos.pause();
           sonidos.victoria.play().catch(() => {});
           imgElement.style.display = 'none';
           modal.classList.remove('hidden');
           titulo.innerText = "¡NIVEL COMPLETADO!";
           
           container.innerHTML = `
               <div style="text-align:center; margin-bottom:20px;">
                   <div style="font-size: 80px; filter: drop-shadow(0 0 15px #FFD700); animation: pulse 1.5s infinite;">💎</div>
                   <p style="color:white; font-size:18px; margin-top:15px; font-weight:bold; font-family:'Avenir-Next', sans-serif;">
                       ¡Has obtenido la Gema de la Sabiduría!
                   </p>
               </div>
               <button class="choice" id="btn-final-z2">RECLAMAR Y VOLVER AL MAPA</button>
           `;
   
           document.getElementById('btn-final-z2').onclick = () => {
               window.removeEventListener('keydown', handleKeyDown);
               window.removeEventListener('keyup', handleKeyUp);
               cancelAnimationFrame(requestID);
               modal.classList.add('hidden');
               onComplete(retosCompletados); 
           };
       }
   
       function update() {
           if (!nivelActivo || esperandoRespuesta) return;
   
           if (keys['ArrowRight'] || keys['KeyD']) { 
               player.x += player.speed; player.facingRight = true; 
               if (!player.isJumping && sonidos.pasos.paused) sonidos.pasos.play().catch(() => {});
           } else if (keys['ArrowLeft'] || keys['KeyA']) { 
               player.x -= player.speed; player.facingRight = false; 
               if (!player.isJumping && sonidos.pasos.paused) sonidos.pasos.play().catch(() => {});
           } else {
               sonidos.pasos.pause();
           }
   
           player.vy += player.gravity;
           player.y += player.vy;
           if (player.y > GROUND_Y) { player.y = GROUND_Y; player.vy = 0; player.isJumping = false; }
           
           player.x = Math.max(0, Math.min(WORLD_WIDTH - player.w, player.x));
           cameraX = Math.max(0, Math.min(WORLD_WIDTH - VIEWPORT_WIDTH, player.x - VIEWPORT_WIDTH / 2));
   
           cofres.forEach(cofre => {
               if (!cofre.abierto) {
                   const m = 25; 
                   if (player.x + player.w - m > cofre.x && player.x + m < cofre.x + cofre.w &&
                       player.y + player.h - m > cofre.y && player.y + m < cofre.y + cofre.h) {
                       abrirReto(cofre);
                   }
               }
           });
       }
   
       function draw() {
           ctx.clearRect(0, 0, canvas.width, canvas.height);
           ctx.save();
           ctx.translate(-Math.floor(cameraX), 0);
           if (assets.fondo.complete) ctx.drawImage(assets.fondo, 0, 0, WORLD_WIDTH, canvas.height);
           
           cofres.forEach(cofre => {
               let img = cofre.abierto ? assets.cofreAbierto : assets.cofreCerrado;
               if (img.complete) ctx.drawImage(img, cofre.x, cofre.y, cofre.w, cofre.h);
           });
   
           if (assets.player.complete) {
               ctx.save();
               if (!player.facingRight) {
                   ctx.translate(player.x + player.w, player.y); ctx.scale(-1, 1);
                   ctx.drawImage(assets.player, 0, 0, player.w, player.h);
               } else {
                   ctx.drawImage(assets.player, player.x, player.y, player.w, player.h);
               }
               ctx.restore();
           }
           ctx.restore();
       }
   
       function loop() {
           if (nivelActivo || esperandoRespuesta) {
               update(); draw();
               requestID = requestAnimationFrame(loop);
           }
       }
   
       window.addEventListener('keydown', handleKeyDown);
       window.addEventListener('keyup', handleKeyUp);
       mostrarMensajeInicio();
   }