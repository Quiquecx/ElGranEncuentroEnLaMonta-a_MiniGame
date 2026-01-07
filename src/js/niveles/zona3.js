/* ======================================================================
   ZONA 3: LA CIMA DE LA MONTAÑA (Elige con tu Conciencia)
   ====================================================================== */
   import { zona3Data, resultadosConciencia } from '../../data/preguntas.js';
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
       const WORLD_WIDTH = 2600; 
       const GROUND_Y = 450;
       
       let nivelActivo = false;
       let esperandoRespuesta = false;
       let cameraX = 0; 
       let retosCompletados = 0;
       let puntajeConcienciaTotal = 0;
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
           speed: 5, vy: 0, gravity: 0.6, jumpPower: -14, 
           isJumping: false, facingRight: true 
       };
   
       const keys = {};
   
       let cofres = zona3Data.map((data, i) => ({
           ...data,
           x: 450 + (i * 200), 
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
               sonidos.salto.play();
           }
       };
       const handleKeyUp = (e) => keys[e.code] = false;
   
       window.addEventListener('keydown', handleKeyDown);
       window.addEventListener('keyup', handleKeyUp);
   
       // --- MENSAJES INICIAL Y FINAL ---
       function mostrarMensajeInicio() {
           esperandoRespuesta = true;
           modal.classList.remove('hidden');
           document.getElementById('timer-container').classList.add('hidden');
           imgElement.classList.add('hidden');
           
           titulo.innerText = "LA CIMA DE LA CONCIENCIA";
           container.innerHTML = `
               <p style="color:white; margin-bottom:20px;">Estás en la cumbre. Aquí cada elección cuenta. Actúa según los mandamientos para alcanzar el tesoro final.</p>
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
           
           // SONIDO: ABRIR COFRE
           sonidos.abrirCofre.currentTime = 0;
           sonidos.abrirCofre.play();
   
           Object.keys(keys).forEach(k => keys[k] = false); 
           
           modal.classList.remove('hidden');
           document.getElementById('timer-container').classList.add('hidden');
           
           imgElement.src = cofre.img;
           imgElement.classList.remove('hidden');
           
           container.innerHTML = '';
           titulo.innerText = `Mandamiento: ${cofre.mandamiento}`;
           
           const instruccion = document.createElement('p');
           instruccion.innerHTML = `<strong style="color:#FFD700">Situación:</strong> ${cofre.situacion}`;
           instruccion.style.cssText = "color: white; margin-bottom: 20px; font-size: 15px; padding: 10px; background: rgba(0,0,0,0.4); border-radius: 8px;";
           container.appendChild(instruccion);
   
           cofre.opciones.forEach(opt => {
               const btn = document.createElement('button');
               btn.className = 'choice';
               btn.innerText = opt.texto;
               btn.onclick = () => {
                   // Validación sonora según puntaje
                   if (opt.pts >= 1) {
                       sonidos.correcto.currentTime = 0;
                       sonidos.correcto.play();
                   } else {
                       sonidos.incorrecto.currentTime = 0;
                       sonidos.incorrecto.play();
                   }
   
                   puntajeConcienciaTotal += opt.pts;
                   cofre.abierto = true;
                   retosCompletados++;
   
                   let icono = opt.pts === 2 ? "✅" : (opt.pts === 1 ? "🤔" : "❌");
                   titulo.innerText = `${icono} Obtuviste ${opt.pts} puntos`;
   
                   setTimeout(() => {
                       modal.classList.add('hidden');
                       esperandoRespuesta = false;
                       gemDisplay.innerText = parseInt(gemDisplay.innerText) + 1;
   
                       if (retosCompletados >= cofres.length) {
                           mostrarFinalConciencia();
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
           sonidos.victoria.currentTime = 0;
           sonidos.victoria.play();
   
           modal.classList.remove('hidden');
           imgElement.classList.add('hidden');
           container.innerHTML = '';
           
           let resultado;
           let colorPuntos;
           let iconoGrande;
   
           if (puntajeConcienciaTotal >= 18) {
               resultado = resultadosConciencia.brillante;
               colorPuntos = "#FFD700";
               iconoGrande = "🌟";
           } else if (puntajeConcienciaTotal >= 12) {
               resultado = resultadosConciencia.crecimiento;
               colorPuntos = "#ADFF2F";
               iconoGrande = "🌱";
           } else {
               resultado = resultadosConciencia.construccion;
               colorPuntos = "#FFA500";
               iconoGrande = "🧩";
           }
   
           const card = document.createElement('div');
           card.style.cssText = `background: rgba(20, 20, 50, 0.9); border: 3px solid ${colorPuntos}; border-radius: 20px; padding: 30px; text-align: center; box-shadow: 0 0 20px ${colorPuntos};`;
   
           titulo.innerText = "¡EXPEDICIÓN COMPLETADA!";
           titulo.style.color = "#FFF";
   
           card.innerHTML = `
               <div style="font-size: 60px; margin-bottom: 10px;">${iconoGrande}</div>
               <h2 style="color: ${colorPuntos}; font-size: 28px; margin: 10px 0;">${puntajeConcienciaTotal} Puntos</h2>
               <p style="color: #FFF; font-size: 16px; line-height: 1.6; margin: 20px 0;">"${resultado.msg}"</p>
           `;
   
           const btnFin = document.createElement('button');
           btnFin.className = 'choice';
           btnFin.innerText = "RECLAMAR TESORO FINAL";
           btnFin.style.cssText = `margin-top: 15px; width: 250px; background: ${colorPuntos}; color: #000;`;
           
           btnFin.onclick = () => {
               modal.classList.add('hidden');
               finalizarNivel();
           };
   
           container.appendChild(card);
           container.appendChild(btnFin);
       }
   
       function update() {
           if (!nivelActivo || esperandoRespuesta) {
               sonidos.pasos.pause();
               return;
           }
   
           let moviendose = false;
           if (keys['ArrowRight'] || keys['KeyD']) { player.x += player.speed; player.facingRight = true; moviendose = true; }
           if (keys['ArrowLeft'] || keys['KeyA']) { player.x -= player.speed; player.facingRight = false; moviendose = true; }
           
           if (moviendose && !player.isJumping) {
               if (sonidos.pasos.paused) sonidos.pasos.play();
           } else {
               sonidos.pasos.pause();
           }
   
           player.vy += player.gravity;
           player.y += player.vy;
           if (player.y > GROUND_Y) { player.y = GROUND_Y; player.vy = 0; player.isJumping = false; }
   
           player.x = Math.max(0, Math.min(WORLD_WIDTH - player.w, player.x));
           cameraX = Math.max(0, Math.min(WORLD_WIDTH - VIEWPORT_WIDTH, player.x - VIEWPORT_WIDTH / 2));
   
           cofres.forEach(cofre => {
               if (!cofre.abierto && player.x < cofre.x + cofre.w && player.x + player.w > cofre.x && player.y < cofre.y + cofre.h && player.y + player.h > cofre.y) {
                   abrirRetoConciencia(cofre);
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
           if (!nivelActivo && !esperandoRespuesta) return;
           update(); draw();
           requestID = requestAnimationFrame(loop);
       }
   
       function finalizarNivel() {
           cancelAnimationFrame(requestID);
           window.removeEventListener('keydown', handleKeyDown);
           window.removeEventListener('keyup', handleKeyUp);
           onComplete(puntajeConcienciaTotal);
       }
   
       mostrarMensajeInicio();
   }