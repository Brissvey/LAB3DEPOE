# 🏃 RunTracker – Mi Diario de Kilómetros

Aplicación web para registrar, visualizar y analizar entrenamientos de running mediante seguimiento GPS y estadísticas personales.

## Descripción

RunTracker permite llevar un registro de las carreras realizadas, consultar los kilómetros recorridos, analizar el ritmo promedio y visualizar los recorridos en un mapa.

## Funcionalidades

- Registro manual de carreras.
- Seguimiento de carreras mediante GPS.
- Visualización del recorrido en un mapa.
- Registro de distancia, duración y ritmo.
- Historial de entrenamientos.
- Edición y eliminación de carreras.
- Estadísticas semanales y mensuales.
- Gráfico de actividad semanal.
- Récords personales.

## Tecnologías utilizadas

- HTML5
- CSS3
- TypeScript
- Vite
- SQLite mediante SQL.js (WebAssembly)
- Leaflet
- OpenStreetMap
- Geolocation API del navegador

## Instalación y ejecución

1. Clonar el repositorio:

   `git clone https://github.com/Brissvey/LAB3DEPOE.git`

2. Entrar a la carpeta:

   `cd LAB3DEPOE`

3. Instalar dependencias:

   `npm install`

4. Iniciar el servidor:

   `npm run dev`

## Compilación para producción

`npm run build`

## Base de datos

La aplicación utiliza SQLite mediante SQL.js en el navegador y guarda la base de datos localmente para conservar los registros entre sesiones en el mismo navegador.

## Seguimiento GPS

El seguimiento GPS requiere que el navegador permita el acceso a la ubicación y que la aplicación se ejecute en un contexto seguro, como HTTPS o localhost.

## Autor

Brissvey Calderón

Proyecto académico – Laboratorio 3
