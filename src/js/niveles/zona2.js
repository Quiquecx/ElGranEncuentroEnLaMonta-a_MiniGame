/* ======================================================================
   ZONA 2: EL SENDERO DEL ESPÍRITU (Profetas y Dilemas)
   ====================================================================== */
   import { zona2Data } from '../../data/preguntas.js';
   import { sonidos } from '../main.js'; 
   
   export function iniciarZona2(onComplete) {
       const canvas = document.getElementById('map-canvas');
       const ctx = canvas.getContext('2d');
       const modal = document.getElementById('trivia-modal');
       const gemDisplay = document.getElementById('gem-count');
   
       const VIEWPORT_WIDTH = 900;
       const WORLD_WIDTH = 2200; 
       const GROUND_Y = 450;
       
       let nivelActivo = false;
       let esperandoRespuesta = false;
       let cameraX = 0;
       let retosCompletados = 0;
       let puntajeAcumulado = 0;
       let requestID = null;
   
       // --- ASSETS ---
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
           speed: 5, vy: 0, gravity: 0.6, jumpPower: -14, 
           isJumping: false, facingRight: true 
       };
   
       const keys = {};
   
       // --- DISTRIBUCIÓN DINÁMICA DE COFRES ---
       // Calculamos el espacio para que el primer cofre no esté pegado al inicio 
       // y el último no esté pegado al final del mundo.
       const margenInicial = 500;
       const margenFinal = 300;
       const espacioDisponible = WORLD_WIDTH - margenInicial - margenFinal;
       const separacion = espacioDisponible / (zona2Data.length - 1 || 1);
   
       let cofres = zona2Data.map((data, i) => ({
           ...data,
           x: margenInicial + (i * separacion), 
           y: 475,
           w: 60, h: 60,
           abierto: false
       }));
   
       // --- CONTROLES ---
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
   
       window.addEventListener('keydown', handleKeyDown);
       window.addEventListener('keyup', handleKeyUp);
   
       // --- MENSAJES UI ---
       function mostrarMensajeInicio() {
           esperandoRespuesta = true;
           modal.classList.remove('hidden');
           document.getElementById('timer-container').classList.add('hidden');
           document.getElementById('current-sacramento-img').classList.add('hidden');
           
           const titulo = document.getElementById('trivia-title');
           const container = document.getElementById('options-container');
           
           titulo.innerText = "EL SENDERO DEL ESPÍRITU";
           container.innerHTML = `
               <p style="color:white; margin-bottom:20px; text-align:center;">Supera los dilemas y escucha la voz de los profetas para avanzar hacia la cumbre.</p>
               <button class="choice" id="btn-comenzar-z2" style="width: 200px; margin: 0 auto;">¡COMENZAR!</button>
           `;
           
           document.getElementById('btn-comenzar-z2').onclick = () => {
               modal.classList.add('hidden');
               esperandoRespuesta = false;
               nivelActivo = true;
               loop();
           };
       }
   
       function mostrarMensajeFinal() {
        nivelActivo = false;
        esperandoRespuesta = true;
        sonidos.pasos.pause();
        sonidos.victoria.currentTime = 0;
        sonidos.victoria.play().catch(() => {});

        modal.classList.remove('hidden');
        const titulo = document.getElementById('trivia-title');
        const container = document.getElementById('options-container');

        titulo.innerText = "¡SABIDURÍA ALCANZADA!";
        container.innerHTML = `
            <div style="text-align:center; color:white;">
                <p style="margin-bottom:20px; font-size:14px;">
                    Has completado el sendero. Tu espíritu está fortalecido.<br><br>
                    <strong>¡Has obtenido la gema de la Sabiduría!</strong>
                </p>
                <button class="choice" id="btn-final-z2" style="width: 220px; margin: 0 auto;">VOLVER AL MAPA</button>
            </div>
        `;

        document.getElementById('btn-final-z2').onclick = () => {
            // 1. Limpiar procesos de este nivel
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            cancelAnimationFrame(requestID);
            
            // 2. CAMBIO VISUAL: Ocultar UI de juego y mostrar el Mapa
            modal.classList.add('hidden');
            document.getElementById('map-screen').classList.remove('hidden'); // Asegura que el mapa se vea
            // Si tienes una pantalla específica para niveles (ej: game-screen), ocúltala aquí:
            // document.getElementById('game-screen').classList.add('hidden'); 

            // 3. Notificar al main.js que el nivel terminó
            onComplete(retosCompletados); 
        };
    }
   
       // --- LÓGICA DE RETOS ---
       function abrirReto(reto) {
           esperandoRespuesta = true;
           sonidos.pasos.pause();
           sonidos.abrirCofre.currentTime = 0;
           sonidos.abrirCofre.play().catch(() => {});
           Object.keys(keys).forEach(k => keys[k] = false);
           
           modal.classList.remove('hidden');
           const container = document.getElementById('options-container');
           const titulo = document.getElementById('trivia-title');
           container.innerHTML = '';
           titulo.innerText = reto.instruccion || "RESUELVE EL RETO";
   
           if (reto.tipo === "ordenar") {
               const zonaDestino = document.createElement('div');
               zonaDestino.className = 'drop-zone'; 
               zonaDestino.style.cssText = "min-height:60px; border:2px dashed #fff; margin:10px; padding:10px; color:#00FFFF; font-size:14px; background: rgba(0,0,0,0.3); text-align:center;";
   
               const areaPalabras = document.createElement('div');
               areaPalabras.style.cssText = "display:flex; flex-wrap:wrap; gap:8px; justify-content:center;";
   
               let palabrasSeleccionadas = [];
               let palabrasMezcladas = [...reto.palabras].sort(() => Math.random() - 0.5);
   
               palabrasMezcladas.forEach(p => {
                   const btn = document.createElement('button');
                   btn.className = 'choice';
                   btn.style.width = "auto";
                   btn.innerText = p;
                   btn.onclick = () => {
                       palabrasSeleccionadas.push(p);
                       zonaDestino.innerText = palabrasSeleccionadas.join(" ");
                       btn.style.display = "none";
                       if (zonaDestino.innerText.trim() === reto.solucion) {
                           sonidos.correcto.play().catch(() => {});
                           finalizarReto(titulo, "¡EXCELENTE! ✨", 10, reto);
                       } else if (palabrasSeleccionadas.length >= reto.palabras.length) {
                           sonidos.incorrecto.play().catch(() => {});
                           titulo.innerText = "¡INTENTA DE NUEVO! ❌";
                           setTimeout(() => abrirReto(reto), 1200);
                       }
                   };
                   areaPalabras.appendChild(btn);
               });
               container.appendChild(zonaDestino);
               container.appendChild(areaPalabras);
   
           } else {
               titulo.innerText = reto.pregunta;
               reto.opciones.forEach(opt => {
                   const btn = document.createElement('button');
                   btn.className = 'choice';
                   btn.innerText = opt.texto;
                   btn.onclick = () => {
                       if (opt.pts > 0) {
                           sonidos.correcto.play().catch(() => {});
                           finalizarReto(titulo, "¡MUY BIEN! ✨", opt.pts, reto);
                       } else {
                           sonidos.incorrecto.play().catch(() => {});
                           titulo.innerText = "¡PIENSA DE NUEVO! ❌";
                       }
                   };
                   container.appendChild(btn);
               });
           }
       }
   
       function finalizarReto(titulo, msg, puntos, cofreActual) {
           titulo.innerText = msg;
           cofreActual.abierto = true; 
           setTimeout(() => {
               modal.classList.add('hidden');
               esperandoRespuesta = false;
               retosCompletados++;
               gemDisplay.innerText = parseInt(gemDisplay.innerText) + 1;
               if (retosCompletados >= cofres.length) mostrarMensajeFinal();
           }, 1800);
       }
   
       // --- CICLO DE JUEGO ---
       function update() {
           if (!nivelActivo || esperandoRespuesta) {
               sonidos.pasos.pause();
               return;
           }
   
           let moviendose = false;
           if (keys['ArrowRight'] || keys['KeyD']) { player.x += player.speed; player.facingRight = true; moviendose = true; }
           if (keys['ArrowLeft'] || keys['KeyA']) { player.x -= player.speed; player.facingRight = false; moviendose = true; }
           
           if (moviendose && !player.isJumping) {
               if (sonidos.pasos.paused) sonidos.pasos.play().catch(() => {});
           } else {
               sonidos.pasos.pause();
           }
   
           player.vy += player.gravity;
           player.y += player.vy;
           if (player.y > GROUND_Y) { player.y = GROUND_Y; player.vy = 0; player.isJumping = false; }
           
           player.x = Math.max(0, Math.min(WORLD_WIDTH - player.w, player.x));
           cameraX = Math.max(0, Math.min(WORLD_WIDTH - VIEWPORT_WIDTH, player.x - VIEWPORT_WIDTH / 2));
   
           cofres.forEach(cofre => {
               if (!cofre.abierto && 
                   player.x < cofre.x + cofre.w && player.x + player.w > cofre.x && 
                   player.y < cofre.y + cofre.h && player.y + player.h > cofre.y) {
                   abrirReto(cofre);
               }
           });
       }
   
       function draw() {
           ctx.clearRect(0, 0, canvas.width, canvas.height);
           ctx.save();
           ctx.translate(-cameraX, 0);
           if (assets.fondo.complete) ctx.drawImage(assets.fondo, 0, 0, WORLD_WIDTH, canvas.height);
           
           cofres.forEach(cofre => {
               let img = cofre.abierto ? assets.cofreAbierto : assets.cofreCerrado;
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
   
       function loop() {
           if (nivelActivo || esperandoRespuesta) {
               update(); draw();
               requestID = requestAnimationFrame(loop);
           }
       }
   
       mostrarMensajeInicio();
   }