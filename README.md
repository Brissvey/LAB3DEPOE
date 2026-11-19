
🏃 RunTracker – Mi Diario de Kilómetros

Aplicación web para registrar, visualizar y analizar entrenamientos de running mediante seguimiento GPS y estadísticas personales.

📋 Descripción

RunTracker permite llevar un registro de las carreras realizadas, consultar los kilómetros recorridos, analizar el ritmo promedio y visualizar los recorridos en un mapa.

El objetivo es ofrecer una herramienta sencilla para que los corredores puedan controlar su actividad física y consultar su progreso.

🚀 Funcionalidades

* Registro manual de carreras.
* Seguimiento de carreras mediante GPS.
* Visualización del recorrido en un mapa.
* Registro de distancia, duración y ritmo.
* Historial de entrenamientos.
* Edición y eliminación de carreras.
* Estadísticas semanales y mensuales.
* Gráfico de actividad semanal.
* Récords personales.
* Almacenamiento local de los entrenamientos.

🛠️ Tecnologías utilizadas

* HTML5: estructura de la aplicación.
* CSS3: diseño y estilos.
* TypeScript: lógica y funcionalidad.
* Vite: entorno de desarrollo y construcción.
* SQLite mediante SQL.js: gestión de la base de datos en el navegador.
* Leaflet: visualización de mapas.
* OpenStreetMap: mapas y cartografía.
* Geolocation API: seguimiento GPS del usuario.

💻 Instalación y ejecución

Requisitos previos

* Node.js
* npm
* Git

1. Clonar el repositorio

git clone https://github.com/Brissvey/LAB3DEPOE.git

2. Entrar en la carpeta del proyecto

cd LAB3DEPOE

3. Instalar las dependencias

npm install

4. Iniciar el servidor de desarrollo

npm run dev

La aplicación estará disponible en la dirección local que indique Vite en la terminal.

📦 Compilación para producción

Para generar la versión optimizada de la aplicación, ejecutar:

npm run build

Los archivos generados estarán dentro de la carpeta dist.

🗄️ Base de datos

La aplicación utiliza SQLite mediante SQL.js (WebAssembly) para gestionar los registros de entrenamiento directamente en el navegador.

Los datos se guardan localmente mediante localStorage, permitiendo conservar los entrenamientos entre sesiones en el mismo navegador y dispositivo.

Nota: los registros no se sincronizan automáticamente entre diferentes dispositivos o navegadores.

📍 Seguimiento GPS

El seguimiento GPS utiliza la Geolocation API del navegador para obtener la ubicación del usuario y representar el recorrido en el mapa.

Para utilizar esta funcionalidad, el navegador debe tener permiso para acceder a la ubicación. En producción, se requiere ejecutar la aplicación mediante HTTPS.

👨‍💻 Autor

Brissvey Calderón

Proyecto académico – Laboratorio 3.
