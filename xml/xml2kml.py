import xml.etree.ElementTree as ET

# Comienza el archivo KML con la cabecera y el estilo de línea
def prologoKML(outFile):
    outFile.write('<?xml version="1.0" encoding="UTF-8"?>\n')
    outFile.write('<kml xmlns="http://www.opengis.net/kml/2.2">\n')
    outFile.write("  <Document>\n")
    # Estilo para la línea roja
    outFile.write('    <Style id="lineaRoja">\n')
    outFile.write("      <LineStyle><color>#ff0000ff</color><width>4</width></LineStyle>\n")
    outFile.write("    </Style>\n\n")

# Cierra el documento KML
def epilogoKML(outFile):
    outFile.write("  </Document>\n")
    outFile.write("</kml>\n")

# Escribe la línea en el KML con la lista de coordenadas de la ruta
def escribeLinea(outFile, nombre, coords):
    outFile.write("    <Placemark>\n")
    outFile.write(f"      <name>{nombre}</name>\n")
    outFile.write("      <styleUrl>#lineaRoja</styleUrl>\n")
    outFile.write("      <LineString>\n")
    outFile.write("        <extrude>1</extrude>\n")
    outFile.write("        <tessellate>1</tessellate>\n")
    outFile.write("        <coordinates>\n")
    for lon, lat in coords:
        outFile.write(f"          {lon},{lat}\n")
    outFile.write("        </coordinates>\n")
    outFile.write("      </LineString>\n")
    outFile.write("    </Placemark>\n\n")

# Escribe un punto en el KML (hito) con su nombre y coordenadas
def escribePunto(outFile, nombre, lon, lat):
    outFile.write("    <Placemark>\n")
    outFile.write(f"      <name>{nombre}</name>\n")
    outFile.write("      <Point>\n")
    outFile.write(f"        <coordinates>{lon},{lat},0</coordinates>\n")
    outFile.write("      </Point>\n")
    outFile.write("    </Placemark>\n\n")

# Función principal que procesa el archivo XML y genera los archivos KML
def main():
    try:
        tree = ET.parse("rutasEsquema.xml")
    except Exception as e:
        print("No se puede abrir 'rutasEsquema.xml':", e)
        return

    ns = {'ns': 'http://www.uniovi.es'}
    root = tree.getroot()

    for index, ruta in enumerate(root.findall("ns:ruta", namespaces=ns), start=1):
        nombre_ruta = ruta.get("nombre")
        kml_filename = f"ruta{index}.kml"

        with open(kml_filename, "w", encoding="utf-8") as outFile:
            prologoKML(outFile)

            coord_inic = ruta.find("ns:coordenadas_inicio/ns:coordenada", namespaces=ns)
            coords_line = []
            if coord_inic is not None:
                lon_inic = coord_inic.get("longitud")
                lat_inic = coord_inic.get("latitud")
                coords_line.append((lon_inic, lat_inic))
                escribePunto(outFile, "Inicio: " + nombre_ruta, lon_inic, lat_inic)

            for hito in ruta.findall("ns:hitos/ns:hito", namespaces=ns):
                coord_hito = hito.find("ns:coordenadas_hito/ns:coordenada", namespaces=ns)
                if coord_hito is not None:
                    lon_hito = coord_hito.get("longitud")
                    lat_hito = coord_hito.get("latitud")
                    coords_line.append((lon_hito, lat_hito))
                    etiqueta = hito.get("nombre_hito")
                    escribePunto(outFile, etiqueta, lon_hito, lat_hito)

            escribeLinea(outFile, nombre_ruta, coords_line)

            epilogoKML(outFile)

        print(f"KML generado: {kml_filename}")

if __name__ == "__main__":
    main()
