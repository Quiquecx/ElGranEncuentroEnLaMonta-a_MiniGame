/* src/data/preguntas.js */

// --- ZONA 1: EL VALLE DEL DESCUBRIMIENTO (Sacramentos) ---
// Mecánica: Emparejar símbolos con nombres 

export const zona1Data = [
    { 
        id: 1, 
        img: 'src/imgs/sacramentos/L8-Sacramentos_05.png', 
        nombre: 'Bautismo', 
        mensaje: '¡Splash! La vida nueva comienza con el signo del agua.' 
    },
    { 
        id: 2, 
        img: 'src/imgs/sacramentos/L8 Niños con armadura.png', 
        nombre: 'Confirmación', 
        mensaje: 'Fortalece tu corazón con la unción del Espíritu.' 
    },
    { 
        id: 3, 
        img: 'src/imgs/sacramentos/Reconciliacion.png', 
        nombre: 'Reconciliación', 
        mensaje: 'Siente la alegría del perdón.' 
    },
    { 
        id: 4, 
        img: 'src/imgs/sacramentos/L8 Jesús niño.png', 
        nombre: 'Eucaristía', 
        mensaje: 'Pan de Vida para alimentar tu camino hacia el cielo.' 
    },
    { 
        id: 5, 
        img: 'src/imgs/sacramentos/L8Niños y sacerdote atendiendo anciano.png', 
        nombre: 'Unción de los enfermos', 
        mensaje: 'Una caricia de Dios para darnos consuelo y fortaleza.' 
    },
    { 
        id: 6, 
        img: 'src/imgs/sacramentos/L8 Sacerdote.png', 
        nombre: 'Orden Sacerdotal', 
        mensaje: 'Llamados a servir y guiar a la familia de Dios.' 
    },
    { 
        id: 7, 
        img: 'src/imgs/sacramentos/Matrimonio.png', 
        nombre: 'Matrimonio', 
        mensaje: 'Dos vidas que se unen en una promesa de amor eterno.' 
    }
];

// --- ZONA 2: EL SENDERO DEL ESPÍRITU ---
// Mecánica: Ordenar frases y dilemas éticos 
export const zona2Data = [
    {
        id: "z2-r1",
        tipo: "ordenar",
        instruccion: "Ordena la frase sobre el profeta:",
        palabras: ["Elías", "fue", "un", "profeta", "amigo", "de", "Dios"],
        solucion: "Elías fue un profeta amigo de Dios"
    },
    {
        id: "z2-r2",
        tipo: "ordenar",
        instruccion: "La voz de Dios es...",
        palabras: ["La voz de Dios es", "como", "un", "murmullo", "en", "nuestro", "interior"],
        solucion: "La voz de Dios es como un murmullo en nuestro interior"
    },
    {
        id: "z2-r3",
        tipo: "trivia",
        pregunta: "El Padre Nuestro contiene un código que:",
        opciones: [
            { texto: "Nos da siete secretos para comunicarnos con Dios.", pts: 0 },
            { texto: "Nos enseña a orar al Padre", pts: 1 },
            { texto: "Contiene siete peticiones que nos invitan a orar a nuestro Padre", pts: 2 }
        ]
    },
    {
        id: "z2-r4",
        tipo: "trivia",
        pregunta: "Cuando oramos:",
        opciones: [
            { texto: "Jesús está en medio de nosotros y nos escucha desde el corazón", pts: 2 },
            { texto: "Si es con amor Jesús está presente", pts: 1 },
            { texto: "Jesús recibe tus oraciones", pts: 1 }
        ]
    },
    {
        id: "z2-r5",
        tipo: "decision",
        pregunta: "En el recreo, Sofía tiene libertad para decidir qué hacer:",
        opciones: [
            { texto: "Jugar fútbol con sus amigos, como siempre.", pts: 1 },
            { texto: "Acompañar a Mariana, una compañera nueva que está sola.", pts: 2 }
        ],
        feedback: "La libertad implica pensar en los demás y elegir lo justo."
    },
    {
        id: "z2-r6",
        tipo: "decision",
        pregunta: "¿Qué valor es más importante en este momento?",
        opciones: [
            { texto: "La diversión personal", pts: 1 },
            { texto: "La solidaridad con los demás", pts: 2 }
        ]
    },
    {
        id: "z2-r7",
        tipo: "decision",
        pregunta: "¿Si estuvieras en la situación de Sofía, qué harías?",
        opciones: [
            { texto: "Elegiría mi diversión personal", pts: 1 },
            { texto: "Elegiría la solidaridad", pts: 2 }
        ]
    },
    {
        id: "z2-r8",
        tipo: "trivia",
        pregunta: "Elige los hábitos buenos que practicas:",
        opciones: [
            { texto: "Humildad y caridad", pts: 2 },
            { texto: "Paciencia y pereza", pts: 1 },
            { texto: "Envidia y orgullo", pts: 0 }
        ]
    },
    {
        id: "z2-r9",
        tipo: "ordenar",
        instruccion: "Ordena la frase del Youcat 395:",
        palabras: ["La", "paz", "nace", "cuando", "hay", "justicia"],
        solucion: "La paz nace cuando hay justicia"
    }
];

// --- ZONA 3: LA CUMBRE DEL GUARDIÁN ---
// Mecánica: Test de conciencia (Suma de puntos) 
export const zona3Data = [
    {
        n: 1,
        img: 'src/imgs/imgsZona3/1.png', // Imagen cargada
        mandamiento: "Amarás a Dios sobre todas las cosas",
        situacion: "Tu familia quiere rezar antes de comer, pero tú prefieres seguir jugando.",
        opciones: [
            { texto: "Apagas el juego y rezas.", pts: 2 },
            { texto: "Rezamos rápido para volver al juego.", pts: 1 },
            { texto: "Sigues jugando.", pts: 0 }
        ]
    },
    {
        n: 2,
        img: 'src/imgs/imgsZona3/2.png',
        mandamiento: "No tomarás el nombre de Dios en vano",
        situacion: "Tus amigos dicen groserías con el nombre de Dios.",
        opciones: [
            { texto: "Dices que no te gusta.", pts: 2 },
            { texto: "Guardas silencio.", pts: 1 },
            { texto: "Lo repites.", pts: 0 }
        ]
    },
    {
        n: 3,
        img: 'src/imgs/imgsZona3/3.png',
        mandamiento: "Santificarás las fiestas",
        situacion: "El domingo hay misa y un partido de fútbol.",
        opciones: [
            { texto: "Vas a misa.", pts: 1 },
            { texto: "Cumples con misa y después vas al partido.", pts: 2 },
            { texto: "Vas al partido.", pts: 0 }
        ]
    },
    {
        n: 4,
        img: 'src/imgs/imgsZona3/4.png',
        mandamiento: "Honrarás a tu padre y a tu madre",
        situacion: "Estas viendo TV, y piden tu ayuda para poner la mesa.",
        opciones: [
            { texto: "Ayudas de inmediato.", pts: 2 },
            { texto: "Terminas de ver TV y después ayudas.", pts: 1 },
            { texto: "Ignoras y sigues viendo TV.", pts: 0 }
        ]
    },
    {
        n: 5,
        img: 'src/imgs/imgsZona3/5.png',
        mandamiento: "No matarás",
        situacion: "Un compañero recibe burlas en el recreo.",
        opciones: [
            { texto: "Lo defiendes.", pts: 2 },
            { texto: "Te alejas sin intervenir.", pts: 1 },
            { texto: "Te unes a las burlas.", pts: 0 }
        ]
    },
    {
        n: 6,
        img: 'src/imgs/imgsZona3/6.png',
        mandamiento: "No cometerás actos impuros",
        situacion: "Un amigo te quiere mostrar imágenes inapropiadas.",
        opciones: [
            { texto: "Dices que no y te alejas.", pts: 2 },
            { texto: "Le explicas que no son buenas.", pts: 1 },
            { texto: "Las ves por curiosidad.", pts: 0 }
        ]
    },
    {
        n: 7,
        img: 'src/imgs/imgsZona3/7.png',
        mandamiento: "No robarás",
        situacion: "Ves un borrador que te gusta en la papelería.",
        opciones: [
            { texto: "Pides que te lo compren otro día.", pts: 2 },
            { texto: "Ahorras para comprarlo.", pts: 1 },
            { texto: "Lo tomás sin pagar.", pts: 0 }
        ]
    },
    {
        n: 8,
        img: 'src/imgs/imgsZona3/8.png',
        mandamiento: "No mentirás",
        situacion: "Rompes un vaso y tus papás preguntan quién fue.",
        opciones: [
            { texto: "Decir la verdad.", pts: 2 },
            { texto: "Guardar silencio.", pts: 1 },
            { texto: "Culpar al hermano.", pts: 0 }
        ]
    },
    {
        n: 9,
        img: 'src/imgs/imgsZona3/9.png',
        mandamiento: "No consentirás pensamientos impuros",
        situacion: "En clase hacen chistes ofensivos sobre el cuerpo de alguien.",
        opciones: [
            { texto: "Dices que no es correcto.", pts: 2 },
            { texto: "Te quedas callado.", pts: 1 },
            { texto: "Te ríes y los repites.", pts: 0 }
        ]
    },
    {
        n: 10,
        img: 'src/imgs/imgsZona3/10.png',
        mandamiento: "No codiciarás los bienes ajenos",
        situacion: "Tu amigo tiene un videojuego o celular nuevo.",
        opciones: [
            { texto: "Lo felicitas y juegas con él.", pts: 2 },
            { texto: "Pides uno, y aceptas las condiciones.", pts: 1 },
            { texto: "Reclamas y te molestas.", pts: 0 }
        ]
    }
];

// Resultados finales basados en el puntaje acumulado
export const resultadosConciencia = {
    brillante: { msg: "¡Conciencia brillante! 🌟 Vives los Mandamientos con alegría." },
    crecimiento: { msg: "Conciencia en crecimiento 🌱 . A veces dudas, pero buscas el bien." },
    construccion: { msg: "Conciencia en construcción 🧩 . Necesitas reflexionar más y practicar." }
};