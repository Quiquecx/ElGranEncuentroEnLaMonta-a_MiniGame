/* ======================================================================
   ZONA 3: LA CIMA DE LA MONTAÑA (Animación y Proporciones Replicadas)
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
   
       // Botones para control táctil
       const btnLeft = document.getElementById('btn-left');
       const btnRight = document.getElementById('btn-right');
       const btnJump = document.getElementById('btn-jump');
   
       const VIEWPORT_WIDTH = 900;
       const WORLD_WIDTH = 3000; 
       
       let nivelActivo = false;
       let esperandoRespuesta = false;
       let cameraX = 0; 
       let retosCompletados = 0;
       let puntajeConcienciaTotal = 0; 
       let requestID = null;
   
       const assets = {
           fondo: new Image(),
           cofreCerrado: new Image(),
           cofreAbierto: new Image()
       };
       assets.fondo.src = 'src/imgs/fondos/fondo_level03.png';
       assets.cofreCerrado.src = 'src/imgs/general/L8 Cofre cerrado.png';
       assets.cofreAbierto.src = 'src/imgs/general/L8 Cofre abierto.png';
   
       /* --- PRECARGA DE FRAMES DE CAMINADO --- */
       const TOTAL_FRAMES_CAMINA = 9;
       const framesCaminar = [];
   
       for (let i = 1; i <= TOTAL_FRAMES_CAMINA; i++) {
           const num = i < 10 ? `0${i}` : i;
           const imgCamina = new Image();
           imgCamina.src = `src/imgs/protagonistas/Sofi_camina-${num}.png`;
           framesCaminar.push(imgCamina);
       }
   
       // DIMENSIONES Y PROPIEDADES DEL JUGADOR RÉPLICA DE ZONAS 1 Y 2
       let player = { 
           x: 100, y: 300, 
           w: 155, h: 165,
           paddingX: 45,
           paddingBottom: 35,
           speed: 5.5, vy: 0, gravity: 0.65, jumpPower: -17.5, 
           isJumping: false, facingRight: true,
           currentFrameCamina: 0,
           frameTimerCamina: 0,
           frameDelay: 5
       };
   
       // Nivel del suelo igualado con Zona 1 y Zona 2
       const GROUND_SURFACE = 540; 
       const GROUND_Y = GROUND_SURFACE - (player.h - player.paddingBottom);
   
       function getPlayerHitbox() {
           return {
               x: player.x + player.paddingX,
               y: player.y,
               w: player.w - (player.paddingX * 2),
               h: player.h - player.paddingBottom,
               feetY: player.y + (player.h - player.paddingBottom)
           };
       }
   
       const keys = {};
       const inicioX = 600;
       const finX = WORLD_WIDTH - 400;
       const intervalo = (finX - inicioX) / (zona3Data.length - 1 || 1);
   
       let cofres = zona3Data.map((data, i) => ({
           ...data,
           x: inicioX + (i * intervalo), 
           y: 475,
           w: 60, h: 60,
           abierto: false
       }));
   
       // --- SISTEMA DE CONTROLES UNIFICADO ---
       const saltar = () => {
           if (!player.isJumping && !esperandoRespuesta && nivelActivo) {
               player.vy = player.jumpPower; 
               player.isJumping = true;
               sonidos.salto.currentTime = 0;
               sonidos.salto.play().catch(()=>{});
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
           [btnLeft, btnRight, btnJump].filter(Boolean).forEach(btn => {
               btn.onpointerdown = null;
               btn.onpointerup = null;
               btn.onpointerleave = null;
           });
           if (requestID) cancelAnimationFrame(requestID);
       }
   
       function mostrarMensajeInicio() {
           esperandoRespuesta = true;
           nivelActivo = false;
           modal.classList.remove('hidden');
           imgElement.style.display = 'none'; 
           imgElement.classList.add('hidden');
           titulo.innerText = "LA CIMA DE LA CONCIENCIA";
           
           container.innerHTML = `
               <div style="width: 100%; padding: 10px;">
                   <p style="color: #333 !important; margin-bottom: 25px; text-align: center; font-family: var(--font-body); font-size: 1.1rem; line-height: 1.4;">
                       Estás en la cumbre. Aquí cada elección cuenta.<br>
                       Actúa según los mandamientos, toma las decisiones correctas.
                   </p>
                   <div style="display: flex; justify-content: center; width: 100%;">
                       <button class="choice" id="btn-comenzar-z3" style="width: 220px;">¡COMENZAR!</button>
                   </div>
               </div>
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
           if (cofre.img) {
               imgElement.src = cofre.img;
               imgElement.style.display = 'block';
               imgElement.classList.remove('hidden');
           } else {
               imgElement.style.display = 'none';
               imgElement.classList.add('hidden');
           }
           
           container.innerHTML = '';
           titulo.innerText = `Mandamiento: ${cofre.mandamiento}`;
           
           const instruccion = document.createElement('div');
           instruccion.innerHTML = `<strong style="color:#ffd166">Situación:</strong><br>${cofre.situacion}`;
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
   
                   puntajeConcienciaTotal += opt.pts; 
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
           sonidos.victoria.play().catch(() => {});
       
           imgElement.style.display = 'none';
           imgElement.classList.add('hidden');
           modal.style.zIndex = "5000"; 
           modal.classList.remove('hidden');
           titulo.innerText = "¡CUMBRE ALCANZADA!";
           
           let rango = "";
           if (puntajeConcienciaTotal >= 18) { rango = "Conciencia Brillante 🌟"; }
           else if (puntajeConcienciaTotal >= 12) { rango = "Conciencia en Crecimiento 🌱"; }
           else { rango = "Conciencia en Construcción 🧩"; }
       
           container.innerHTML = `
               <div style="text-align:center; padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                   <div style="font-size: 80px; margin-bottom: 10px; filter: drop-shadow(0 0 15px #ffd166); animation: bounce 2s infinite;">💎</div>
                   <p style="color:#333; font-size: 20px; font-weight: bold; margin: 10px 0; font-family: var(--font-body);">
                       ¡Has obtenido la Gema de la Cumbre!
                   </p>
                   <p style="color:var(--book-green); font-size: 18px; font-weight: bold; margin-bottom: 15px; font-family: var(--font-body);">
                       ${rango}
                   </p>
                   <div style="background: #f0f0f0; padding: 10px 30px; border-radius: 50px; border: 2px solid #ffd166; margin-bottom: 20px;">
                       <span style="color:#333; font-family: var(--font-titles); font-size: 22px;">
                           Puntos: ${puntajeConcienciaTotal}
                       </span>
                   </div>
                   <button class="choice" id="btn-final-z3" style="width: 100%; max-width: 250px; cursor: pointer; pointer-events: auto;">
                       VOLVER AL MAPA
                   </button>
               </div>
           `;
       
           document.getElementById('btn-final-z3').onclick = () => {
               finalizarNivel();
           };
       }
   
       function update() {
           if (!nivelActivo || esperandoRespuesta) return;
           let moviendose = false;
           if (keys['ArrowRight'] || keys['KeyD']) { player.x += player.speed; player.facingRight = true; moviendose = true; }
           else if (keys['ArrowLeft'] || keys['KeyA']) { player.x -= player.speed; player.facingRight = false; moviendose = true; }
           
           // Animación de caminata y audio de pasos
           if (moviendose) {
               if (!player.isJumping && sonidos.pasos.paused) sonidos.pasos.play().catch(()=>{});
               
               player.frameTimerCamina++;
               if (player.frameTimerCamina >= player.frameDelay) {
                   player.frameTimerCamina = 0;
                   player.currentFrameCamina = (player.currentFrameCamina + 1) % TOTAL_FRAMES_CAMINA;
               }
           } else { 
               if (!player.isJumping) sonidos.pasos.pause(); 
               player.currentFrameCamina = 0;
           }
   
           player.vy += player.gravity;
           player.y += player.vy;
           
           if (player.y > GROUND_Y) { 
               player.y = GROUND_Y; 
               player.vy = 0; 
               player.isJumping = false; 
           }
   
           player.x = Math.max(0, Math.min(WORLD_WIDTH - player.w, player.x));
           cameraX = Math.max(0, Math.min(WORLD_WIDTH - VIEWPORT_WIDTH, player.x - VIEWPORT_WIDTH / 2));
   
           const box = getPlayerHitbox();
   
           cofres.forEach(cofre => {
               if (!cofre.abierto) {
                   const colH = box.x + box.w > cofre.x && box.x < cofre.x + cofre.w;
                   const colV = box.feetY > cofre.y && box.y < cofre.y + cofre.h;
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
   
           // Dibujar frame actual de caminata con volteo horizontal
           const currentImg = framesCaminar[player.currentFrameCamina];
           if (currentImg && currentImg.complete) {
               ctx.save();
               const px = Math.floor(player.x);
               const py = Math.floor(player.y);
   
               if (!player.facingRight) {
                   ctx.translate(px + player.w, py); 
                   ctx.scale(-1, 1);
                   ctx.drawImage(currentImg, 0, 0, player.w, player.h);
               } else {
                   ctx.drawImage(currentImg, px, py, player.w, player.h);
               }
               ctx.restore();
           }
   
           ctx.restore(); 
       }
   
       function loop() {
           if (nivelActivo || esperandoRespuesta) {
               update(); 
               draw();
               requestID = requestAnimationFrame(loop);
           }
       }
   
       function finalizarNivel() {
           limpiarListeners();
           modal.classList.add('hidden');
           onComplete(puntajeConcienciaTotal);
       }
   
       // Inicialización y Precarga
       window.addEventListener('keydown', handleKeyDown);
       window.addEventListener('keyup', handleKeyUp);
       vincularControlesTactiles();
   
       const todasLasImagenes = [...framesCaminar, assets.fondo, assets.cofreCerrado, assets.cofreAbierto];
       let cargadas = 0;
       let nivelIniciado = false;
   
       const intentarIniciar = () => {
           if (!nivelIniciado) {
               nivelIniciado = true;
               mostrarMensajeInicio();
           }
       };
   
       todasLasImagenes.forEach(img => {
           if (img.complete) {
               cargadas++;
           } else {
               img.onload = () => { cargadas++; if (cargadas >= todasLasImagenes.length) intentarIniciar(); };
               img.onerror = () => { cargadas++; if (cargadas >= todasLasImagenes.length) intentarIniciar(); };
           }
       });
   
       if (cargadas >= todasLasImagenes.length) intentarIniciar();
   }