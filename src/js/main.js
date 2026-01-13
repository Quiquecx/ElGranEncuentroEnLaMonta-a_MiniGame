/* ======================================================================
   EXPEDICIÓN A LA MONTAÑA SAGRADA - ARCHIVO PRINCIPAL
   ====================================================================== */
   import { iniciarZona1 } from './niveles/zona1.js';
   import { iniciarZona2 } from './niveles/zona2.js';
   import { iniciarZona3 } from './niveles/zona3.js';
   
   const canvas = document.getElementById('map-canvas');
   const ctx = canvas.getContext('2d');
   
   const BASE_WIDTH = 900;
   const BASE_HEIGHT = 600;
   canvas.width = BASE_WIDTH;
   canvas.height = BASE_HEIGHT;
   
   export const sonidos = {
       intro: new Audio('src/sonidos/intro.mp3'),
       pasos: new Audio('src/sonidos/adelante.mp3'),
       victoria: new Audio('src/sonidos/nivel_completado.mp3'),
       salto: new Audio('src/sonidos/salto.mp3'),
       abrirCofre: new Audio('src/sonidos/abrir.mp3'),
       correcto: new Audio('src/sonidos/correcto.mp3'),
       error: new Audio('src/sonidos/incorrecto.mp3') 
   };
   
   sonidos.intro.loop = true;
   sonidos.intro.volume = 0.5;
   sonidos.pasos.loop = true;
   
   const mapImg = new Image(); mapImg.src = 'src/imgs/fondos/fondo.png'; 
   const playerImg = new Image(); playerImg.src = 'src/imgs/protagonistas/Niña 01.png';
   
   let player = { x: 450, y: 300, speed: 6, w: 60, h: 70 }; 
   let gameActive = false;
   let gamePaused = false; 
   let estaEnNivel = false; 
   let puntosTotales = 0;
   let zonasCompletadas = 0; 
   const keys = {};
   
   const PUNTOS_ENTRADA = {
       zona1: { x: 458, y: 510, radio: 25, color: "rgba(255, 215, 0, 0.8)" },
       zona2: { x: 330, y: 283, radio: 25, color: "rgba(173, 255, 47, 0.8)" },
       zona3: { x: 560, y: 80, radio: 25, color: "rgba(0, 255, 255, 0.8)" },
       tesoro: { x: 680, y: 60, radio: 30, color: "rgba(255, 69, 0, 0.9)" }
   };
   
   /* --- CONTROL DE ESCALA ADAPTABLE --- */
   function resizeGame() {
       const width = window.innerWidth;
       const height = window.innerHeight;
       // El '1' al final de Math.min bloquea que el juego crezca más de 900x600
       const scale = Math.min(width / BASE_WIDTH, height / BASE_HEIGHT, 1);
       document.documentElement.style.setProperty('--game-scale', scale * 0.98);
   }
   
   window.addEventListener('resize', resizeGame);
   window.addEventListener('load', resizeGame);
   resizeGame();
   
   window.addEventListener('keydown', e => { if(!gamePaused) keys[e.code] = true; });
   window.addEventListener('keyup', e => keys[e.code] = false);
   
   function vincularControlesTactiles() {
       const mapping = {
           'btn-left': 'ArrowLeft', 'btn-right': 'ArrowRight',
           'btn-down': 'ArrowDown', 'btn-jump': 'ArrowUp'
       };
       Object.entries(mapping).forEach(([id, key]) => {
           const btn = document.getElementById(id);
           if (btn) {
               btn.onpointerdown = (e) => { e.preventDefault(); if(!gamePaused) keys[key] = true; };
               btn.onpointerup = (e) => { e.preventDefault(); keys[key] = false; };
               btn.onpointerleave = (e) => { e.preventDefault(); keys[key] = false; };
           }
       });
   }
   
   function initUI() {
       const btnStart = document.getElementById('start-game');
       const btnHowTo = document.getElementById('how-to');
       const btnCloseHowTo = document.getElementById('close-howto');
       const screenHowTo = document.getElementById('howto-screen');
       const btnPause = document.getElementById('btn-pause');
   
       vincularControlesTactiles();
   
       if(btnStart) {
           btnStart.onclick = () => {
               document.getElementById('menu').classList.add('hidden');
               document.getElementById('map-screen').classList.remove('hidden');
               document.getElementById('mobile-controls').classList.remove('hidden');
               if(btnPause) btnPause.classList.remove('hidden'); 
               sonidos.intro.play().catch(() => {});
               gameActive = true;
               gameLoop();
           };
       }
   
       if(btnHowTo) btnHowTo.onclick = () => screenHowTo.classList.remove('hidden');
       if(btnCloseHowTo) btnCloseHowTo.onclick = () => screenHowTo.classList.add('hidden');
   
       if(btnPause) {
           btnPause.onclick = () => {
               gamePaused = !gamePaused;
               if (gamePaused) {
                   btnPause.innerText = "▶️ REANUDAR";
                   sonidos.intro.pause();
                   sonidos.pasos.pause();
                   Object.keys(keys).forEach(k => keys[k] = false);
               } else {
                   btnPause.innerText = "⏸️ PAUSA";
                   if(!estaEnNivel) sonidos.intro.play().catch(() => {});
               }
           };
       }
   }
   
   function gameLoop() {
       // Verificamos si hay algún modal abierto para pausar el movimiento
       const isModalOpen = !document.getElementById('howto-screen').classList.contains('hidden');
       
       if (gameActive && !estaEnNivel && !isModalOpen) {
           if (!gamePaused) update();
           draw();
       }
       requestAnimationFrame(gameLoop);
   }
   
   function update() {
       let moviendose = false;
       if (keys['ArrowUp'] || keys['KeyW']) { player.y -= player.speed; moviendose = true; }
       if (keys['ArrowDown'] || keys['KeyS']) { player.y += player.speed; moviendose = true; }
       if (keys['ArrowLeft'] || keys['KeyA']) { player.x -= player.speed; moviendose = true; }
       if (keys['ArrowRight'] || keys['KeyD']) { player.x += player.speed; moviendose = true; }
   
       if (moviendose) {
           if (sonidos.pasos.paused) sonidos.pasos.play().catch(()=>{});
       } else {
           sonidos.pasos.pause();
       }
   
       player.x = Math.max(20, Math.min(BASE_WIDTH - 20, player.x));
       player.y = Math.max(20, Math.min(BASE_HEIGHT - 20, player.y));
       verificarEntradaNivel();
   }
   
   function verificarEntradaNivel() {
       if (estaEnNivel || gamePaused) return;
   
       const d1 = Math.sqrt((player.x - PUNTOS_ENTRADA.zona1.x)**2 + (player.y - PUNTOS_ENTRADA.zona1.y)**2);
       const d2 = Math.sqrt((player.x - PUNTOS_ENTRADA.zona2.x)**2 + (player.y - PUNTOS_ENTRADA.zona2.y)**2);
       const d3 = Math.sqrt((player.x - PUNTOS_ENTRADA.zona3.x)**2 + (player.y - PUNTOS_ENTRADA.zona3.y)**2);
       const dT = Math.sqrt((player.x - PUNTOS_ENTRADA.tesoro.x)**2 + (player.y - PUNTOS_ENTRADA.tesoro.y)**2);
   
       if (d1 < PUNTOS_ENTRADA.zona1.radio) {
           if (zonasCompletadas === 0) entrarANivel(iniciarZona1);
           else if (zonasCompletadas > 0) mostrarAvisoBloqueo("¡Esta gema ya la tienes!");
       } 
       else if (d2 < PUNTOS_ENTRADA.zona2.radio) {
           if (zonasCompletadas === 1) entrarANivel(iniciarZona2);
           else if (zonasCompletadas < 1) mostrarAvisoBloqueo("¡Bloqueado! Ve a la Zona 1");
       } 
       else if (d3 < PUNTOS_ENTRADA.zona3.radio) {
           if (zonasCompletadas === 2) entrarANivel(iniciarZona3);
           else if (zonasCompletadas < 2) mostrarAvisoBloqueo("¡Bloqueado! Completa la Zona 2");
       } 
       else if (dT < PUNTOS_ENTRADA.tesoro.radio) {
           if (zonasCompletadas >= 3) mostrarCofreFinal();
           else mostrarAvisoBloqueo("¡Reúne las 3 gemas primero!");
       }
   }
   
   function mostrarAvisoBloqueo(msj) {
       if (sonidos.error.paused) {
           sonidos.error.play().catch(()=>{});
           console.log(msj);
       }
   }
   
   function entrarANivel(funcionNivel) {
       estaEnNivel = true;
       sonidos.intro.pause();
       sonidos.pasos.pause();
       Object.keys(keys).forEach(k => keys[k] = false);
       funcionNivel(finalizarNivel);
   }
   
   function finalizarNivel(puntosObtenidos = 0) {
    estaEnNivel = false;
    puntosTotales += puntosObtenidos;
    zonasCompletadas++; 
    document.getElementById('gem-count').innerText = puntosTotales;
    vincularControlesTactiles();
    sonidos.victoria.play().catch(()=>{});
    setTimeout(() => { 
        if(!estaEnNivel && !gamePaused) sonidos.intro.play().catch(()=>{}); 
    }, 1000);
    player.x += 40; player.y += 40;
}
   
   function draw() {
       ctx.clearRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
       if (mapImg.complete) ctx.drawImage(mapImg, 0, 0, BASE_WIDTH, BASE_HEIGHT);
       
       function dibujarIndicador(punto, emoji, estado) {
           ctx.save();
           ctx.shadowBlur = 15;
           ctx.shadowColor = (estado === 1) ? punto.color : (estado === 2 ? "lime" : "gray");
           ctx.font = "35px Arial";
           ctx.textAlign = "center";
           ctx.textBaseline = "middle";
           let icono = (estado === 1) ? emoji : (estado === 2 ? "✅" : "🔒");
           ctx.fillText(icono, punto.x, punto.y);
           ctx.restore();
       }
   
       dibujarIndicador(PUNTOS_ENTRADA.zona1, "💎", zonasCompletadas === 0 ? 1 : 2);
       dibujarIndicador(PUNTOS_ENTRADA.zona2, "💎", zonasCompletadas < 1 ? 0 : (zonasCompletadas === 1 ? 1 : 2));
       dibujarIndicador(PUNTOS_ENTRADA.zona3, "💎", zonasCompletadas < 2 ? 0 : (zonasCompletadas === 2 ? 1 : 2));
       dibujarIndicador(PUNTOS_ENTRADA.tesoro, "👑", zonasCompletadas < 3 ? 0 : 1);
   
       if (playerImg.complete) {
           ctx.drawImage(playerImg, player.x - (player.w/2), player.y - (player.h/2), player.w, player.h);
       }
   }
   
   function mostrarCofreFinal() {
    estaEnNivel = true;
    sonidos.pasos.pause();
    sonidos.intro.pause();
    sonidos.abrirCofre.play().catch(() => {});
    
    const finalScreen = document.getElementById('final-treasure-screen');
    const rewardImg = document.getElementById('treasure-chest-anim');
    const statsSummary = document.getElementById('stats-summary');
    
    // Limpiar textos de rangos anteriores
    const rankText = document.getElementById('final-rank-text');
    if(rankText) rankText.innerText = ""; 

    finalScreen.classList.remove('hidden');

    setTimeout(() => {
        // Inyectamos solo la imagen
        rewardImg.innerHTML = `
            <img src="src/imgs/general/L8-Montaña-y-niños H (002).png" 
                 alt="Encuentro con Dios" 
                 class="bounceIn">
        `;
        
        sonidos.victoria.play().catch(() => {});

        // Inyectamos el texto con el color correcto
        statsSummary.innerHTML = `
            <div style="text-align: center; font-family: var(--font-body); color: white;">
                <p style="font-size: 1.6rem; margin-bottom: 8px;">
                    Has reunido <span style="font-weight:bold; color:var(--accent-gold);">${puntosTotales} puntos </span>
                </p>
                <p style="font-size: 1.1rem; font-style: italic; opacity: 0.9;">
                    ¡Felicidades! Has tenido un encuentro con Dios en la montaña.
                </p>
            </div>
        `;
    }, 800);

    document.getElementById('btn-restart').onclick = () => location.reload();
}
   
   initUI();