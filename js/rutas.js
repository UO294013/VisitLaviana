class Rutas {

    // Constructor de la clase Rutas. Inicializa los eventos de los file choosers que permiten la carga de archivos XML, KML y SVG
    constructor() {
        this.rutaActual = null;
        this.hitosActuales = [];
        this.rutasXML = [];
        this.contenedor = document.querySelector("main>section:nth-of-type(1)");

        document.addEventListener("DOMContentLoaded", () => {
            const archivoInputXML = document.querySelector("input[type='file'][accept='.xml']");
            archivoInputXML.addEventListener("change", e => {
                this.leerArchivoXML(e);
            });
            const archivoInputKML = document.querySelector("input[type='file'][accept='.kml']");
            archivoInputKML.addEventListener("change", e => {
                this.procesarKML(e);
            });
            const archivoInputSVG = document.querySelector("input[type='file'][accept='.svg']");
            archivoInputSVG.addEventListener("change", e => {
                this.procesarSVG(e);
            });
        });
    }

    // --- Carga de archivos XML ---

    // Función para leer el archivo XML
    leerArchivoXML(event) {
        const archivo = event.target.files[0];
        const areaTexto = document.querySelector("main>section:nth-of-type(1)");
        areaTexto.innerText = "";
        const errorLectura = document.querySelector("main>p:nth-of-type(1)");
        errorLectura.innerText = "";

        if (archivo && archivo.type === "text/xml") {
            const lector = new FileReader();
            lector.onload = e => {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(e.target.result, "application/xml");
                
                if (xmlDoc.documentElement.nodeName === "parsererror") {
                    errorLectura.innerText = "Error: Archivo XML no válido.";
                    return;
                }

                this.procesarXML(xmlDoc) || "No se encontró información relevante en el archivo XML.";
            };
            lector.readAsText(archivo);
        } else {
            errorLectura.innerText = "Error: ¡El archivo no es válido! Por favor, selecciona un archivo XML.";
        }
    }

    // Función para extraer y procesar los datos del XML
    procesarXML(xmlDoc) {
        this.contenedor.innerHTML = "";
        this.rutasXML = Array.from(xmlDoc.querySelectorAll("ruta"));

        if (this.rutasXML.length === 0) {
            this.contenedor.textContent = "No se encontró ninguna <ruta> en el XML.";
            return;
        }

        const titulo = document.createElement("h3");
        titulo.textContent = "Selecciona una ruta para ver sus datos:";
        this.contenedor.appendChild(titulo);

        const fs = document.createElement("fieldset");
        const legend = document.createElement("legend");
        legend.textContent = "Selecciona una ruta:";
        fs.appendChild(legend);

        this.rutasXML.forEach((ruta, i) => {
            const nombre = ruta.getAttribute("nombre");

            const input = document.createElement("input");
            input.type = "radio";
            input.name = "rutaSel";
            input.value = i;
            input.id = `ruta_${i}`;
            input.addEventListener('change', () => this.renderizarRuta(i));
            
            const label = document.createElement("label");
            label.htmlFor = input.id;
            label.textContent = nombre;

            label.appendChild(input);
            fs.appendChild(label);
        });

        this.contenedor.appendChild(fs);

        // Por defecto, la primera ruta será seleccionada
        fs.querySelector("input").checked = true;
        this.renderizarRuta(0);
    }

    // Función que renderiza la ruta seleccionada en el grupo de botones
    renderizarRuta(index) {
        const fs = this.contenedor.querySelector("fieldset");
        // Limpieza del contenido previo de la sección
        var nodo = fs.nextSibling;
        while (nodo) {
            const siguiente = nodo.nextSibling;
            this.contenedor.removeChild(nodo);
            nodo = siguiente;
        }

        const ruta = this.rutasXML[index];

        // Extracción de los atributos simples del nodo <ruta>
        const nombre = ruta.getAttribute("nombre");
        const tipo_ruta = ruta.getAttribute("tipo_ruta");
        const medio_transporte = ruta.getAttribute("medio_transporte");
        const duracion = ruta.getAttribute("duracion");
        const nivel_recomendacion = ruta.getAttribute("nivel_recomendacion");

        // Extracción de los nodos simples hijos del nodo <ruta>
        const fecha_inicio = ruta.querySelector("fecha_inicio")?.textContent;
        const hora_inicio = ruta.querySelector("hora_inicio")?.textContent;
        const agencia = ruta.querySelector("agencia")?.textContent;
        const descripcion = ruta.querySelector("descripcion")?.textContent;
        const personas_recomendadas = ruta.querySelector("personas_recomendadas")?.textContent;
        const lugar_inicio = ruta.querySelector("lugar_inicio")?.textContent;
        const direccion_inicio = ruta.querySelector("direccion_inicio")?.textContent;
            
        // Incorporación los elementos del XML al HTML;
        if (nombre) {
            this.generarEtiqueta(this.contenedor, "Nombre de la ruta", nombre);
        }
        if (tipo_ruta) {
            this.generarEtiqueta(this.contenedor, "Tipo de ruta", tipo_ruta);
        }
        if (medio_transporte) {
            this.generarEtiqueta(this.contenedor, "Medio de desarrollo de la ruta", medio_transporte);
        }
        if (duracion) {
            this.generarEtiqueta(this.contenedor, "Duración aproximada", duracion);
        }
        if (nivel_recomendacion) {
            this.generarEtiqueta(this.contenedor, "Nivel de recomendación (0-10)", nivel_recomendacion);
        }
        if (fecha_inicio) {
            this.generarEtiqueta(this.contenedor, "Fecha de inicio", fecha_inicio);
        }
        if (hora_inicio) {
            this.generarEtiqueta(this.contenedor, "Hora de inicio", hora_inicio);
        }
        if (agencia) {
            this.generarEtiqueta(this.contenedor, "Agencia", agencia);
        }
        if (descripcion) {
            this.generarEtiqueta(this.contenedor, "Descripción", descripcion);
        }
        if (personas_recomendadas) {
            this.generarEtiqueta(this.contenedor, "Personas recomendadas para hacer la ruta", personas_recomendadas);
        }
        if (lugar_inicio) {
            this.generarEtiqueta(this.contenedor, "Lugar de inicio", lugar_inicio);
        }
        if (direccion_inicio) {
            this.generarEtiqueta(this.contenedor, "Dirección de inicio", direccion_inicio);
        }

        // Procesamiento de las coordenadas de inicio (nodo complejo hijo de <ruta>)
        const coordenadas_inicio = ruta.querySelector("coordenadas_inicio>coordenada");
        if (coordenadas_inicio) {
            const lng = coordenadas_inicio.getAttribute("longitud");
            const lat = coordenadas_inicio.getAttribute("latitud");
            const alt = coordenadas_inicio.getAttribute("altitud");
            this.generarEtiqueta(this.contenedor, "Coordenadas de inicio", `{ Longitud: ${lng}, Latitud: ${lat}, Altitud: ${alt} metros }`);
        }

        // Nodo <referencias> y sus hijos <referencia>
        this.generarEtiqueta(this.contenedor, "Referencias", "");
        const referencias = document.createElement("ul");
        const refs = ruta.querySelectorAll("referencias>referencia");
        refs.forEach(referencia => {
            const li = document.createElement("li");
            const ref = document.createElement("a");
            ref.href = referencia.textContent.trim();
            ref.textContent = referencia.textContent.trim();
            li.appendChild(ref);
            referencias.appendChild(li);
        });
        this.contenedor.appendChild(referencias);

        // Procesamiento de los hitos
        this.generarEtiqueta(this.contenedor, "Hitos (puntos de interés en la ruta)", "");
        const hitos = document.createElement("ul");
        const hitosList = ruta.querySelectorAll("hitos hito");
        hitosList.forEach(hito => {
            const li = document.createElement("li");
            const article = document.createElement("article");

            const nombre_hito = hito.getAttribute("nombre_hito");
            if (nombre_hito) {
                const h4 = document.createElement("h4");
                h4.textContent = nombre_hito;
                article.appendChild(h4);
            }

            const descripcion_hito = hito.querySelector("descripcion_hito")?.textContent?.trim();
            if (descripcion_hito) {
                this.generarEtiqueta(article, "Descripción del hito", descripcion_hito);
            }

            const coordenadas_hito = hito.querySelector("coordenadas_hito>coordenada");
            if (coordenadas_hito) {
                const lng = coordenadas_hito.getAttribute("longitud");
                const lat = coordenadas_hito.getAttribute("latitud");
                const alt = coordenadas_hito.getAttribute("altitud");
                this.generarEtiqueta(article, "Coordenadas del hito", `{ Longitud: ${lng}, Latitud: ${lat}, Altitud: ${alt} metros }`);
            }

            const distancia = hito.querySelector("distancia");
            if (distancia) {
                const valor = distancia.textContent.trim();
                const unidad = distancia.getAttribute("unidad");
                this.generarEtiqueta(article, "Distancia del hito anterior", `${valor} ${unidad}`);
            }

            // Procesamiento de las fotos del hito
            const pFotos = document.createElement("p");
            pFotos.textContent = "Imágenes: ";
            const fotos = hito.querySelectorAll("fotos_hito foto");

            if (fotos.length > 0) {
                article.appendChild(pFotos);
                fotos.forEach(foto => {
                    const img = document.createElement("img");
                    img.src = `./${foto.textContent.trim()}`;
                    img.alt = `Foto de la ruta ${nombre || "desconocida"}`;
                    article.appendChild(img);
                });
            }

            // Procesamiento de los videos del hito
            const pVideo = document.createElement("p");
            pVideo.textContent = "Videos: ";
            const videos = hito.querySelectorAll("videos_hito video");

            if (videos.length > 0) {
                article.appendChild(pVideo);
                videos.forEach(video => {
                    const vid = document.createElement("video");
                    vid.src = `./${video.textContent.trim()}`;
                    vid.controls = true;
                    article.appendChild(vid);
                });
            }

            li.appendChild(article);
            hitos.appendChild(li);
        });

        this.contenedor.appendChild(hitos);
    }

    // Función auxiliar para generar etiquetas de información en la carga de archivos XML
    generarEtiqueta(section, nombre, valor) {
        const p = document.createElement("p");
        p.textContent = `${nombre}: ${valor}`;
        section.appendChild(p);
    }

    // --- Carga de archivos KML ---

    // Inicialización del mapa para el KML
    initMap() {
        // Coordenadas centradas aproximadamente en el concejo de Laviana
        const coordenadas = { lat: 43.247127, lng: -5.563776 };
        this.mapa = new google.maps.Map(document.querySelector("div"), {
            zoom: 12,
            center: coordenadas
        });
    }

    // Función para manejar el archivo KML
    procesarKML(event) {
        const file = event.target.files[0];
        if (!file) {
            return;
        }
        const reader = new FileReader();
        reader.onload = e => {
            const kmlText = e.target.result;
            this.parseKML(kmlText);
        };
        reader.readAsText(file);
    }

    // Función para parsear el contenido del archivo KML
    parseKML(kmlText) {
        this.clearRoute();

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(kmlText, "application/xml");
        const ns = "http://www.opengis.net/kml/2.2";

        const trazaRuta = xmlDoc.getElementsByTagNameNS(ns, 'LineString')[0];
        if (!trazaRuta) {
            console.error('No se encontró ninguna traza de ruta (<LineString>) en el KML');
            return;
        }

        const coordsNode = trazaRuta.getElementsByTagNameNS(ns, 'coordinates')[0];
        if (!coordsNode) {
            console.error('Traza de ruta (<LineString>) sin coordenadas (<coordinates>)');
            return;
        }

        const coordArray = coordsNode.textContent.trim().split(/\s+/);
        const ruta = coordArray.map(coordenada => {
            const [lngStr, latStr] = coordenada.split(',');
            const lat = parseFloat(latStr);
            const lng = parseFloat(lngStr);
            return (!isNaN(lat) && !isNaN(lng)) ? { lat, lng } : null;
        }).filter(pt => pt);

        this.pintarRuta(ruta);

        const hitos = Array.from(xmlDoc.getElementsByTagNameNS(ns, 'Placemark'));
        hitos.forEach(hito => {
            const pointNode = hito.getElementsByTagNameNS(ns, 'Point')[0];
            const nameNode  = hito.getElementsByTagNameNS(ns, 'name')[0];
            if (pointNode && nameNode) {
                const coords = pointNode.getElementsByTagNameNS(ns, 'coordinates')[0]
                    .textContent.trim()
                    .split(','); // ["lng","lat","0"]
                const lat = parseFloat(coords[1]);
                const lng = parseFloat(coords[0]);
                const title = nameNode.textContent.trim();
                if (!isNaN(lat) && !isNaN(lng)) {
                    const marker = new google.maps.Marker({
                        map: this.mapa,
                        position: { lat, lng },
                        title
                    });
                    this.hitosActuales.push(marker);
                }
            }
        });
    }

    // Función para dibujar la polyline en el mapa (unir los puntos del KML)
    pintarRuta(coordenadas) {
        const polyline = new google.maps.Polyline({
            path: coordenadas,
            geodesic: true,
            strokeColor: "#ff0000",
            strokeOpacity: 1.0,
            strokeWeight: 3,
            map: this.mapa
        });
        this.rutaActual = polyline;

        const bordes = new google.maps.LatLngBounds();
        coordenadas.forEach(coordenada => bordes.extend(coordenada));
        this.mapa.fitBounds(bordes);

        coordenadas.forEach(coordenada => {
            const marker = new google.maps.Marker({
                position: coordenada,
                map: this.mapa
            });
            this.hitosActuales.push(marker);
        });

        const p = document.querySelector("main>input[type='file'][accept='.kml']~p");
        if (p) p.remove();
    }

    // Función auxiliar para limpiar la ruta actual del mapa
    clearRoute() {
        if (this.rutaActual) {
            this.rutaActual.setMap(null);
            this.rutaActual = null;
        }
        this.hitosActuales.forEach(hito => hito.setMap(null));
        this.hitosActuales = [];
    }

    // --- Carga de archivos SVG ---

    // Procesamiento del archivo SVG
    procesarSVG(e) {
        const file = e.target.files[0];
        if (file && file.type === "image/svg+xml") {
            const svg = document.querySelector("main>svg:nth-of-type(1)");
            if (svg) svg.remove(); // Elimina el SVG previo si existe
            const reader = new FileReader();
            reader.onload = event => {
                const main = document.querySelector("main");
                const contenido = event.target.result;
                const parser = new DOMParser();
                const svgDoc = parser.parseFromString(contenido, "image/svg+xml");
                const svgElement = svgDoc.documentElement;
                const viewBox = svgElement.getAttribute("viewBox");
                if (!viewBox) {
                    const width = svgElement.getAttribute("width");
                    const height = svgElement.getAttribute("height");
                    svgElement.setAttribute("viewBox", `0 0 ${width} ${height}`); /* Este atributo es necesario para redimensionar el SVG */
                }
                main.appendChild(svgElement);
            };
            reader.readAsText(file);
            const p = document.querySelector("main>input[type='file'][accept='.svg']~p");
            if (p) p.remove();
        } else {
            const errorLectura = document.querySelector("main>p:nth-of-type(3)");
            errorLectura.innerText = "Error: ¡El archivo no es válido! Por favor, selecciona un archivo SVG.";
        }
    }
}

window.initMap = Rutas.prototype.initMap;
var rutas = new Rutas();
window.initMap = rutas.initMap.bind(rutas);
