import xml.etree.ElementTree as ET
import math

# Lee el XML y devuelve una lista de tuplas para coordenada: [(lat1, lon1, alt1), (lat2, lon2, alt2), ...]
def parse_xml(xml_file):
    try:
        tree = ET.parse(xml_file)
    except Exception as e:
        print(f"Error al leer '{xml_file}': {e}")
        return []

    root = tree.getroot()
    ns = {'ns': 'http://www.uniovi.es'}
    rutas  = []

    for ruta in root.findall("ns:ruta", namespaces=ns):
        coords_ruta = []

        # Coordenadas de inicio
        coord_inic = ruta.find("ns:coordenadas_inicio/ns:coordenada", namespaces=ns)
        if coord_inic is not None:
            coords_ruta.append({
                "lat": float(coord_inic.get("latitud")),
                "lon": float(coord_inic.get("longitud")),
                "alt": float(coord_inic.get("altitud")),
                "nombre": "Inicio: " + ruta.get("nombre")
            })

        # Coordenadas de cada hito
        for hito in ruta.findall("ns:hitos/ns:hito", namespaces=ns):
            coord_hito = hito.find("ns:coordenadas_hito/ns:coordenada", namespaces=ns)
            if coord_hito is not None:
                coords_ruta.append({
                    "lat": float(coord_hito.get("latitud")),
                    "lon": float(coord_hito.get("longitud")),
                    "alt": float(coord_hito.get("altitud")),
                    "nombre": hito.get("nombre_hito")
                })
                
        rutas.append(coords_ruta)

    return rutas

# Genera el contenido SVG para cada ruta de coordenadas
def crear_contenido_svgs(rutas, width=800, height=400, margin=50):
    svgs = []
    for index, coord_list in enumerate(rutas, start=1):
        altitudes = [p['alt'] for p in coord_list]
        min_alt, max_alt = min(altitudes), max(altitudes)
        rango_alt = max_alt - min_alt

        # Salto horizontal entre cada punto
        step_x = (width - 2 * margin) / (len(coord_list) - 1)

        # Cálculo de la posición vertical (altitud) en escalado
        if rango_alt == 0:
            y0 = height - margin
        else:
            escala = (0 - min_alt) / rango_alt
            y = height - 2 * margin
            y0 = (height - margin) - escala * y

        svg_lines = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height + 250}" viewBox="0 -{250} {width} {height + 250}">'
        ]

        # Inicio en (margin, height) => Esquina inferior izquierda + márgen
        points = []

        for i, p in enumerate(coord_list):
            x = margin + i * step_x

            if rango_alt == 0:
                y = height - margin
            else:
                escala = (p['alt'] - min_alt) / rango_alt
                y = height - 2 * margin
                y0 = (height - margin) - escala * y

            points.append(f"{x:.2f},{y0:.2f}")

        # Punto final de la base y cierre de perfil
        base_y = height - 1
        pts = [f"{margin},{base_y}"] + points + [f"{width-margin},{base_y}", f"{margin},{base_y}"]
        pts_str = " ".join(pts)
        svg_lines.append(
            f'  <polyline points="{pts_str}" '
            'style="fill:white;stroke:red;stroke-width:2" />'
        )

        # Marcadores y etiquetas
        for i, p in enumerate(coord_list):
            x = margin + i*step_x

            if rango_alt == 0:
                y = height - margin
            else:
                escala = (p['alt'] - min_alt) / rango_alt
                y = (height - margin) - escala * (height - 2 * margin)
            svg_lines.append(
                f'  <circle cx="{x:.2f}" cy="{y:.2f}" r="4" '
                'fill="green" stroke="black" stroke-width="1" />'
            )
            ty = y - 8

            text = p['nombre']
            svg_lines.append(
                f'  <text x="{x+6:.2f}" y="{ty:.2f}" transform="rotate(-80 {x:.2f} {y:.2f})" '
                'font-family="Arial" font-size="12" fill="black">'
                f'{text}</text>'
            )

        # Línea nivel del mar (0 metros)
        svg_lines.append(
            f'  <line x1="{margin}" y1="{height - 10:.2f}" '
            f'x2="{width-margin}" y2="{height - 10:.2f}" '
            'stroke="blue" stroke-width="1" stroke-dasharray="5,5" />'
        )

        svg_lines.append('</svg>')
        svgs.append("\n".join(svg_lines))

    return svgs

# Guarda el contenido SVG en un archivo
def save_svg(svg_content, svg_file):
    try:
        with open(svg_file, 'w', encoding='utf-8') as f:
            f.write(svg_content)
    except IOError as e:
        print(f"Error al guardar '{svg_file}': {e}")

# Función principal que orquesta el proceso de conversión de XML a SVG
def main():
    xml_file = "rutasEsquema.xml"

    coordinates = parse_xml(xml_file)
    if not coordinates:
        print("No se ha podido extraer ninguna ruta. Terminando.")
        return

    svgs = crear_contenido_svgs(coordinates)

    for index, svg_content in enumerate(svgs, start=1):
        svg_file = f"ruta{index}.svg"
        save_svg(svg_content, svg_file)
        print(f"Conversión completada con éxito: {svg_file} creado.")

if __name__ == "__main__":
    main()
