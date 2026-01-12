/* ====================================================================== 
   ZONA 1: EL VALLE DEL DESCUBRIMIENTO (Versión Final Sin Tonos Azules)
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
       const GROUND_Y = 450;
   
       let nivelActivo = false;
       let esperandoRespuesta = false;
       let cameraX = 0;
       let gemasRecolectadas = 0;
       let timerInterval = null;
       let requestID = null;
   
       const assets = {
           fondo: new Image(), cofreC: new Image(),
           cofreA: new Image(), player: new Image()
       };
       assets.fondo.src = 'src/imgs/fondos/fondo_level1.png';
       assets.cofreC.src = 'src/imgs/general/L8 Cofre cerrado.png';
       assets.cofreA.src = 'src/imgs/general/L8 Cofre abierto.png';
       assets.player.src = 'src/imgs/protagonistas/Niña 01.png';
   
       let player = {
           x: 100, y: GROUND_Y, w: 70, h: 90,
           speed: 5, vy: 0, gravity: 0.6,
           jumpPower: -16, isJumping: false, facingRight: true
       };
   
       const plataformas = [
           { x: 300, y: 350, w: 150, h: 25 },
           { x: 550, y: 250, w: 150, h: 25 },
           { x: 850, y: 350, w: 150, h: 25 }
       ];
   
       let cofres = zona1Data.slice(0, 7).map((data, i) => {
           const positions = [
               { x: 350, y: 290 }, { x: 600, y: 190 }, { x: 900, y: 290 },
               { x: 450, y: 475 }, { x: 750, y: 475 }, { x: 1000, y: 475 }, { x: 1200, y: 475 }
           ];
           return { ...data, x: positions[i].x, y: positions[i].y, w: 60, h: 60, abierto: false };
       });
   
       const keys = {};
   
       const saltar = () => {
           if (!player.isJumping && !esperandoRespuesta && nivelActivo) {
               player.vy = player.jumpPower; player.isJumping = true;
               sonidos.salto.currentTime = 0; sonidos.salto.play().catch(()=>{});
           }
       };
   
       const handleKeyDown = (e) => { keys[e.code] = true; if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) saltar(); };
       const handleKeyUp = (e) => keys[e.code] = false;
   
       function limpiarListeners() {
           window.removeEventListener('keydown', handleKeyDown);
           window.removeEventListener('keyup', handleKeyUp);
           clearInterval(timerInterval);
       }
   
       window.addEventListener('keydown', handleKeyDown);
       window.addEventListener('keyup', handleKeyUp);
   
       // --- TRIVIA SIN COLOR AZUL BAJITO ---
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
           }
   
           titulo.innerText = "¡ADIVINA EL SACRAMENTO!";
           
           // Pista corregida: Texto blanco con borde verde (eliminado el azul/cian)
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
   
           if (moviendose && !player.isJumping) {
               if (sonidos.pasos.paused) sonidos.pasos.play().catch(()=>{});
           } else { sonidos.pasos.pause(); }
   
           player.vy += player.gravity;
           player.y += player.vy;
           if (player.y > GROUND_Y) { player.y = GROUND_Y; player.vy = 0; player.isJumping = false; }
   
           for (let plat of plataformas) {
               if (player.x + player.w > plat.x && player.x < plat.x + plat.w) {
                   if (player.vy > 0 && player.y + player.h > plat.y && player.y + player.h < plat.y + 25) {
                       player.y = plat.y - player.h;
                       player.vy = 0; player.isJumping = false;
                   } else if (player.vy < 0 && player.y > plat.y + plat.h - 15 && player.y < plat.y + plat.h) {
                       player.y = plat.y + plat.h;
                       player.vy = 0;
                   }
               }
           }
   
           player.x = Math.max(0, Math.min(WORLD_WIDTH - player.w, player.x));
           cameraX = Math.max(0, Math.min(WORLD_WIDTH - VIEWPORT_WIDTH, player.x - VIEWPORT_WIDTH / 2));
   
           cofres.forEach(cofre => {
               if (!cofre.abierto) {
                   const colH = player.x + player.w - 20 > cofre.x && player.x + 20 < cofre.x + cofre.w;
                   const colV = player.y + player.h - 20 > cofre.y && player.y + 20 < cofre.y + cofre.h;
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
   
       function mostrarMensajeInicio() {
           esperandoRespuesta = true;
           modal.classList.remove('hidden');
           titulo.innerText = "EL VALLE DEL DESCUBRIMIENTO";
           container.innerHTML = `
               <div style="text-align:center;">
                   <p style="color:#333; font-weight: bold; margin-bottom:20px;">
                       Sube a las plataformas para alcanzar los cofres sagrados. 
                       ¡Descubre los 7 Sacramentos!
                   </p>
                   <button class="choice" id="btn-start">¡EMPEZAR!</button>
               </div>
           `;
           document.getElementById('btn-start').onclick = () => {
               modal.classList.add('hidden');
               esperandoRespuesta = false; nivelActivo = true;
               loop();
           };
       }
   
       function finalizarNivel() {
           nivelActivo = false;
           limpiarListeners();
           cancelAnimationFrame(requestID);
           sonidos.pasos.pause();
           sonidos.victoria.play().catch(()=>{});
   
           if (imgEl) imgEl.style.display = 'none';
           modal.classList.remove('hidden');
           titulo.innerText = "¡NIVEL COMPLETADO!";
           
           // Mensaje final sin color azul (Cyan)
           container.innerHTML = `
               <div style="text-align:center; padding: 10px;">
                   <div style="font-size: 80px; filter: drop-shadow(0 0 15px gold); animation: bounce 2s infinite;">💎</div>
                   <p style="color:#333; font-size:20px; margin-top:15px; font-weight:bold;">¡Gema obtenida!</p>
                   <p style="color:var(--book-green); font-size:16px; margin-top:5px; font-weight: bold;">¡Has obtenido la Gema del sendero del Espíritu!</p>
               </div>
               <button class="choice" id="btn-finish" style="width:100%; margin-top:20px;">VOLVER AL MAPA</button>
           `;
   
           document.getElementById('btn-finish').onclick = () => {
               modal.classList.add('hidden');
               onComplete(gemasRecolectadas);
           };
       }
   
       if (assets.player.complete) mostrarMensajeInicio();
       else assets.player.onload = mostrarMensajeInicio;
   }