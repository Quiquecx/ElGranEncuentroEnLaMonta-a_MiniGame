/* ======================================================================
   ZONA 3: LA CIMA DE LA MONTAÑA (Sistema de Doble Puntaje)
   ====================================================================== */
   import { zona3Data } from '../../data/preguntas.js';
   import { sonidos } from '../main.js'; 
   
   export function iniciarZona3(onComplete) {
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
       let puntajeConcienciaTotal = 0; // Puntuación interna de la zona
       let requestID = null;
   
       const assets = {
           fondo: new Image(),
           player: new Image(),
           cofreCerrado: new Image(),
           cofreAbierto: new Image()
       };
       assets.fondo.src = 'src/imgs/fondos/fondo_level3.png';
       assets.player.src = 'src/imgs/protagonistas/Niña 01.png';
       assets.cofreCerrado.src = 'src/imgs/general/L8 Cofre cerrado.png';
       assets.cofreAbierto.src = 'src/imgs/general/L8 Cofre abierto.png';
   
       let player = { 
           x: 100, y: GROUND_Y, w: 70, h: 90, 
           speed: 6, vy: 0, gravity: 0.6, jumpPower: -14, 
           isJumping: false, facingRight: true 
       };
   
       const keys = {};
       const inicioX = 600;
       const finX = WORLD_WIDTH - 400;
       const espacioDisponible = finX - inicioX;
       const intervalo = espacioDisponible / (zona3Data.length - 1 || 1);
   
       let cofres = zona3Data.map((data, i) => ({
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
               sonidos.salto.play().catch(()=>{});
           }
       };
       const handleKeyUp = (e) => keys[e.code] = false;
   
       window.addEventListener('keydown', handleKeyDown);
       window.addEventListener('keyup', handleKeyUp);
   
       function mostrarMensajeInicio() {
           esperandoRespuesta = true;
           nivelActivo = false;
           modal.classList.remove('hidden');
           imgElement.classList.add('hidden');
           titulo.innerText = "LA CIMA DE LA CONCIENCIA";
           container.innerHTML = `
               <p style="color:white; margin-bottom:20px; text-align:center;">
                   Estás en la cumbre. Aquí cada elección cuenta. Actúa según los mandamientos para alcanzar el tesoro final.
               </p>
               <button class="choice" id="btn-comenzar-z3" style="width: 200px; margin: 0 auto;">¡COMENZAR!</button>
           `;
           document.getElementById('btn-comenzar-z3').onclick = () => {
               modal.classList.add('hidden');
               esperandoRespuesta = false;
               nivelActivo = true;
               loop();
           };
       }
   
       function abrirRetoConciencia(cofre) {
           esperandoRespuesta = true;
           sonidos.pasos.pause();
           sonidos.abrirCofre.currentTime = 0;
           sonidos.abrirCofre.play().catch(()=>{});
           Object.keys(keys).forEach(k => keys[k] = false); 
           
           modal.classList.remove('hidden');
           imgElement.src = cofre.img;
           imgElement.style.display = 'block';
           imgElement.classList.remove('hidden');
           
           container.innerHTML = '';
           titulo.innerText = `Mandamiento: ${cofre.mandamiento}`;
           
           const instruccion = document.createElement('div');
           instruccion.innerHTML = `<strong style="color:#58b347">Situación:</strong><br>${cofre.situacion}`;
           instruccion.style.cssText = "color: white; margin-bottom: 20px; font-size: 15px; padding: 15px; background: rgba(0,0,0,0.5); border-radius: 8px; text-align:center;";
           container.appendChild(instruccion);
   
           cofre.opciones.forEach(opt => {
               const btn = document.createElement('button');
               btn.className = 'choice';
               btn.innerText = opt.texto;
               btn.onclick = () => {
                   container.innerHTML = ""; 
   
                   if (opt.pts === 2) sonidos.correcto.play().catch(()=>{});
                   else if (opt.pts === 1) sonidos.salto.play().catch(()=>{});
                   else sonidos.error.play().catch(()=>{});
   
                   // --- ACTUALIZACIÓN DE AMBOS PUNTAJES ---
                   puntajeConcienciaTotal += opt.pts; // Puntaje para el nivel de conciencia
                   
                   // Actualizamos el contador visual general (gem-count) en el mapa
                   let puntajeActualHUD = parseInt(gemDisplay.innerText) || 0;
                   gemDisplay.innerText = puntajeActualHUD + opt.pts;
   
                   cofre.abierto = true;
                   retosCompletados++;
   
                   let icono = opt.pts === 2 ? "✅" : (opt.pts === 1 ? "🤔" : "❌");
                   titulo.innerText = `${icono} +${opt.pts} diamante(s)`;
   
                   setTimeout(() => {
                       if (retosCompletados >= cofres.length) {
                           mostrarFinalConciencia();
                       } else {
                           modal.classList.add('hidden');
                           esperandoRespuesta = false;
                       }
                   }, 1500);
               };
               container.appendChild(btn);
           });
       }
   
       function mostrarFinalConciencia() {
           nivelActivo = false;
           esperandoRespuesta = true;
           sonidos.pasos.pause();
           sonidos.victoria.play().catch(()=>{});
   
           imgElement.style.display = 'none';
           modal.classList.remove('hidden');
           titulo.innerText = "¡CUMBRE ALCANZADA!";
           
           let rango = "";
           if (puntajeConcienciaTotal >= 18) { rango = "Conciencia Brillante 🌟"; }
           else if (puntajeConcienciaTotal >= 12) { rango = "Conciencia en Crecimiento 🌱"; }
           else { rango = "Conciencia en Construcción 🧩"; }
   
           container.innerHTML = `
               <div style="text-align:center; margin-bottom:20px;">
                   <div style="font-size: 80px; filter: drop-shadow(0 0 15px #00FFFF);">💎</div>
                   <p style="color:white; font-size:22px; margin-top:15px; font-weight:bold;">
                       Has obtenido la Gema de la Cumbre
                   </p>
                   <p style="color:#2ecc71; font-size:20px; margin-top:10px;">
                       Nivel: ${rango}
                   </p>
                   <p style="color:white; font-size:16px; margin-top:5px;">
                       Puntos acumulados en esta zona: ${puntajeConcienciaTotal}
                   </p>
               </div>
               <button class="choice" id="btn-final-z3">GUARDAR Y VOLVER AL MAPA</button>
           `;
   
           document.getElementById('btn-final-z3').onclick = () => {
               finalizarNivel();
           };
       }
   
       function update() {
           if (!nivelActivo || esperandoRespuesta) return;
           let moviendose = false;
           if (keys['ArrowRight'] || keys['KeyD']) { player.x += player.speed; player.facingRight = true; moviendose = true; }
           if (keys['ArrowLeft'] || keys['KeyA']) { player.x -= player.speed; player.facingRight = false; moviendose = true; }
           if (moviendose && !player.isJumping) {
               if (sonidos.pasos.paused) sonidos.pasos.play().catch(()=>{});
           } else { sonidos.pasos.pause(); }
   
           player.vy += player.gravity;
           player.y += player.vy;
           if (player.y > GROUND_Y) { player.y = GROUND_Y; player.vy = 0; player.isJumping = false; }
   
           player.x = Math.max(0, Math.min(WORLD_WIDTH - player.w, player.x));
           cameraX = Math.max(0, Math.min(WORLD_WIDTH - VIEWPORT_WIDTH, player.x - VIEWPORT_WIDTH / 2));
   
           cofres.forEach(cofre => {
               if (!cofre.abierto) {
                   const colH = player.x + player.w - 20 > cofre.x && player.x + 20 < cofre.x + cofre.w;
                   const colV = player.y + player.h - 20 > cofre.y && player.y + 20 < cofre.y + cofre.h;
                   if (colH && colV) { abrirRetoConciencia(cofre); }
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
   
       function finalizarNivel() {
           cancelAnimationFrame(requestID);
           window.removeEventListener('keydown', handleKeyDown);
           window.removeEventListener('keyup', handleKeyUp);
           modal.classList.add('hidden');
           // Al mapa solo le pasamos el puntaje de conciencia para guardarlo si es necesario
           onComplete(puntajeConcienciaTotal);
       }
   
       mostrarMensajeInicio(); 
   }