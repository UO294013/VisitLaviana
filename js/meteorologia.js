class Meteorologia { 
    
    // Constructor de la clase Meteorologia. Inicializa la construcción del pronóstico del tiempo y la previsión atmosférica de los próximos 7 días
    constructor () {
        // Coordenadas del concejo de Laviana (concretamente, ayuntamiento de Pola de Laviana)
        this.coordenadas = {
            "latitud": 43.247127,
            "longitud": -5.563776
        };
        this.apiKey = "1003353b5af2c3f05e6116b9576d31b1";
        this.getMeteo();
        this.getPrevision();
    }

    // Método para obtener la meteorología en tiempo real en la capital del concejo de Laviana (Pola de Laviana)
    getMeteo() {
        const { latitud, longitud } = this.coordenadas;
        // API de OpenWeatherMap
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitud}&lon=${longitud}&appid=${this.apiKey}&units=metric&lang=es`;

        $.ajax({
            url,
            method: "GET",
            dataType: "json",
            success: data => {
                var descripcion = data.weather[0].description;
                descripcion = descripcion.charAt(0).toUpperCase() + descripcion.slice(1);
                const temperatura = data.main.temp.toFixed(1);
                const humedad = data.main.humidity;
                const precipitacion = data.rain ? data.rain['1h'] : 0; // Precipitación en la última hora, si existe
                const viento = data.wind.speed.toFixed(1);
                const vientoDireccion = data.wind.deg;
                const presion = data.main.pressure;
                const icono = data.weather[0].icon;
                const urlIcono = `https://openweathermap.org/img/wn/${icono}@2x.png`;
                
                const section = document.createElement("section");
                
                const h3 = document.createElement("h3");
                h3.textContent = "Tiempo actual";
                section.appendChild(h3);
                
                const article = document.createElement("article");
                
                const h4 = document.createElement("h4");
                h4.textContent = "Estado meteorológico en tiempo real en la capital del concejo (Pola de Laviana):";
                article.appendChild(h4);

                const pUltimaActualizacion = document.createElement("p");
                pUltimaActualizacion.textContent = `Última actualización: ${new Date(data.dt * 1000).toLocaleString()}`;
                article.appendChild(pUltimaActualizacion);

                const pClima = document.createElement("p");
                pClima.textContent = `Clima: ${descripcion}`;
                article.appendChild(pClima);

                const pTemperatura = document.createElement("p");
                pTemperatura.textContent = `Temperatura actual: ${temperatura} °C`;
                article.appendChild(pTemperatura);

                const pHumedad = document.createElement("p");
                pHumedad.textContent = `Humedad: ${humedad}%`;
                article.appendChild(pHumedad);

                const pPrecipitacion = document.createElement("p");
                pPrecipitacion.textContent = `Precipitación acumulada: ${precipitacion} mm`;
                article.appendChild(pPrecipitacion);

                const pViento = document.createElement("p");
                pViento.textContent = `Viento: ${viento} m/s, dirección ${vientoDireccion}º`;
                article.appendChild(pViento);

                const pPresion = document.createElement("p");
                pPresion.textContent = `Presión: ${presion} hPa`;
                article.appendChild(pPresion);

                const img = document.createElement("img");
                img.src = urlIcono;
                img.alt = `Icono meteorológico: ${descripcion}`;
                article.appendChild(img);

                section.appendChild(article);
                
                $("main").append(section);
            },
            error: error => {
                console.error("Error al cargar tiempo actual: ", error);
                $("main").append(`<p>No se pudo cargar el tiempo actual</p>`);
            }
        });
    }

    // Método para obtener la previsión atmosférica de los próximos 7 días en el concejo de Laviana (Más concretamente, en su capital, Pola de Laviana)
    getPrevision() {
        const { latitud, longitud } = this.coordenadas;
        // API de Open-Meteo
        const url = `https://api.open-meteo.com/v1/forecast?` +
                    `latitude=${latitud}&longitude=${longitud}` +
                    `&current_weather=false` +
                    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode` +
                    `&timezone=Europe/Madrid`;

        $.ajax({
            url,
            method: 'GET',
            dataType: 'json',
            success: data => {
                const pronosticos = data.daily.time.slice(0, 7);
                const tempMax = data.daily.temperature_2m_max;
                const tempMin = data.daily.temperature_2m_min;
                const precipitaciones = data.daily.precipitation_sum;
                const codigos = data.daily.weathercode;

                const section = document.createElement("section");

                const h3 = document.createElement("h3");
                h3.textContent = "Pronóstico semanal (Próximos 7 días en Pola de Laviana)";
                section.appendChild(h3);

                pronosticos.forEach((fecha, i) => {
                    const date = new Date(fecha);
                    let dia = date.toLocaleDateString('es-ES', { weekday:'long' });
                    dia = dia.charAt(0).toUpperCase() + dia.slice(1);
                    const mes = date.toLocaleDateString('es-ES',{ day: 'numeric', month: 'long' });
                    const fechaLegible = `${dia}, ${mes}`;
                    const descripcion = this.codigoATxt(codigos[i]);
                    const max = tempMax[i].toFixed(1);
                    const min = tempMin[i].toFixed(1);
                    const lluvia = precipitaciones[i].toFixed(1);
                    const codigo = data.daily.weathercode[i];
                    const codigoOWM = this.mapOpenMeteoToOWM(codigo);
                    const urlIcono = `https://openweathermap.org/img/wn/${codigoOWM}@2x.png`;

                    const article = document.createElement("article");

                    const h4 = document.createElement("h4");
                    h4.textContent = fechaLegible;
                    article.appendChild(h4);

                    const pDescripcion = document.createElement("p");
                    pDescripcion.textContent = `Previsión: ${descripcion}`;
                    article.appendChild(pDescripcion);

                    const pMax = document.createElement("p");
                    pMax.textContent = `Temperatura máxima: ${max} °C`;
                    article.appendChild(pMax);

                    const pMin = document.createElement("p");
                    pMin.textContent = `Temperatura mínima: ${min} °C`;
                    article.appendChild(pMin);

                    const pLluvia = document.createElement("p");
                    pLluvia.textContent = `Precipitación: ${lluvia} mm`;
                    article.appendChild(pLluvia);

                    const img = document.createElement("img");
                    img.src = urlIcono;
                    img.alt = descripcion;
                    article.appendChild(img);

                    section.appendChild(article);

                });
                $('main').append(section);
            },
            error: (jqXHR) => {
                console.error('Error Open-Meteo:', jqXHR.status, jqXHR.responseText);
                $('main').append(`<p class="error">No se pudo cargar la previsión semanal.</p>`);
            }
        });
    }

    // Función auxiliar para convertir el código de tiempo (weathercode) a texto descriptivo siguiendo la documentación de Open-Meteo (tabla WMO)
    codigoATxt(code) {
        const map = {
            0: 'Cielo despejado',
            1: 'Principalmente despejado',
            2: 'Parcialmente nublado',
            3: 'Cubierto',
            45: 'Neblina',
            48: 'Niebla escarchada',
            51: 'Llovizna ligera',
            53: 'Llovizna moderada',
            55: 'Llovizna intensa',
            56: 'Llovizna helada ligera',
            57: 'Llovizna helada intensa',
            61: 'Lluvia ligera',
            63: 'Lluvia moderada',
            65: 'Lluvia intensa',
            71: 'Nieve ligera',
            73: 'Nieve moderada',
            75: 'Nieve intensa',
            80: 'Chubascos ligeros',
            81: 'Chubascos moderados',
            82: 'Chubascos intensos',
            85: 'Chubascos de nieve ligeros',
            86: 'Chubascos de nieve intensos',
            95: 'Tormenta eléctrica',
            96: 'Tormenta eléctrica con granizo ligero',
            99: 'Tormenta eléctrica con granizo intenso'
        };
        return map[code] || 'Desconocido';
    }

    // Función auxiliar para mapear los códigos de tiempo (weathercode) de Open-Meteo a los iconos de OpenWeatherMap
    mapOpenMeteoToOWM(code) {
        const map = {
            0:  '01d', // Cielo despejado                           → 01d → Sol
            1:  '02d', // Principalmente despejado                  → 02d → Sol y nubes
            2:  '03d', // Parcialmente nublado                      → 03d → Nube
            3:  '04d', // Cubierto                                  → 04d → Nubes
            45: '50d', // Neblina                                   → 50d → Niebla
            48: '50d', // Niebla escarchada                         → 50d → Niebla
            51: '10d', // Llovizna ligera                           → 10d → Llovizna
            53: '10d', // Llovizna moderada                         → 10d → Llovizna
            55: '10n', // Llovizna intensa                          → 10n → Llovizna (noche)
            56: '10d', // Llovizna helada ligera                    → 10d → Llovizna
            57: '10n', // Llovizna helada intensa                   → 10n → Llovizna (noche)
            61: '09d', // Lluvia ligera                             → 09d → Lluvia
            63: '09d', // Lluvia moderada                           → 09d → Lluvia
            65: '09n', // Lluvia intensa                            → 09n → Lluvia (noche)
            71: '13d', // Nieve ligera                              → 13d → Nieve
            73: '13d', // Nieve moderada                            → 13d → Nieve
            75: '13d', // Nieve intensa                             → 13d → Nieve
            80: '09d', // Chubascos ligeros                         → 02d → Lluvia
            81: '09d', // Chubascos moderados                       → 02d → Lluvia
            82: '09n', // Chubascos fuertes                         → 02d → Lluvia (noche)
            85: '13d', // Chubascos de nieve ligeros                → 02d → Nieve
            86: '13d', // Chubascos de nieve intensos               → 02d → Nieve
            95: '11d', // Tormenta eléctrica                        → 11d → Tormenta
            96: '11d', // Tormenta eléctrica con granizo ligero     → 11d → Tormenta
            99: '11d'  // Tormenta eléctrica con granizo intenso    → 11d → Tormenta
        };
        return map[code] || '01d'; // Código desconocido, por defecto Sol
    }
}

var meteorologia = new Meteorologia();
