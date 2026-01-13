/* ======================================================================
   ZONA 2: EL SENDERO DEL ESPÍRITU - CORREGIDO (PUNTOS Y CIERRE)
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
   
       // --- LÓGICA DE PUNTOS (LIMITADA A MÁXIMO 2) ---
       function procesarPuntaje(pts) {
           // Forzamos que el valor nunca sea mayor a 2 ni menor a 0
           let puntosValidados = Math.min(Math.max(pts, 0), 2);
   
           if (puntosValidados === 2) sonidos.correcto.play().catch(() => {});
           else if (puntosValidados === 1) sonidos.salto.play().catch(() => {});
           else sonidos.error.play().catch(() => {});
   
           puntajeEspirituTotal += puntosValidados;
           let actualHUD = parseInt(gemDisplay.innerText) || 0;
           gemDisplay.innerText = actualHUD + puntosValidados;
       }
   
       function abrirReto(reto) {
           esperandoRespuesta = true;
           intentosEnRetoActual = 0;
           sonidos.pasos.pause();
           sonidos.abrirCofre.play().catch(() => {});
           
           // Limpiar teclas para evitar que el personaje siga corriendo
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
                   let msg = opt.pts >= 2 ? "¡EXCELENTE! ✨" : (opt.pts === 1 ? "¡BIEN! 👍" : "SIGUE APRENDIENDO 📚");
                   finalizarReto(titulo, `${msg} +${Math.min(opt.pts, 2)}`, reto);
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
                       finalizarReto(titulo, `¡CORRECTO! +${ptsFinales} ✨`, reto);
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
        
        // Pausar sonidos de pasos y tocar victoria
        sonidos.pasos.pause();
        sonidos.victoria.play().catch(() => {});
        
        // 1. Limpiar cualquier imagen previa que pueda estorbar
        imgElement.classList.add('hidden');
        imgElement.style.display = 'none';
    
        // 2. Asegurar que el modal esté por encima de todo
        modal.style.zIndex = "5000"; 
        modal.classList.remove('hidden');
    
        // 3. Título claro
        titulo.innerText = "¡NIVEL COMPLETADO!";
    
        // 4. Inyectar contenido con estilos de seguridad
        container.innerHTML = `
            <div style="text-align:center; padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <div style="font-size: 80px; margin-bottom: 10px; filter: drop-shadow(0 0 15px #ffd166); animation: bounce 2s infinite;">💎</div>
                
                <p style="color:#333; font-size: 20px; font-weight: bold; margin: 10px 0; font-family: var(--font-body);">
                    ¡Has obtenido la Gema de la Sabiduría!
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
    
        // 5. Listener de cierre corregido
        const btnFinal = document.getElementById('btn-final-z2');
        btnFinal.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log("Cerrando Nivel 2...");
            
            // Ocultar modal y limpiar eventos
            modal.classList.add('hidden');
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            
            if (requestID) cancelAnimationFrame(requestID);
            
            // Devolver el puntaje al mapa
            onComplete(puntajeEspirituTotal);
        };
    }
   
       // --- NÚCLEO DEL JUEGO ---
       function update() {
           if (!nivelActivo || esperandoRespuesta) return;
           
           if (keys['ArrowRight'] || keys['KeyD']) { 
               player.x += player.speed; player.facingRight = true; 
           } else if (keys['ArrowLeft'] || keys['KeyA']) { 
               player.x -= player.speed; player.facingRight = false; 
           }
           
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
   
       const handleKeyDown = (e) => { 
           keys[e.code] = true; 
           if (['Space', 'ArrowUp', 'KeyW'].includes(e.code) && !player.isJumping && !esperandoRespuesta && nivelActivo) {
               player.vy = player.jumpPower; player.isJumping = true;
               sonidos.salto.play().catch(() => {});
           }
       };
       const handleKeyUp = (e) => keys[e.code] = false;
   
       window.addEventListener('keydown', handleKeyDown);
       window.addEventListener('keyup', handleKeyUp);
   
      // --- INICIO DEL NIVEL CON LIMPIEZA PROFUNDA ---
    esperandoRespuesta = true;

    // 1. Ocultar y limpiar elementos del "Final del Juego" que puedan estar visibles
    const chestAnim = document.getElementById('treasure-chest-anim');
    const statsSummary = document.getElementById('stats-summary');
    const finalRank = document.getElementById('final-rank-text');

    if (chestAnim) {
        chestAnim.classList.add('hidden');
        chestAnim.classList.remove('chest-open'); // Quita la imagen del cofre
        chestAnim.style.display = 'none';         // Fuerza la desaparición
    }
    if (statsSummary) statsSummary.innerHTML = "";
    if (finalRank) finalRank.innerText = "";

    // 2. Limpiar el modal de trivia para la Zona 2
    modal.classList.remove('hidden');
    imgElement.classList.add('hidden'); // Oculta la imagen de sacramentos si existía
    imgElement.style.display = 'none';

    // 3. Configurar el contenido del mensaje inicial
    titulo.innerText = "EL SENDERO DEL ESPÍRITU";
    titulo.style.color = "var(--primary-purple)"; // Asegurar color legible
    
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

    // 4. Lógica del botón de inicio
    document.getElementById('btn-start-z2').onclick = () => {
        modal.classList.add('hidden');
        esperandoRespuesta = false;
        nivelActivo = true;
        loop();
    };
   }