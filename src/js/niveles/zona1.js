/* ====================================================================== 
   ZONA 1: EL VALLE DEL DESCUBRIMIENTO (Versión Final Completa)
   ====================================================================== */
   import { zona1Data } from '../../data/preguntas.js';
   import { sonidos } from '../main.js';
   
   export function iniciarZona1(onComplete) {
       const canvas = document.getElementById('map-canvas');
       const ctx = canvas.getContext('2d');
       const modal = document.getElementById('trivia-modal');
       
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
       let tiempoEnNivel = 0;
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
           speed: 4.5, vy: 0, gravity: 0.6,
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
   
       if (btnLeft) { 
           btnLeft.onpointerdown = (e) => { e.preventDefault(); keys['ArrowLeft'] = true; }; 
           btnLeft.onpointerup = () => keys['ArrowLeft'] = false; 
       }
       if (btnRight) { 
           btnRight.onpointerdown = (e) => { e.preventDefault(); keys['ArrowRight'] = true; }; 
           btnRight.onpointerup = () => keys['ArrowRight'] = false; 
       }
       if (btnJump) { btnJump.onpointerdown = (e) => { e.preventDefault(); saltar(); }; }
   
       function iniciarTrivia(cofre) {
           esperandoRespuesta = true;
           sonidos.pasos.pause();
           sonidos.abrirCofre.currentTime = 0;
           sonidos.abrirCofre.play().catch(()=>{});
           Object.keys(keys).forEach(k => keys[k] = false);
   
           modal.classList.remove('hidden');
           const imgEl = document.getElementById('current-sacramento-img');
           if(imgEl) imgEl.src = cofre.img;
   
           const titulo = document.getElementById('trivia-title');
           const container = document.getElementById('options-container');
           titulo.innerText = "¡ADIVINA EL SACRAMENTO!";
           container.innerHTML = `<p style="color:#00FFFF; text-align:center; font-size:14px; margin-bottom:10px;">${cofre.mensaje}</p>`;
   
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
           tiempoEnNivel++;
           
           let moviendose = false;
           if (keys['ArrowRight'] || keys['KeyD']) { player.x += player.speed; player.facingRight = true; moviendose = true; }
           if (keys['ArrowLeft'] || keys['KeyA']) { player.x -= player.speed; player.facingRight = false; moviendose = true; }
   
           if (moviendose && !player.isJumping) {
               if (sonidos.pasos.paused) sonidos.pasos.play().catch(()=>{});
           } else { sonidos.pasos.pause(); }
   
           player.vy += player.gravity;
           player.y += player.vy;
           if (player.y > GROUND_Y) { player.y = GROUND_Y; player.vy = 0; player.isJumping = false; }
   
           // --- LÓGICA DE PLATAFORMAS (LADRILLO SÓLIDO) ---
           for (let plat of plataformas) {
               if (player.x + player.w > plat.x && player.x < plat.x + plat.w) {
                   // Aterrizar (Arriba)
                   if (player.vy > 0 && player.y + player.h > plat.y && player.y + player.h < plat.y + 25) {
                       player.y = plat.y - player.h;
                       player.vy = 0;
                       player.isJumping = false;
                   } 
                   // Chocar Cabeza (Abajo)
                   else if (player.vy < 0 && player.y > plat.y + plat.h - 15 && player.y < plat.y + plat.h) {
                       player.y = plat.y + plat.h;
                       player.vy = 0;
                   }
               }
           }
   
           player.x = Math.max(0, Math.min(WORLD_WIDTH - player.w, player.x));
           cameraX = Math.max(0, Math.min(WORLD_WIDTH - VIEWPORT_WIDTH, player.x - VIEWPORT_WIDTH / 2));
   
           // --- DETECCIÓN DE COFRES ESTRICTA ---
           cofres.forEach(cofre => {
               if (!cofre.abierto) {
                   const margen = 20; 
                   const colH = player.x + player.w - margen > cofre.x && player.x + margen < cofre.x + cofre.w;
                   const colV = player.y + player.h - margen > cofre.y && player.y + margen < cofre.y + cofre.h;
   
                   if (colH && colV) {
                       iniciarTrivia(cofre);
                   }
               }
           });
       }
   
       function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(-Math.floor(cameraX), 0);
        
        if (assets.fondo.complete) ctx.drawImage(assets.fondo, 0, 0, WORLD_WIDTH, canvas.height);
        
        // --- DIBUJO DE PLATAFORMAS TIPO LADRILLO ---
        plataformas.forEach(plat => {
            // Cuerpo del ladrillo (Color base terracota)
            ctx.fillStyle = "#A52A2A"; 
            ctx.fillRect(plat.x, plat.y, plat.w, plat.h);

            // Borde superior (Brillo/Relieve)
            ctx.fillStyle = "#E9967A";
            ctx.fillRect(plat.x, plat.y, plat.w, 3);

            // Borde inferior (Sombra)
            ctx.fillStyle = "#5D1919";
            ctx.fillRect(plat.x, plat.y + plat.h - 3, plat.w, 3);

            // Dibujar líneas divisorias de ladrillos
            ctx.strokeStyle = "#5D1919";
            ctx.lineWidth = 2;
            
            // Línea central horizontal opcional
            // ctx.strokeRect(plat.x, plat.y, plat.w, plat.h); 

            // Divisiones verticales (hacemos 3 ladrillos por plataforma)
            const numLadrillos = 3;
            const anchoLadrillo = plat.w / numLadrillos;
            for(let i = 1; i < numLadrillos; i++) {
                ctx.beginPath();
                ctx.moveTo(plat.x + (i * anchoLadrillo), plat.y);
                ctx.lineTo(plat.x + (i * anchoLadrillo), plat.y + plat.h);
                ctx.stroke();
            }
            
            // Contorno general para que resalte
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1;
            ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
        });

        // --- DIBUJO DE COFRES ---
        cofres.forEach(cofre => {
            const img = cofre.abierto ? assets.cofreA : assets.cofreC;
            if (img.complete) ctx.drawImage(img, cofre.x, cofre.y, cofre.w, cofre.h);
        });

        // --- DIBUJO DEL JUGADOR ---
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
           update();
           draw();
           requestID = requestAnimationFrame(loop);
       }
   
       function mostrarMensajeInicio() {
           esperandoRespuesta = true;
           modal.classList.remove('hidden');
           document.getElementById('trivia-title').innerText = "EL VALLE DEL DESCUBRIMIENTO";
           document.getElementById('options-container').innerHTML = `
               <p style="color:white; text-align:center; margin-bottom:20px;">
                   Debes subir a las plataformas para alcanzar los cofres sagrados. 
                   ¡No podrás abrirlos desde abajo!
               </p>
               <button class="choice" id="btn-start">¡EMPEZAR!</button>
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

        // 1. Ocultar la imagen de la trivia (sacramento) para que no estorbe
        const imgTrivia = document.getElementById('current-sacramento-img');
        if (imgTrivia) imgTrivia.style.display = 'none';

        modal.classList.remove('hidden');
        
        document.getElementById('trivia-title').innerText = "¡NIVEL COMPLETADO!";
        
        // 2. Usar el emoji de diamante con estilo de brillo
        document.getElementById('options-container').innerHTML = `
            <div style="text-align:center; margin-bottom:20px;">
                <div style="font-size: 80px; filter: drop-shadow(0 0 15px #00FFFF); animation: pulse 1.5s infinite;">
                    💎
                </div>
                <p style="color:white; font-size:18px; margin-top:15px; font-weight:bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
                    ¡Has obtenido la Gema del Valle!
                </p>
                <p style="color:#00FFFF; font-size:14px; margin-top:5px;">
                    ¡Los 7 Sacramentos han sido revelados!
                </p>
            </div>
            <button class="choice" id="btn-finish">RECLAMAR Y VOLVER AL MAPA</button>
        `;

        // 3. Estilo de animación para que el emoji palpite
        if (!document.getElementById('pulse-animation')) {
            const style = document.createElement('style');
            style.id = 'pulse-animation';
            style.innerHTML = `
                @keyframes pulse {
                    0% { transform: scale(1); filter: drop-shadow(0 0 10px #00FFFF); }
                    50% { transform: scale(1.2); filter: drop-shadow(0 0 25px #00FFFF); }
                    100% { transform: scale(1); filter: drop-shadow(0 0 10px #00FFFF); }
                }
            `;
            document.head.appendChild(style);
        }

        document.getElementById('btn-finish').onclick = () => {
            // Restaurar la visibilidad de la imagen para el siguiente nivel o cofre
            if (imgTrivia) imgTrivia.style.display = 'block';
            
            modal.classList.add('hidden');
            onComplete(gemasRecolectadas);
        };
    }
   
       if (assets.player.complete) mostrarMensajeInicio();
       else assets.player.onload = mostrarMensajeInicio;
   }