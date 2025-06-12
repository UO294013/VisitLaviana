class Juego {

    // Constructor de la clase Juego. Crea la estructura de los elementos del test
    constructor() {
        this.preguntas = this.cargarPreguntas();
        this.mezclarPreguntas();
        this.aciertos = 0;
        this.index = 0;
        this.audioContext = null;
        this.gainNode = null;
        this.section = document.querySelector('main section');
        this.mostrarPregunta();
    }

    // Función para cargar y reproducir un sonido cuando se acierta o se falla una pregunta, o al finalizar el test
    sonido(url) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = 0.1;
        this.gainNode.connect(this.audioContext.destination);
        fetch(url)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer))
            .then(audioBuffer => {
                const soundSource = this.audioContext.createBufferSource();
                soundSource.buffer = audioBuffer;
                soundSource.connect(this.gainNode);
                soundSource.start();
            })
            .catch();
    }

    // Función que crea y devuelve un JSON con las preguntas del test, las opciones, y la respuesta correcta
    cargarPreguntas() {
        return [
            {
                "pregunta": "¿Cuál es el nombre del famoso festival de la cerveza artesana desarrollado en el mes de julio en el concejo de Laviana?",
                "opciones": ["Tolivia Fest", "Beer fest", "Feria de la cerveza", "Feria artesanal cervecera", "Laviana Beer Festival"],
                "respuestaCorrecta": "Tolivia Fest"
            },
            {
                "pregunta": "¿Cuál es la capital del concejo de Laviana?",
                "opciones": ["Pola de Laviana", "Barredos", "Villoria", "Boroñes", "Lorío"],
                "respuestaCorrecta": "Pola de Laviana"
            },
            {
                "pregunta": "Es el nombre de un delicioso postre típico asturiano, con relleno de frutos secos y que puede ser horneado o frito:",
                "opciones": ["Casadielles", "Panchón", "Marañuelas", "Borrachinos", "Moscovitas"],
                "respuestaCorrecta": "Casadielles"
            },
            {
                "pregunta": "¿Qué gran edificio de Pola de Laviana se encuentra actualmente abandonado tras su cierre en 1998?",
                "opciones": ["Gran Teatro Maxi", "Armería Trelles", "Centro Veterinario Alto Nalón", "CIDAN", "Colegio Privado María Inmaculada"],
                "respuestaCorrecta": "Gran Teatro Maxi"
            },
            {
                "pregunta": "Es el nombre de uno de los ríos que atraviesa el concejo de Laviana. Afluente del Río Nalón, también da nombre a una ruta de senderismo:",
                "opciones": ["Río Raigoso", "Río Soto", "Río Cabáu", "Río Cañaines", "Río Villoria"],
                "respuestaCorrecta": "Río Raigoso"
            },
            {
                "pregunta": "¿De qué cría de animal es la carne que se utiliza para elaborar uno de los platos más representativos del concejo de Laviana?",
                "opciones": ["Cabrito (Cabra)", "Lechón (Cerdo)", "Ternero (Vaca)", "Jabato (Jabalí)", "Pollino (Burro)"],
                "respuestaCorrecta": "Cabrito (Cabra)"
            },
            {
                "pregunta": "Es una de las muchas rutas que puedes realizar en el concejo de Laviana:",
                "opciones": ["Ruta Senda Verde", "Ruta Senda Rosa", "Ruta Senda Naranja", "Ruta Senda Negra", "Ruta Senda Azul"],
                "respuestaCorrecta": "Ruta Senda Verde"
            },
            {
                "pregunta": "Además de ser el nombre en plural de un cargo de administración política, es también el nombre de un plato típico de Laviana que consiste en piezas de bacalao rebozado y frito:",
                "opciones": ["Concejales", "Presidentes", "Ministros", "Consejeros", "Regidores"],
                "respuestaCorrecta": "Concejales"
            },
            {
                "pregunta": "¿Cuál de los siguientes 'picos' (cimas de los montes) asturianos se encuentra en el concejo de Laviana?",
                "opciones": ["Pico La Vara", "Pico Cuchu", "Pico Cuyargayos", "Pico Cotiellos", "Pico Cadaval"],
                "respuestaCorrecta": "Pico La Vara"
            },
            {
                "pregunta": "¿Qué festejo declarado Fiesta de Interés Turístico Nacional sirve como inspiración para la creación de las tostas del concurso celebrado a finales de mayo en Laviana?",
                "opciones": ["Descenso Folklórico del Nalón", "Festival de la Sidra Natural", "Rally Princesa de Asturias", "Fiesta del Asturcón", "Descenso a nado de la Ría de Navia"],
                "respuestaCorrecta": "Descenso Folklórico del Nalón"
            }
        ];

    }

    // Función que muestra las preguntas una a una hasta completar el test
    mostrarPregunta() {
        if (this.index >= this.preguntas.length) {
            return this.mostrarResultados();
        }

        const { pregunta, opciones, respuestaCorrecta } = this.preguntas[this.index];

        // Vaciar sección (excepto título)
        const h2 = this.section.querySelector('h2');
        while (this.section.firstChild) {
            this.section.removeChild(this.section.firstChild);
        }
        this.section.appendChild(h2);

        const feedback = document.querySelector('main>section:nth-child(1)~p');
        if (feedback) {
            document.querySelector("main").removeChild(feedback);
        }

        const p = document.createElement('p');
        p.textContent = `Pregunta ${this.index + 1}: ${pregunta}`;
        this.section.appendChild(p);

        opciones.forEach(opcion => {
            const boton = document.createElement('button');
            boton.textContent = opcion;
            boton.addEventListener('click', () => {
                this.validarRespuesta(opcion, respuestaCorrecta);
            });
            this.section.appendChild(boton);
        });
    }

    // Función para barajar el orden de las preguntas y sus respuestas
    mezclarPreguntas() {
        for (let i = this.preguntas.length - 1; i >= 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.preguntas[i], this.preguntas[j]] = [this.preguntas[j], this.preguntas[i]];
            for (let k = 0; k < this.preguntas[i].opciones.length; k++) {
                const l = Math.floor(Math.random() * (k + 1));
                [this.preguntas[i].opciones[k], this.preguntas[i].opciones[l]] = [this.preguntas[i].opciones[l], this.preguntas[i].opciones[k]];
            }
        }
    }

    // Función para validar la respuesta seleccionada por el usuario. Deshabilita los botones de respuesta y muestra un mensaje de acierto o error
    validarRespuesta(seleccionada, correcta) {
        const botones = this.section.querySelectorAll('button');
        botones.forEach(boton => boton.disabled = true);
        const p = document.createElement('p');
        if (seleccionada === correcta) {
            this.aciertos++;
            this.sonido('multimedia/audios/correcto.mp3');
            p.textContent = `¡Respuesta correcta! Has acumulado ${this.aciertos} aciertos.`;
        } else {
            this.sonido('multimedia/audios/incorrecto.mp3');
            p.textContent = `Respuesta incorrecta. La respuesta correcta era: ${correcta}. Has acumulado ${this.aciertos} aciertos.`;
        }
        document.querySelector("main").appendChild(p);
        this.index++;
        setTimeout(() => this.mostrarPregunta(), 3000);
    }

    // Función para mostrar el resultado una vez finalizado el test
    mostrarResultados() {
        const h2 = this.section.querySelector('h2');
        while (this.section.firstChild) {
            this.section.removeChild(this.section.firstChild);
        }
        this.section.appendChild(h2);
        const feedback = document.querySelector('main>section:nth-child(1)~p');
        if (feedback) {
            document.querySelector("main").removeChild(feedback);
        }
        // Recuperación del párrafo de bienvenida y botón para comenzar el juego
        this.section.appendChild(document.createElement('p')).textContent = "¡Bienvenido a la página de juego! Aquí podrás poner a prueba lo que has aprendido navegando por el sitio acerca del concejo de Laviana. El juego consiste en responder a una serie de preguntas tipo test. Cada pregunta tiene cinco opciones, de las cuales solo una es correcta. Cada acierto sumará un punto, los fallos no restarán. ¿Conseguirás obtener la máxima puntuación? ¡Vamos a comprobarlo!";
        this.section.appendChild(document.createElement('button')).textContent = "Empezar el test";
        this.section.querySelector('button').onclick = () => this.mostrarPregunta();
        
        const resultado = document.createElement('dialog');
        resultado.textContent = `¡Has completado el test! Tu puntuación es de ${this.aciertos} sobre 10. Gracias por participar.`;
        resultado.appendChild(document.createElement('button')).textContent = "Cerrar";
        resultado.querySelector('button').onclick = () => resultado.close();
        this.section.appendChild(resultado);
        this.sonido('multimedia/audios/victoria.mp3');
        resultado.showModal();
    }
}

// El juego comienza al hacer clic en el botón correspondiente
const boton = document.querySelector("main section button");

boton.onclick = () => {
    var juego = new Juego();
};