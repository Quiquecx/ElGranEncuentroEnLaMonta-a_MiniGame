/* ====================================================================== 
   ZONA 1: EL VALLE DEL DESCUBRIMIENTO (Sacramentos) 
   ====================================================================== */
   import { zona1Data } from '../../data/preguntas.js';
   import { sonidos } from '../main.js';
   
   export function iniciarZona1(onComplete) {
       // --- 1. REFERENCIAS AL DOM ---
       const canvas = document.getElementById('map-canvas');
       const ctx = canvas.getContext('2d');
       const modal = document.getElementById('trivia-modal');
       const timerDisplay = document.getElementById('timer-count');
       const gemDisplay = document.getElementById('gem-count');
       
       // Botones táctiles
       const btnLeft = document.getElementById('btn-left');
       const btnRight = document.getElementById('btn-right');
       const btnJump = document.getElementById('btn-jump');
   
       // --- 2. CONFIGURACIÓN Y ESTADO ---
       const VIEWPORT_WIDTH = 900;
       const WORLD_WIDTH = 1280;
       const GROUND_Y = 450;
   
       let nivelActivo = true;
       let esperandoRespuesta = false;
       let cameraX = 0;
       let gemasRecolectadas = 0;
       let tiempoEnNivel = 0;
       let timerInterval = null;
       let requestID = null;
   
       // --- 3. ASSETS (IMÁGENES) ---
       const assets = {
           fondo: new Image(),
           cofreC: new Image(),
           cofreA: new Image(),
           player: new Image()
       };
       assets.fondo.src = 'src/imgs/fondos/fondo_level1.png';
       assets.cofreC.src = 'src/imgs/general/L8 Cofre cerrado.png';
       assets.cofreA.src = 'src/imgs/general/L8 Cofre abierto.png';
       assets.player.src = 'src/imgs/protagonistas/Niña 01.png';
   
       // --- 4. ENTIDADES DEL JUEGO ---
       let player = {
           x: 100, y: GROUND_Y, w: 70, h: 90,
           speed: 4.5, vy: 0, gravity: 0.6,
           jumpPower: -16, isJumping: false, facingRight: true
       };
   
       const plataformas = [
           { x: 300, y: 350, w: 150, h: 20 },
           { x: 550, y: 250, w: 150, h: 20 },
           { x: 850, y: 350, w: 150, h: 20 }
       ];
   
       let cofres = zona1Data.slice(0, 7).map((data, i) => {
           const positions = [
               { x: 350, y: 290 }, { x: 600, y: 190 }, { x: 900, y: 290 },
               { x: 450, y: 475 }, { x: 750, y: 475 }, { x: 1000, y: 475 }, { x: 1200, y: 475 }
           ];
           return { ...data, x: positions[i].x, y: positions[i].y, w: 60, h: 60, abierto: false };
       });
   
       // --- 5. SISTEMA DE CONTROLES ---
       const keys = {};
   
       const saltar = () => {
           if (!player.isJumping && !esperandoRespuesta && nivelActivo) {
               player.vy = player.jumpPower;
               player.isJumping = true;
               sonidos.salto.currentTime = 0;
               sonidos.salto.play().catch(()=>{});
           }
       };
   
       const handleKeyDown = (e) => {
           keys[e.code] = true;
           if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) saltar();
       };
       const handleKeyUp = (e) => keys[e.code] = false;
   
       window.addEventListener('keydown', handleKeyDown);
       window.addEventListener('keyup', handleKeyUp);
   
       // Vinculación Táctil
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
           btnJump.onpointerdown = (e) => { e.preventDefault(); saltar(); };
       }
   
       // --- 6. LÓGICA (UPDATE) ---
       function update() {
           if (!nivelActivo || esperandoRespuesta) {
               sonidos.pasos.pause();
               return;
           }
           tiempoEnNivel++;
   
           let moviendose = false;
           if (keys['ArrowRight'] || keys['KeyD']) {
               player.x += player.speed;
               player.facingRight = true;
               moviendose = true;
           }
           if (keys['ArrowLeft'] || keys['KeyA']) {
               player.x -= player.speed;
               player.facingRight = false;
               moviendose = true;
           }
   
           if (moviendose && !player.isJumping) {
               if (sonidos.pasos.paused) sonidos.pasos.play().catch(()=>{});
           } else {
               sonidos.pasos.pause();
           }
   
           player.vy += player.gravity;
           player.y += player.vy;
   
           if (player.y > GROUND_Y) {
               player.y = GROUND_Y;
               player.vy = 0;
               player.isJumping = false;
           }
   
           // Colisión con plataformas
           plataformas.forEach(plat => {
               if (player.vy > 0 && player.x + player.w > plat.x && player.x < plat.x + plat.w &&
                   player.y + player.h > plat.y && player.y + player.h < plat.y + 10) {
                   player.y = plat.y - player.h;
                   player.vy = 0;
                   player.isJumping = false;
               }
           });
   
           player.x = Math.max(0, Math.min(WORLD_WIDTH - player.w, player.x));
           cameraX = Math.max(0, Math.min(WORLD_WIDTH - VIEWPORT_WIDTH, player.x - VIEWPORT_WIDTH / 2));
   
           // Solo permitir abrir cofres después de un pequeño delay inicial
           if (tiempoEnNivel > 30) {
               cofres.forEach(cofre => {
                   if (!cofre.abierto && player.x < cofre.x + cofre.w && player.x + player.w > cofre.x && player.y < cofre.y + cofre.h && player.y + player.h > cofre.y) {
                       iniciarTrivia(cofre);
                   }
               });
           }
       }
   
       // --- 7. TRIVIA ---
       function iniciarTrivia(cofre) {
           esperandoRespuesta = true;
           sonidos.pasos.pause();
           sonidos.abrirCofre.currentTime = 0;
           sonidos.abrirCofre.play().catch(()=>{});
   
           Object.keys(keys).forEach(k => keys[k] = false);
   
           modal.classList.remove('hidden');
           document.getElementById('current-sacramento-img').src = cofre.img;
   
           const titulo = document.getElementById('trivia-title');
           const container = document.getElementById('options-container');
           titulo.innerText = "¡ADIVINA EL SACRAMENTO!";
           container.innerHTML = '';
   
           const pistaTxt = document.createElement('p');
           pistaTxt.innerText = cofre.mensaje;
           pistaTxt.style.cssText = "color:#00FFFF; margin-bottom:15px; font-size:14px; text-align:center;";
           container.appendChild(pistaTxt);
   
           let tiempoRestante = 15;
           timerDisplay.innerText = tiempoRestante;
           clearInterval(timerInterval);
           timerInterval = setInterval(() => {
               tiempoRestante--;
               timerDisplay.innerText = tiempoRestante;
               if (tiempoRestante <= 0) {
                   clearInterval(timerInterval);
                   sonidos.error.play().catch(()=>{});
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
                       sonidos.correcto.currentTime = 0;
                       sonidos.correcto.play().catch(()=>{});
                       
                       gemasRecolectadas++;
                       cofre.abierto = true;
                       gemDisplay.innerText = gemasRecolectadas;
                       titulo.innerText = "¡CORRECTO! ✨";
                       setTimeout(() => {
                           modal.classList.add('hidden');
                           esperandoRespuesta = false;
                           if (gemasRecolectadas >= 7) finalizarNivel();
                       }, 800);
                   } else {
                       sonidos.error.currentTime = 0;
                       sonidos.error.play().catch(()=>{});
                       titulo.innerText = "¡INTENTA DE NUEVO! ❌";
                   }
               };
               container.appendChild(btn);
           });
       }
   
       // --- 8. RENDERIZADO (DRAW) ---
       function draw() {
           ctx.clearRect(0, 0, canvas.width, canvas.height);
           ctx.save();
           ctx.translate(-cameraX, 0);
   
           if (assets.fondo.complete) ctx.drawImage(assets.fondo, 0, 0, WORLD_WIDTH, canvas.height);
   
           // Dibujar plataformas (opcional, invisibles si el fondo ya las tiene)
           ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
           plataformas.forEach(plat => ctx.fillRect(plat.x, plat.y, plat.w, plat.h));
   
           cofres.forEach(cofre => {
               let img = cofre.abierto ? assets.cofreA : assets.cofreC;
               if (img.complete) ctx.drawImage(img, cofre.x, cofre.y, cofre.w, cofre.h);
           });
   
           if (assets.player.complete) {
               ctx.save();
               if (!player.facingRight) {
                   ctx.translate(player.x + player.w, player.y);
                   ctx.scale(-1, 1);
                   ctx.drawImage(assets.player, 0, 0, player.w, player.h);
               } else {
                   ctx.drawImage(assets.player, player.x, player.y, player.w, player.h);
               }
               ctx.restore();
           }
   
           ctx.restore();
       }
   
       // --- 9. FINALIZACIÓN ---
       function finalizarNivel() {
           nivelActivo = false;
           sonidos.pasos.pause();
           sonidos.victoria.currentTime = 0;
           sonidos.victoria.play().catch(()=>{});
   
           cancelAnimationFrame(requestID);
           window.removeEventListener('keydown', handleKeyDown);
           window.removeEventListener('keyup', handleKeyUp);
   
           document.getElementById('victory-screen').classList.remove('hidden');
           document.getElementById('btn-victory-next').onclick = () => {
               document.getElementById('victory-screen').classList.add('hidden');
               onComplete(gemasRecolectadas);
           };
       }
   
       // --- 10. CICLO PRINCIPAL ---
       function loop() {
           if (!nivelActivo) return;
           update();
           draw();
           requestID = requestAnimationFrame(loop);
       }
   
       if (assets.player.complete) loop();
       else assets.player.onload = loop;
   }