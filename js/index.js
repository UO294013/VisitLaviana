class Carrusel {

    // Constructor de la clase Carrusel. Genera el carrusel de imágenes de la página de inicio
    constructor() {
        this.fotos = this.obtenerFotos();
        this.renderizarCarrusel();
        this.cargarCarrusel();
    }

    // Función para obtener las fotos destinadas al carrusel de la carpeta multimedia>imágenes
    obtenerFotos() {
        return [
            "multimedia/imagenes/mapa_situacion.jpg",
            "multimedia/imagenes/cabañas.jpg",
            "multimedia/imagenes/paisaje.jpg",
            "multimedia/imagenes/pola.jpg",
            "multimedia/imagenes/bar.webp"
        ];
    }

    // Función para renderizar el carrusel de imágenes en la página
    renderizarCarrusel() {
        // Verificar si el carrusel ya fue renderizado para evitar duplicados
        if (document.querySelector('main>section:nth-of-type(1)')) return;

        // Crear la sección del carrusel y agregar las imágenes
        const section = document.createElement("section");
        const h3 = document.createElement("h3");
        h3.textContent = "¿Qué ver en Laviana?";
        section.appendChild(h3);
        this.fotos.forEach(foto => {
            const img = document.createElement("img");
            img.src = foto;
            img.alt = "Foto del carrusel de imágenes relacionada con el concejo de Laviana";
            section.appendChild(img);
        });
        const gt = document.createElement("button");
        gt.textContent = ">";
        section.appendChild(gt);
        const lt = document.createElement("button");
        lt.textContent = "<";
        section.appendChild(lt);
        document.querySelector("main").appendChild(section);
    }

    // Función para cargar las imágenes en el carrusel
    cargarCarrusel() {
        const slides = document.querySelectorAll("body>main:nth-child(2)>section:nth-of-type(1)>img");
        const siguiente = document.querySelector("body>main:nth-child(2)>section:nth-of-type(1) button:nth-of-type(1)");
        const anterior = document.querySelector("body>main:nth-child(2)>section:nth-of-type(1) button:nth-of-type(2)");
        
        let slideActual = 0;
        const slideFinal = slides.length - 1;

        // Posición inicial
        slides.forEach((slide, i) => {
            $(slide).css('transform', `translateX(${100 * i}%)`); /* NOTA: No se debe utilizar el atributo .css de JQuery excepto en el caso de las translaciones del carrusel (mismo criterio que en la evaluación ordinaria) */
        });

        const update = () => {
            slides.forEach((slide, i) => {
            $(slide).css('transform', `translateX(${100 * (i - slideActual)}%)`); /* NOTA: No se debe utilizar el atributo .css de JQuery excepto en el caso de las translaciones del carrusel (mismo criterio que en la evaluación ordinaria) */
            });
        };

        siguiente.addEventListener("click", () => {
            slideActual = slideActual === slideFinal ? 0 : slideActual + 1;
            update();
        });

        anterior.addEventListener("click", () => {
            slideActual = slideActual === 0 ? slideFinal : slideActual - 1;
            update();
        });
    }
}

class Noticias {

    // Constructor de la clase Noticias. Genera la sección dedicada a las noticias de la página de inicio
    constructor() {
        this.cargarNoticias();
    }

    // Función para cargar las noticias relativas al concejo. Consume servicios web de la API "NewsData.io"
    cargarNoticias() {
        // Verificar si la sección de noticias ya fue creada para evitar duplicados
        if (document.querySelector('main>section:nth-of-type(2)')) return;

        const noticiasSection = document.createElement('section');
        const h3 = document.createElement('h3');
        h3.textContent = 'Noticias del concejo de Laviana';
        noticiasSection.appendChild(h3);

        const lista = document.createElement('ul');
        noticiasSection.appendChild(lista);
        document.querySelector('main').appendChild(noticiasSection);

        // Servicio web: "NewsData.io" para obtener noticias relacionadas con Laviana o Asturias
        $.ajax({
            url: 'https://newsdata.io/api/1/news',
            method: 'GET',
            data: {
                apikey: 'pub_e44d0d6c952f4dff867601ea8e878277',
                q: 'Laviana',
                language: 'es',
                country: 'es'
            },
            success: res => {
                const items = res.results || [];
                if (items.length) {
                    items.forEach(article => {
                        const li = document.createElement('li');
                        const a  = document.createElement('a');
                        a.href = article.link || article.url;
                        a.title = article.title;
                        a.textContent = article.title;
                        const p  = document.createElement('p');
                        p.textContent = article.description || '';
                        li.appendChild(a);
                        li.appendChild(p);
                        lista.appendChild(li);
                    });
                } else {
                    lista.textContent = 'No se encontraron noticias.';
                }
            },
            error: () => {
                lista.textContent = 'Error al cargar noticias.';
            }
        });
    }
}

var carrusel = new Carrusel();
var noticias = new Noticias();
