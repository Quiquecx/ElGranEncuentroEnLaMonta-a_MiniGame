/* ======================================================================
   ZONA 2: EL SENDERO DEL ESPÍRITU - CORREGIDO (LÓGICA DE PUNTOS DINÁMICA)
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
   
       // Botones para control táctil
       const btnLeft = document.getElementById('btn-left');
       const btnRight = document.getElementById('btn-right');
       const btnJump = document.getElementById('btn-jump');
   
       const VIEWPORT_WIDTH = 900;
       const WORLD_WIDTH = 3000; 
       const GROUND_Y = 450;
       
       let nivelActivo = false;
       let esperandoRespuesta = false;
       let cameraX = 0;
       let retosCompletados = 0;
       let puntajeEspirituTotal = 0; 
       let requestID = null;
       let intentosEnRetoActual = 0;
   
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
           speed: 7, vy: 0, gravity: 0.6, jumpPower: -14, 
           isJumping: false, facingRight: true 
       };
   
       const keys = {};
   
       const inicioX = 600;
       const finX = WORLD_WIDTH - 600;
       const intervalo = (finX - inicioX) / (zona2Data.length - 1 || 1);
   
       let cofres = zona2Data.map((data, i) => ({
           ...data,
           x: inicioX + (i * intervalo), 
           y: 475,
           w: 60, h: 60,
           abierto: false
       }));
   
       // --- SISTEMA DE CONTROLES (IGUAL A MAIN Y ZONA 1) ---
       const saltar = () => {
           if (!player.isJumping && !esperandoRespuesta && nivelActivo) {
               player.vy = player.jumpPower; 
               player.isJumping = true;
               sonidos.salto.currentTime = 0;
               sonidos.salto.play().catch(() => {});
           }
       };
   
       function vincularControlesTactiles() {
           const mapping = {
               'btn-left': 'ArrowLeft', 
               'btn-right': 'ArrowRight',
               'btn-jump': 'ArrowUp'
           };
           Object.entries(mapping).forEach(([id, key]) => {
               const btn = document.getElementById(id);
               if (btn) {
                   btn.onpointerdown = (e) => { 
                       e.preventDefault(); 
                       keys[key] = true; 
                       if (key === 'ArrowUp') saltar(); 
                   };
                   btn.onpointerup = (e) => { e.preventDefault(); keys[key] = false; };
                   btn.onpointerleave = (e) => { e.preventDefault(); keys[key] = false; };
               }
           });
       }
   
       const handleKeyDown = (e) => { 
           keys[e.code] = true; 
           if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) saltar();
       };
       const handleKeyUp = (e) => keys[e.code] = false;
   
       function limpiarListeners() {
           window.removeEventListener('keydown', handleKeyDown);
           window.removeEventListener('keyup', handleKeyUp);
           [btnLeft, btnRight, btnJump].forEach(btn => {
               if (btn) {
                   btn.onpointerdown = null;
                   btn.onpointerup = null;
                   btn.onpointerleave = null;
               }
           });
           if (requestID) cancelAnimationFrame(requestID);
       }
   
       function procesarPuntaje(pts) {
           let puntosValidados = Math.min(Math.max(pts, 0), 2);
           if (puntosValidados === 2) {
               sonidos.correcto.currentTime = 0;
               sonidos.correcto.play().catch(() => {});
           } else if (puntosValidados === 1) {
               sonidos.salto.currentTime = 0;
               sonidos.salto.play().catch(() => {});
           } else {
               sonidos.error.currentTime = 0;
               sonidos.error.play().catch(() => {});
           }
           puntajeEspirituTotal += puntosValidados;
           let actualHUD = parseInt(gemDisplay.innerText) || 0;
           gemDisplay.innerText = actualHUD + puntosValidados;
       }
   
       function abrirReto(reto) {
           esperandoRespuesta = true;
           intentosEnRetoActual = 0;
           sonidos.pasos.pause();
           sonidos.abrirCofre.play().catch(() => {});
           Object.keys(keys).forEach(k => keys[k] = false);
           
           modal.classList.remove('hidden');
           imgElement.classList.add('hidden');
           container.innerHTML = '';
   
           const bloqueTexto = document.createElement('div');
           bloqueTexto.style.cssText = "color: white; margin-bottom: 20px; font-size: 16px; padding: 15px; background: rgba(0,0,0,0.5); border-radius: 12px; border-left: 5px solid #ffd166; text-align: center;";
           bloqueTexto.innerText = reto.situacion || reto.pregunta || "Desafío del Espíritu:";
           container.appendChild(bloqueTexto);
   
           if (reto.tipo === "ordenar") {
               titulo.innerText = "ORDENA EL MENSAJE";
               renderizarOrdenar(reto);
           } else {
               titulo.innerText = "ELIGE CON SABIDURÍA";
               renderizarOpciones(reto);
           }
       }
   
       function renderizarOpciones(reto) {
           reto.opciones.forEach(opt => {
               const btn = document.createElement('button');
               btn.className = 'choice';
               btn.innerText = opt.texto;
               btn.onclick = () => {
                   container.innerHTML = "";
                   procesarPuntaje(opt.pts);
                   let msg = ""; let icono = "";
                   if (opt.pts >= 2) { msg = "¡EXCELENTE! ✨"; icono = "✅"; }
                   else if (opt.pts === 1) { msg = "¡BIEN! 👍"; icono = "🤔"; }
                   else { msg = "SIGUE APRENDIENDO 📚"; icono = "❌"; }
                   finalizarReto(titulo, `${icono} ${msg} +${opt.pts}`, reto);
               };
               container.appendChild(btn);
           });
       }
   
       function renderizarOrdenar(reto) {
           const zonaDestino = document.createElement('div');
           zonaDestino.style.cssText = "min-height:50px; border:2px dashed #ffd166; margin:10px 0; padding:10px; color:#ffd166; font-weight:bold; background:rgba(0,0,0,0.3); border-radius:8px; text-align:center;";
           zonaDestino.innerText = "Toca las palabras en orden...";
   
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
                       let ptsFinales = (intentosEnRetoActual === 0) ? 2 : 1;
                       procesarPuntaje(ptsFinales);
                       let feedback = (ptsFinales === 2) ? "¡EXCELENTE! ✨" : "¡BIEN! 👍";
                       finalizarReto(titulo, `${feedback} +${ptsFinales}`, reto);
                   } else if (seleccionadas.length >= reto.palabras.length) {
                       sonidos.error.play().catch(() => {});
                       intentosEnRetoActual++;
                       titulo.innerText = "EL ORDEN NO ES CORRECTO";
                       setTimeout(() => {
                           seleccionadas = [];
                           zonaDestino.innerText = "Intenta de nuevo...";
                           areaPalabras.querySelectorAll('button').forEach(b => b.style.visibility = "visible");
                       }, 1000);
                   }
               };
               areaPalabras.appendChild(btn);
           });
           container.appendChild(zonaDestino);
           container.appendChild(areaPalabras);
       }
   
       function finalizarReto(tituloElem, msg, cofre) {
           tituloElem.innerText = msg;
           cofre.abierto = true;
           setTimeout(() => {
               modal.classList.add('hidden');
               esperandoRespuesta = false;
               retosCompletados++;
               if (retosCompletados >= cofres.length) mostrarMensajeFinal();
           }, 1600);
       }
   
       function mostrarMensajeFinal() {
           nivelActivo = false; 
           esperandoRespuesta = true;
           sonidos.pasos.pause();
           sonidos.victoria.play().catch(() => {});
           
           imgElement.classList.add('hidden');
           imgElement.style.display = 'none';
           modal.style.zIndex = "5000"; 
           modal.classList.remove('hidden');
           titulo.innerText = "¡NIVEL COMPLETADO!";
   
           container.innerHTML = `
               <div style="text-align:center; padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                   <div style="font-size: 80px; margin-bottom: 10px; filter: drop-shadow(0 0 15px #ffd166); animation: bounce 2s infinite;">💎</div>
                   <p style="color:#333; font-size: 20px; font-weight: bold; margin: 10px 0; font-family: var(--font-body);">
                       ¡Has obtenido la Gema del Sendero del Espíritu!
                   </p>
                   <p style="color:#555; font-size: 16px; margin-bottom: 15px; font-style: italic;">
                       "Has elegido tu propio camino."
                   </p>
                   <div style="background: #f0f0f0; padding: 10px 30px; border-radius: 50px; border: 2px solid #ffd166; margin-bottom: 20px;">
                       <span style="color:#333; font-family: var(--font-titles); font-size: 22px;">
                           Puntos: ${puntajeEspirituTotal}
                       </span>
                   </div>
                   <button class="choice" id="btn-final-z2" style="width: 100%; max-width: 250px; cursor: pointer; pointer-events: auto;">
                       VOLVER AL MAPA
                   </button>
               </div>
           `;
   
           document.getElementById('btn-final-z2').onclick = (e) => {
               e.preventDefault();
               modal.classList.add('hidden');
               limpiarListeners();
               onComplete(puntajeEspirituTotal);
           };
       }
   
       function update() {
           if (!nivelActivo || esperandoRespuesta) return;
           if (keys['ArrowRight'] || keys['KeyD']) { player.x += player.speed; player.facingRight = true; }
           else if (keys['ArrowLeft'] || keys['KeyA']) { player.x -= player.speed; player.facingRight = false; }
           
           player.vy += player.gravity; player.y += player.vy;
           if (player.y > GROUND_Y) { player.y = GROUND_Y; player.vy = 0; player.isJumping = false; }
           
           player.x = Math.max(0, Math.min(WORLD_WIDTH - player.w, player.x));
           cameraX = Math.max(0, Math.min(WORLD_WIDTH - VIEWPORT_WIDTH, player.x - VIEWPORT_WIDTH / 2));
           
           cofres.forEach(cofre => {
               if (!cofre.abierto && Math.abs(player.x - cofre.x) < 40 && Math.abs(player.y - cofre.y) < 60) {
                   abrirReto(cofre);
               }
           });
       }
   
       function draw() {
           ctx.clearRect(0, 0, canvas.width, canvas.height);
           ctx.save();
           ctx.translate(-Math.floor(cameraX), 0);
           if (assets.fondo.complete) ctx.drawImage(assets.fondo, 0, 0, WORLD_WIDTH, canvas.height);
           cofres.forEach(c => {
               let img = c.abierto ? assets.cofreAbierto : assets.cofreCerrado;
               if (img.complete) ctx.drawImage(img, c.x, c.y, c.w, c.h);
           });
           if (assets.player.complete) {
               ctx.save();
               if (!player.facingRight) {
                   ctx.translate(player.x + player.w, player.y); ctx.scale(-1, 1);
                   ctx.drawImage(assets.player, 0, 0, player.w, player.h);
               } else { ctx.drawImage(assets.player, player.x, player.y, player.w, player.h); }
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
   
       // Inicialización
       window.addEventListener('keydown', handleKeyDown);
       window.addEventListener('keyup', handleKeyUp);
       vincularControlesTactiles();
   
       // Mostrar mensaje de inicio
       esperandoRespuesta = true;
       modal.classList.remove('hidden');
       imgElement.style.display = 'none';
       titulo.innerText = "EL SENDERO DEL ESPÍRITU";
       container.innerHTML = `
           <div style="text-align:center;">
               <p style="color:#333; font-weight:bold; margin-bottom:20px; font-size:1.2rem;">
                   Ordena los mensajes y resuelve los dilemas para llegar a la cima.
               </p>
               <button class="choice" id="btn-start-z2" style="padding:15px 40px; font-size:1.2rem;">
                   ¡COMENZAR!
               </button>
           </div>
       `;
   
       document.getElementById('btn-start-z2').onclick = () => {
           modal.classList.add('hidden');
           esperandoRespuesta = false;
           nivelActivo = true;
           loop();
       };
   }