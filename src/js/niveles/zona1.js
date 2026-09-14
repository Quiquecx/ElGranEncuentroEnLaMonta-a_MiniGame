/* ====================================================================== 
   ZONA 1: EL VALLE DEL DESCUBRIMIENTO (Pie asentado correctamente)
   ====================================================================== */
   import { zona1Data } from '../../data/preguntas.js';
   import { sonidos } from '../main.js';
   
   export function iniciarZona1(onComplete) {
       const canvas = document.getElementById('map-canvas');
       const ctx = canvas.getContext('2d');
       const modal = document.getElementById('trivia-modal');
       const container = document.getElementById('options-container');
       const titulo = document.getElementById('trivia-title');
       const imgEl = document.getElementById('current-sacramento-img');
       
       const timerDisplay = document.getElementById('timer-count');
       const gemDisplay = document.getElementById('gem-count');
       const btnLeft = document.getElementById('btn-left');
       const btnRight = document.getElementById('btn-right');
       const btnJump = document.getElementById('btn-jump');
   
       const VIEWPORT_WIDTH = 900;
       const WORLD_WIDTH = 1280;
   
       let nivelActivo = false;
       let esperandoRespuesta = false;
       let cameraX = 0;
       let gemasRecolectadas = 0;
       let timerInterval = null;
       let requestID = null;
   
       const assets = {
           fondo: new Image(), 
           cofreC: new Image(),
           cofreA: new Image()
       };
       assets.fondo.src = 'src/imgs/fondos/fondo_level01.png';
       assets.cofreC.src = 'src/imgs/general/L8 Cofre cerrado.png';
       assets.cofreA.src = 'src/imgs/general/L8 Cofre abierto.png';
   
       /* --- PRECARGA DE FRAMES --- */
       const TOTAL_FRAMES_CAMINA = 9;
       const TOTAL_FRAMES_SALTO = 7;
       const framesCaminar = [];
       const framesSalto = [];
   
       for (let i = 1; i <= TOTAL_FRAMES_CAMINA; i++) {
           const num = i < 10 ? `0${i}` : i;
           const imgCamina = new Image();
           imgCamina.src = `src/imgs/protagonistas/Sofi_camina-${num}.png`;
           framesCaminar.push(imgCamina);
       }
   
       for (let i = 1; i <= TOTAL_FRAMES_SALTO; i++) {
           const num = i < 10 ? `0${i}` : i;
           const imgSalto = new Image();
           imgSalto.src = `src/imgs/protagonistas/Salto/Sofia salto-${num}.png`;
           framesSalto.push(imgSalto);
       }
   
       // AJUSTE DE PLAYER Y PADDING TRANSPARENTE
       let player = {
           x: 100, y: 300, 
           w: 155, h: 165,
           paddingX: 45,        // Recorte transparente lateral
           paddingBottom: 35,   // RECORTE INFERIOR: Elimina el aire debajo de los pies
           speed: 5.5, vy: 0, gravity: 0.65,
           jumpPower: -17.5,
           isJumping: false, facingRight: true,
           currentFrameCamina: 0,
           currentFrameSalto: 0,
           frameTimerCamina: 0,
           frameTimerSalto: 0,
           frameDelay: 5
       };
   
       // Nivel del suelo considerando el borde real de los pies
       const GROUND_SURFACE = 540; 
       const GROUND_Y = GROUND_SURFACE - (player.h - player.paddingBottom);
   
       // Obtener la hitbox ajustada excluyendo los márgenes transparentes
       function getPlayerHitbox() {
           return {
               x: player.x + player.paddingX,
               y: player.y,
               w: player.w - (player.paddingX * 2),
               h: player.h - player.paddingBottom,
               feetY: player.y + (player.h - player.paddingBottom)
           };
       }
   
       const plataformas = [
           { x: 300, y: 360, w: 150, h: 25 },
           { x: 550, y: 260, w: 150, h: 25 },
           { x: 850, y: 360, w: 150, h: 25 }
       ];
   
       let cofres = zona1Data.slice(0, 7).map((data, i) => {
           const positions = [
               { x: 345, y: 300 }, { x: 595, y: 200 }, { x: 895, y: 300 },
               { x: 450, y: 475 }, { x: 750, y: 475 }, { x: 1000, y: 475 }, { x: 1200, y: 475 }
           ];
           return { ...data, x: positions[i].x, y: positions[i].y, w: 60, h: 60, abierto: false };
       });
   
       const keys = {};
   
       const saltar = () => {
           if (!player.isJumping && !esperandoRespuesta && nivelActivo) {
               player.vy = player.jumpPower; 
               player.isJumping = true;
               player.currentFrameSalto = 0;
               player.frameTimerSalto = 0;
               sonidos.salto.currentTime = 0; 
               sonidos.salto.play().catch(()=>{});
           }
       };
   
       const handleKeyDown = (e) => { 
           keys[e.code] = true; 
           if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) saltar(); 
       };
       const handleKeyUp = (e) => keys[e.code] = false;
   
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
   
           clearInterval(timerInterval);
       }
   
       window.addEventListener('keydown', handleKeyDown);
       window.addEventListener('keyup', handleKeyUp);
       vincularControlesTactiles();
   
       function iniciarTrivia(cofre) {
           esperandoRespuesta = true;
           sonidos.pasos.pause();
           sonidos.abrirCofre.currentTime = 0;
           sonidos.abrirCofre.play().catch(()=>{});
           
           Object.keys(keys).forEach(k => keys[k] = false);
   
           modal.classList.remove('hidden');
           if(imgEl) {
               imgEl.src = cofre.img;
               imgEl.style.display = "block";
               imgEl.classList.remove('hidden');
           }
   
           titulo.innerText = "¡ADIVINA EL SACRAMENTO!";
           
           container.innerHTML = `
               <div style="background: rgba(0,0,0,0.7); padding: 15px; border-radius: 12px; border-left: 5px solid var(--book-green); margin-bottom: 15px;">
                   <p style="color: white; text-align: center; font-size: 16px; margin: 0; line-height: 1.4;">
                       ${cofre.mensaje}
                   </p>
               </div>
           `;
   
           let tiempoRestante = 15;
           timerDisplay.innerText = tiempoRestante;
           clearInterval(timerInterval);
           timerInterval = setInterval(() => {
               tiempoRestante--;
               timerDisplay.innerText = tiempoRestante;
               if (tiempoRestante <= 0) {
                   clearInterval(timerInterval);
                   modal.classList.add('hidden');
                   esperandoRespuesta = false;
               }
           }, 1000);
   
           let opciones = [cofre.nombre];
           while (opciones.length < 3) {
               let r = zona1Data[Math.floor(Math.random() * zona1Data.length)].nombre;
               if (!opciones.includes(r)) opciones.push(r);
           }
   
           opciones.sort(() => Math.random() - 0.5).forEach(opt => {
               const btn = document.createElement('button');
               btn.innerText = opt;
               btn.className = 'choice';
               btn.onclick = () => {
                   if (opt === cofre.nombre) {
                       clearInterval(timerInterval);
                       sonidos.correcto.play().catch(()=>{});
                       gemasRecolectadas++;
                       cofre.abierto = true;
                       gemDisplay.innerText = gemasRecolectadas;
                       titulo.innerText = "¡CORRECTO! ✨";
                       container.innerHTML = "";
                       setTimeout(() => {
                           modal.classList.add('hidden');
                           esperandoRespuesta = false;
                           if (gemasRecolectadas >= 7) finalizarNivel();
                       }, 800);
                   } else {
                       sonidos.error.play().catch(()=>{});
                       titulo.innerText = "¡INTENTA DE NUEVO! ❌";
                   }
               };
               container.appendChild(btn);
           });
       }
   
       function update() {
           if (!nivelActivo || esperandoRespuesta) return;
           
           let moviendose = false;
           if (keys['ArrowRight'] || keys['KeyD']) { player.x += player.speed; player.facingRight = true; moviendose = true; }
           if (keys['ArrowLeft'] || keys['KeyA']) { player.x -= player.speed; player.facingRight = false; moviendose = true; }
   
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
   
           if (player.isJumping) {
               player.frameTimerSalto++;
               if (player.frameTimerSalto >= player.frameDelay) {
                   player.frameTimerSalto = 0;
                   if (player.currentFrameSalto < TOTAL_FRAMES_SALTO - 1) {
                       player.currentFrameSalto++;
                   }
               }
           }
   
           player.vy += player.gravity;
           player.y += player.vy;
   
           // Límite de Suelo
           if (player.y > GROUND_Y) { 
               player.y = GROUND_Y; 
               player.vy = 0; 
               player.isJumping = false; 
               player.currentFrameSalto = 0;
           }
   
           const box = getPlayerHitbox();
   
           for (let plat of plataformas) {
               if (box.x + box.w > plat.x && box.x < plat.x + plat.w) {
                   // Aterrizaje exacto: calcula la posición Y de la imagen basándose en los pies reales
                   if (player.vy > 0 && box.feetY >= plat.y && box.feetY <= plat.y + 25) {
                       player.y = plat.y - (player.h - player.paddingBottom);
                       player.vy = 0; 
                       player.isJumping = false;
                       player.currentFrameSalto = 0;
                   } 
                   else if (player.vy < 0 && box.y > plat.y + plat.h - 15 && box.y < plat.y + plat.h) {
                       player.y = plat.y + plat.h;
                       player.vy = 0;
                   }
               }
           }
   
           player.x = Math.max(0, Math.min(WORLD_WIDTH - player.w, player.x));
           cameraX = Math.max(0, Math.min(WORLD_WIDTH - VIEWPORT_WIDTH, player.x - VIEWPORT_WIDTH / 2));
   
           cofres.forEach(cofre => {
               if (!cofre.abierto) {
                   const colH = box.x + box.w > cofre.x && box.x < cofre.x + cofre.w;
                   const colV = box.feetY > cofre.y && box.y < cofre.y + cofre.h;
                   if (colH && colV) iniciarTrivia(cofre);
               }
           });
       }
   
       function draw() {
           ctx.clearRect(0, 0, canvas.width, canvas.height);
           ctx.save();
           ctx.translate(-Math.floor(cameraX), 0);
           
           if (assets.fondo.complete) ctx.drawImage(assets.fondo, 0, 0, WORLD_WIDTH, canvas.height);
           
           plataformas.forEach(plat => {
               ctx.fillStyle = "#A52A2A"; ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
               ctx.fillStyle = "#E9967A"; ctx.fillRect(plat.x, plat.y, plat.w, 3);
               ctx.strokeStyle = "#000"; ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
           });
   
           cofres.forEach(c => {
               const img = c.abierto ? assets.cofreA : assets.cofreC;
               if (img.complete) ctx.drawImage(img, c.x, c.y, c.w, c.h);
           });
   
           const currentImg = player.isJumping 
               ? framesSalto[player.currentFrameSalto] 
               : framesCaminar[player.currentFrameCamina];
   
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
   
       function mostrarMensajeInicio() {
           esperandoRespuesta = true;
           modal.classList.remove('hidden');
           titulo.innerText = "EL VALLE DEL DESCUBRIMIENTO";
           titulo.style.color = "var(--primary-purple)";
           container.innerHTML = `
               <div style="text-align:center;">
                   <p style="color:#333; font-weight: bold; margin-bottom:20px;">
                       Sube a las plataformas para alcanzar los cofres sagrados. 
                       ¡Descubre los 7 Sacramentos!
                   </p>
                   <button class="choice" id="btn-start">¡COMENZAR!</button>
               </div>
           `;
           document.getElementById('btn-start').onclick = () => {
               modal.classList.add('hidden');
               esperandoRespuesta = false; 
               nivelActivo = true;
               loop();
           };
       }
   
       function finalizarNivel() {
           nivelActivo = false;
           limpiarListeners();
           if (requestID) cancelAnimationFrame(requestID);
           
           sonidos.pasos.pause();
           sonidos.victoria.play().catch(() => {});
       
           if (imgEl) {
               imgEl.classList.add('hidden');
               imgEl.style.display = 'none';
           }
       
           modal.style.zIndex = "5000"; 
           modal.classList.remove('hidden');
           titulo.innerText = "¡NIVEL COMPLETADO!";
       
           container.innerHTML = `
               <div style="text-align:center; padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                   <div style="font-size: 80px; margin-bottom: 10px; filter: drop-shadow(0 0 15px #ffd166); animation: bounce 2s infinite;">💎</div>
                   <p style="color:#333; font-size: 20px; font-weight: bold; margin: 10px 0; font-family: var(--font-body);">
                       ¡Has obtenido la Gema del Valle!
                   </p>
                   <p style="color:#555; font-size: 16px; margin-bottom: 15px; font-style: italic; font-family: var(--font-body);">
                       "Los 7 sacramentos han sido revelados."
                   </p>
                   <div style="background: #f0f0f0; padding: 10px 30px; border-radius: 50px; border: 2px solid #ffd166; margin-bottom: 20px;">
                       <span style="color:#333; font-family: var(--font-titles); font-size: 22px;">
                           Puntos: ${gemasRecolectadas}
                       </span>
                   </div>
                   <button class="choice" id="btn-finish" style="width: 100%; max-width: 250px; cursor: pointer; pointer-events: auto;">
                       VOLVER AL MAPA
                   </button>
               </div>
           `;
       
           document.getElementById('btn-finish').onclick = () => {
               modal.classList.add('hidden');
               onComplete(gemasRecolectadas);
           };
       }
   
       /* --- CARGA DE ASSETS --- */
       const todasLasImagenes = [...framesCaminar, ...framesSalto, assets.fondo, assets.cofreC, assets.cofreA];
       
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
               img.onload = () => {
                   cargadas++;
                   if (cargadas >= todasLasImagenes.length) intentarIniciar();
               };
               img.onerror = () => {
                   cargadas++;
                   if (cargadas >= todasLasImagenes.length) intentarIniciar();
               };
           }
       });
   
       if (cargadas >= todasLasImagenes.length) {
           intentarIniciar();
       }
   }