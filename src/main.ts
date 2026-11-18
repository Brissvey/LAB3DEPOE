
import './style.css';
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';

import { initializeDatabase } from './db/database';

import {
  getRuns,
  addRun,
  updateRun,
  deleteRun,
  type Run
} from './models/run';

import { renderRouteMap } from './maps/map';

// Variables del seguimiento GPS
let watchId: number | null = null;
let trackingMap: L.Map | null = null;
let routeLine: L.Polyline | null = null;
let currentMarker: L.CircleMarker | null = null;

let coordinates: [number, number][] = [];
let totalDistance = 0;
let startTime = 0;
let elapsedBeforePause = 0;
let paused = false;
let lastPosition: GeolocationPosition | null = null;
let timerInterval: number | null = null;

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <header class="navbar">
    <div class="logo">🏃 RunTracker</div>
    <nav>
      <a href="#dashboard">Dashboard</a>
      <a href="#tracker">Correr</a>
      <a href="#progreso">Mi progreso</a>
      <a href="#historial">Mis carreras</a>
    </nav>
    <div class="profile">BC</div>
  </header>

  <main class="container" id="dashboard">

    <section class="welcome">
      <div>
        <p class="subtitle">TU PROGRESO, TU HISTORIA</p>
        <h1>Hola, corredor 👋</h1>
        <p>Un kilómetro más cerca de tus objetivos.</p>
      </div>

      <button class="add-button" id="addRun">
        + Registrar carrera
      </button>
    </section>

    <section class="stats">
      <article class="stat-card">
        <span>Distancia total</span>
        <h2>0.0 <small>km</small></h2>
        <p>Todos tus entrenamientos</p>
      </article>

      <article class="stat-card">
        <span>Tiempo total</span>
        <h2>0 <small>horas</small></h2>
        <p>Tiempo acumulado</p>
      </article>

      <article class="stat-card">
        <span>Ritmo promedio</span>
        <h2>-- <small>/km</small></h2>
        <p>Minutos por kilómetro</p>
      </article>

      <article class="stat-card">
        <span>Entrenamientos</span>
        <h2>0</h2>
        <p>Carreras registradas</p>
      </article>
    </section>

    <section class="progress-section" id="progreso">
      <div class="section-header">
        <div>
          <h2>Mi progreso</h2>
          <p>Un resumen de tus kilómetros y entrenamientos</p>
        </div>
      </div>

      <div class="progress-periods">
        <article class="progress-panel">
          <h3>Esta semana</h3>
          <div class="progress-metrics">
            <div><span>Distancia</span><strong id="weekDistance">0.00 km</strong></div>
            <div><span>Entrenamientos</span><strong id="weekRuns">0</strong></div>
            <div><span>Tiempo total</span><strong id="weekDuration">0 min</strong></div>
            <div><span>Ritmo promedio</span><strong id="weekPace">--:-- /km</strong></div>
          </div>
          <div class="weekly-chart" id="weeklyChart" aria-label="Kilómetros recorridos cada día"></div>
        </article>

        <article class="progress-panel">
          <h3>Este mes</h3>
          <div class="progress-metrics">
            <div><span>Distancia</span><strong id="monthDistance">0.00 km</strong></div>
            <div><span>Entrenamientos</span><strong id="monthRuns">0</strong></div>
            <div><span>Tiempo total</span><strong id="monthDuration">0 min</strong></div>
            <div><span>Ritmo promedio</span><strong id="monthPace">--:-- /km</strong></div>
          </div>
        </article>
      </div>

      <article class="progress-panel records-panel">
        <h3>Mis marcas personales</h3>
        <div class="record-grid">
          <div><span>Carrera más larga</span><strong id="longestRun">--</strong></div>
          <div><span>Mejor ritmo</span><strong id="bestPace">--</strong></div>
          <div><span>Mejor 5K</span><strong id="best5k">--</strong></div>
        </div>
      </article>
    </section>

    <section class="tracker-section" id="tracker">
      <div class="section-header">
        <div>
          <h2>Mi carrera en vivo</h2>
          <p>Registra tu recorrido con GPS</p>
        </div>
        <span id="gpsStatus">GPS detenido</span>
      </div>

      <div class="tracker-stats">
        <article class="stat-card">
          <span>Distancia</span>
          <h2 id="liveDistance">0.00 <small>km</small></h2>
        </article>

        <article class="stat-card">
          <span>Tiempo</span>
          <h2 id="liveTime">00:00:00</h2>
        </article>

        <article class="stat-card">
          <span>Ritmo actual</span>
          <h2 id="livePace">--:-- <small>/km</small></h2>
        </article>
      </div>

      <div id="liveMap" class="run-map live-map">
        <div class="map-placeholder">
          <span>📍</span>
          <p>Tu recorrido aparecerá aquí cuando inicies la carrera.</p>
        </div>
      </div>

      <div class="tracker-actions">
        <button class="add-button" id="startTracking">
          ▶ Iniciar carrera
        </button>

        

        <button class="cancel-button" id="pauseTracking" disabled>
          Pausar
        </button>

        <button class="delete-button" id="stopTracking" disabled>
          Finalizar
        </button>
      </div>
    </section>

    <section class="history" id="historial">
      <div class="section-header">
        <div>
          <h2>Mis carreras</h2>
          <p>Tu historial de entrenamientos</p>
        </div>
      </div>

      <div class="empty-state">
        <div class="run-icon">🏃‍♂️</div>
        <h3>Aún no tienes carreras</h3>
        <p>Registra tu primer entrenamiento y comienza
        a construir tu historial.</p>
        <button class="add-button" id="firstRun">
          Registrar primera carrera
        </button>
      </div>
    </section>

  </main>

  <footer>
    <p>RUNTRACKER © 2026 · CADA KILÓMETRO CUENTA</p>
  </footer>
`;

// Formulario para registrar carreras manualmente
const dialog = document.createElement('dialog');

dialog.innerHTML = `
  <form id="runForm" class="run-form">
    <h2 id="formTitle">Registrar carrera</h2>

    <input type="hidden" id="runId">

    <label for="date">Fecha</label>
    <input type="date" id="date" required>

    <label for="distance">Distancia (km)</label>
    <input
      type="number"
      id="distance"
      min="0.1"
      step="0.01"
      placeholder="Ej. 5.00"
      required
    >

    <label for="duration">Duración (minutos)</label>
    <input
      type="number"
      id="duration"
      min="1"
      step="1"
      placeholder="Ej. 28"
      required
    >

    <label for="notes">Notas del entrenamiento</label>
    <textarea
      id="notes"
      placeholder="¿Cómo te sentiste durante la carrera?"
    ></textarea>

    <div class="form-actions">
      <button type="button" id="cancelRun" class="cancel-button">
        Cancelar
      </button>

      <button type="submit" class="add-button">
        Guardar carrera
      </button>
    </div>
  </form>
`;

document.body.appendChild(dialog);

// Referencias del formulario
const runForm = document.querySelector<HTMLFormElement>('#runForm')!;
const history = document.querySelector<HTMLElement>('.history')!;
const emptyState = history.querySelector<HTMLElement>('.empty-state')!;

const runList = document.createElement('div');
runList.className = 'run-list';
history.appendChild(runList);

// Referencias del seguimiento
const startButton =
  document.querySelector<HTMLButtonElement>('#startTracking')!;

const pauseButton =
  document.querySelector<HTMLButtonElement>('#pauseTracking')!;

const stopButton =
  document.querySelector<HTMLButtonElement>('#stopTracking')!;

const gpsStatus =
  document.querySelector<HTMLElement>('#gpsStatus')!;

const liveMapContainer =
  document.querySelector<HTMLElement>('#liveMap')!;

// Distancia entre dos coordenadas GPS en kilómetros
function calculateDistance(
  first: [number, number],
  second: [number, number]
): number {
  const toRadians = (degrees: number) =>
    degrees * Math.PI / 180;

  const earthRadius = 6371;

  const dLat = toRadians(second[0] - first[0]);
  const dLon = toRadians(second[1] - first[1]);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(first[0])) *
    Math.cos(toRadians(second[0])) *
    Math.sin(dLon / 2) ** 2;

  return earthRadius * 2 * Math.atan2(
    Math.sqrt(a),
    Math.sqrt(1 - a)
  );
}

// Formatear tiempo
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return [
    String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
    String(remainingSeconds).padStart(2, '0')
  ].join(':');
}

// Tiempo transcurrido
function getElapsedSeconds(): number {
  if (paused) {
    return elapsedBeforePause;
  }

  return elapsedBeforePause +
    Math.floor((Date.now() - startTime) / 1000);
}

// Actualizar estadísticas en vivo
function updateLiveStats(): void {
  const elapsed = getElapsedSeconds();

  const distanceElement =
    document.querySelector<HTMLElement>('#liveDistance')!;

  const timeElement =
    document.querySelector<HTMLElement>('#liveTime')!;

  const paceElement =
    document.querySelector<HTMLElement>('#livePace')!;

  distanceElement.innerHTML =
    `${totalDistance.toFixed(2)} <small>km</small>`;

  timeElement.textContent = formatTime(elapsed);

  if (totalDistance > 0.02) {
    const paceSeconds = Math.round(elapsed / 60 / totalDistance);

    const minutes = Math.floor(paceSeconds / 60);
    const seconds = String(paceSeconds % 60).padStart(2, '0');

    paceElement.innerHTML =
      `${minutes}:${seconds} <small>/km</small>`;
  } else {
    paceElement.innerHTML = '--:-- <small>/km</small>';
  }
}

// Crear mapa de seguimiento
function createTrackingMap(
  latitude: number,
  longitude: number
): void {
  liveMapContainer.innerHTML = '';

  trackingMap = L.map(liveMapContainer).setView(
    [latitude, longitude],
    17
  );

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(trackingMap);

  routeLine = L.polyline([], {
    color: '#ff793f',
    weight: 5,
    opacity: 0.9
  }).addTo(trackingMap);

  currentMarker = L.circleMarker(
    [latitude, longitude],
    {
      radius: 8,
      color: '#ffffff',
      weight: 2,
      fillColor: '#ff793f',
      fillOpacity: 1
    }
  ).addTo(trackingMap);
}

// Recibir ubicación GPS
function handlePosition(position: GeolocationPosition): void {
  if (paused) return;

  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;

  const accuracy = position.coords.accuracy;

  // Ignorar ubicaciones con demasiada imprecisión
  if (accuracy > 50) return;

  const newPoint: [number, number] = [latitude, longitude];

  if (!trackingMap) {
    createTrackingMap(latitude, longitude);
  }

  if (lastPosition) {
    const previousPoint: [number, number] = [
      lastPosition.coords.latitude,
      lastPosition.coords.longitude
    ];

    const segmentDistance = calculateDistance(
      previousPoint,
      newPoint
    );

    // Ignorar saltos GPS demasiado grandes
    if (segmentDistance > 0.2) {
      return;
    }

    // Ignorar movimientos GPS insignificantes
    if (segmentDistance < 0.003) {
      return;
    }

    totalDistance += segmentDistance;
  }

  coordinates.push(newPoint);
  lastPosition = position;

  routeLine?.addLatLng(newPoint);
  currentMarker?.setLatLng(newPoint);

  trackingMap?.panTo(newPoint);

  updateLiveStats();
}

// Error del GPS
function handlePositionError(error: GeolocationPositionError): void {
  console.error('Error GPS:', error);

  if (error.code === error.PERMISSION_DENIED) {
    gpsStatus.textContent = 'Permiso GPS denegado';
    alert('Debes permitir el acceso a tu ubicación para registrar la carrera.');
  } else if (error.code === error.POSITION_UNAVAILABLE) {
    gpsStatus.textContent = 'Ubicación no disponible';
  } else {
    gpsStatus.textContent = 'Tiempo de espera GPS agotado';
  }
}

// Iniciar carrera
function startTracking(): void {
  if (!navigator.geolocation) {
    alert('Tu navegador no admite geolocalización.');
    return;
  }

  if (!window.isSecureContext) {
    alert('El GPS necesita HTTPS o localhost para funcionar.');
    return;
  }

  if (watchId !== null) return;

  if (!paused) {
    coordinates = [];
    totalDistance = 0;
    elapsedBeforePause = 0;
    lastPosition = null;

    if (trackingMap) {
      trackingMap.remove();
      trackingMap = null;
    }

    routeLine = null;
    currentMarker = null;
  }

  paused = false;
  startTime = Date.now();

  gpsStatus.textContent = 'Buscando GPS...';

  startButton.disabled = true;
  pauseButton.disabled = false;
  stopButton.disabled = false;

  watchId = navigator.geolocation.watchPosition(
    handlePosition,
    handlePositionError,
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 20000
    }
  );

  if (timerInterval !== null) {
    window.clearInterval(timerInterval);
  }

  timerInterval = window.setInterval(updateLiveStats, 1000);
}

// Pausar o continuar
function togglePause(): void {
  if (watchId !== null) {
    elapsedBeforePause = getElapsedSeconds();

    navigator.geolocation.clearWatch(watchId);
    watchId = null;

    paused = true;

    pauseButton.textContent = 'Continuar';
    gpsStatus.textContent = 'Carrera pausada';

    if (timerInterval !== null) {
      window.clearInterval(timerInterval);
      timerInterval = null;
    }

    updateLiveStats();
  } else if (paused) {
    pauseButton.textContent = 'Pausar';
    startTracking();
  }
}

// Finalizar carrera
function stopTracking(): void {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  if (timerInterval !== null) {
    window.clearInterval(timerInterval);
    timerInterval = null;
  }

  const elapsed = getElapsedSeconds();

  paused = false;

  startButton.disabled = false;
  pauseButton.disabled = true;
  stopButton.disabled = true;

  pauseButton.textContent = 'Pausar';
  gpsStatus.textContent = 'Carrera finalizada';

  if (coordinates.length < 2 || totalDistance <= 0) {
    alert('No hay suficientes puntos GPS para guardar esta carrera.');

    resetTracker();
    return;
  }

  const duration = Math.max(1, Math.round(elapsed / 60));
  const distance = Number(totalDistance.toFixed(2));

  if (confirm(
    `¿Guardar carrera?\n\nDistancia: ${distance} km\nTiempo: ${formatTime(elapsed)}`
  )) {
    const date = new Date().toLocaleDateString('en-CA');

    addRun(
      date,
      distance,
      duration,
      'Carrera registrada con GPS',
      JSON.stringify(coordinates)
    );

    renderRuns();

    alert('¡Tu carrera se guardó correctamente!');
  }

  resetTracker();
}

// Reiniciar pantalla de seguimiento
function resetTracker(): void {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  if (timerInterval !== null) {
    window.clearInterval(timerInterval);
    timerInterval = null;
  }

  coordinates = [];
  totalDistance = 0;
  elapsedBeforePause = 0;
  lastPosition = null;
  paused = false;

  if (trackingMap) {
    trackingMap.remove();
    trackingMap = null;
  }

  routeLine = null;
  currentMarker = null;

  liveMapContainer.innerHTML = `
    <div class="map-placeholder">
      <span>📍</span>
      <p>Tu recorrido aparecerá aquí cuando inicies la carrera.</p>
    </div>
  `;

  updateLiveStats();

  gpsStatus.textContent = 'GPS detenido';

  startButton.disabled = false;
  pauseButton.disabled = true;
  stopButton.disabled = true;

  pauseButton.textContent = 'Pausar';
}

// Botones de seguimiento
startButton.addEventListener('click', startTracking);
pauseButton.addEventListener('click', togglePause);
stopButton.addEventListener('click', stopTracking);

// Abrir formulario manual
function openRunForm(run?: Run): void {
  runForm.reset();

  const idInput =
    document.querySelector<HTMLInputElement>('#runId')!;

  const dateInput =
    document.querySelector<HTMLInputElement>('#date')!;

  const distanceInput =
    document.querySelector<HTMLInputElement>('#distance')!;

  const durationInput =
    document.querySelector<HTMLInputElement>('#duration')!;

  const notesInput =
    document.querySelector<HTMLTextAreaElement>('#notes')!;

  const title =
    document.querySelector<HTMLElement>('#formTitle')!;

  if (run) {
    title.textContent = 'Editar carrera';
    idInput.value = String(run.id);
    dateInput.value = run.date;
    distanceInput.value = String(run.distance);
    durationInput.value = String(run.duration);
    notesInput.value = run.notes;
  } else {
    title.textContent = 'Registrar carrera';
    dateInput.value = new Date().toLocaleDateString('en-CA');
  }

  dialog.showModal();
}

// Convertir minutos por kilómetro a formato mm:ss
function formatPace(totalMinutes: number, distance: number): string {
  if (distance <= 0) return '--:--';

  const totalSeconds = Math.round(totalMinutes * 60 / distance);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');

  return `${minutes}:${seconds}`;
}

// Mostrar estadísticas, progreso e historial
function renderRuns(): void {
  const runs = getRuns();

  const totalDistance = runs.reduce(
    (sum, run) => sum + run.distance,
    0
  );

  const totalDuration = runs.reduce(
    (sum, run) => sum + run.duration,
    0
  );

  const averagePace = formatPace(totalDuration, totalDistance);

  const stats = document.querySelectorAll<HTMLElement>(
    '.stat-card h2'
  );

  stats[0].innerHTML =
    `${totalDistance.toFixed(2)} <small>km</small>`;

  stats[1].innerHTML =
    `${(totalDuration / 60).toFixed(1)} <small>horas</small>`;

  stats[2].innerHTML = totalDistance > 0
    ? `${averagePace} <small>/km</small>`
    : `-- <small>/km</small>`;

  stats[3].textContent = String(runs.length);

  // Fechas locales para calcular la semana y el mes actuales
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monday = new Date(today);
  const dayOfWeek = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - dayOfWeek);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const getRunDate = (run: Run): Date => {
    const [year, month, day] = run.date.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const runsThisWeek = runs.filter(run => {
    const date = getRunDate(run);
    return date >= monday && date <= today;
  });

  const runsThisMonth = runs.filter(run => {
    const date = getRunDate(run);
    return date >= monthStart && date <= today;
  });

  const summarize = (items: Run[]) => {
    const distance = items.reduce((sum, run) => sum + run.distance, 0);
    const duration = items.reduce((sum, run) => sum + run.duration, 0);

    return {
      distance,
      duration,
      count: items.length,
      pace: formatPace(duration, distance)
    };
  };

  const week = summarize(runsThisWeek);
  const month = summarize(runsThisMonth);

  const setText = (selector: string, value: string) => {
    const element = document.querySelector<HTMLElement>(selector);
    if (element) element.textContent = value;
  };

  setText('#weekDistance', `${week.distance.toFixed(2)} km`);
  setText('#weekRuns', String(week.count));
  setText('#weekDuration', `${week.duration} min`);
  setText('#weekPace', week.distance > 0 ? `${week.pace} /km` : '--:-- /km');

  setText('#monthDistance', `${month.distance.toFixed(2)} km`);
  setText('#monthRuns', String(month.count));
  setText('#monthDuration', `${month.duration} min`);
  setText('#monthPace', month.distance > 0 ? `${month.pace} /km` : '--:-- /km');

  // Gráfico de kilómetros por día de la semana actual
  const chart = document.querySelector<HTMLElement>('#weeklyChart');
  if (chart) {
    const dayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const dailyDistances = Array(7).fill(0) as number[];

    runsThisWeek.forEach(run => {
      const date = getRunDate(run);
      const index = (date.getDay() + 6) % 7;
      dailyDistances[index] += run.distance;
    });

    const maxDistance = Math.max(...dailyDistances, 1);

    chart.innerHTML = dayLabels.map((label, index) => {
      const value = dailyDistances[index];
      const height = value > 0 ? Math.max(6, (value / maxDistance) * 100) : 0;

      return `
        <div class="chart-day">
          <span class="chart-value">${value > 0 ? value.toFixed(1) : ''}</span>
          <div class="chart-bar-track">
            <div class="chart-bar" style="height: ${height}%"></div>
          </div>
          <span class="chart-label">${label}</span>
        </div>
      `;
    }).join('');
  }

  // Récords calculados únicamente con carreras guardadas
  if (runs.length > 0) {
    const longest = runs.reduce((best, run) =>
      run.distance > best.distance ? run : best
    );

    const validPaceRuns = runs.filter(run => run.distance > 0 && run.duration > 0);
    const fastest = validPaceRuns.length > 0
      ? validPaceRuns.reduce((best, run) =>
          run.duration / run.distance < best.duration / best.distance ? run : best
        )
      : null;

    // Se considera una carrera de 5K aquella entre 4.8 y 5.2 km
    const fiveKRuns = runs.filter(run =>
      run.distance >= 4.8 && run.distance <= 5.2
    );

    const best5k = fiveKRuns.length > 0
      ? fiveKRuns.reduce((best, run) =>
          run.duration < best.duration ? run : best
        )
      : null;

    setText('#longestRun', `${longest.distance.toFixed(2)} km`);
    setText(
      '#bestPace',
      fastest ? `${formatPace(fastest.duration, fastest.distance)} /km` : '--'
    );
    setText(
      '#best5k',
      best5k ? `${best5k.duration} min` : 'Aún sin 5K'
    );
  } else {
    setText('#longestRun', '--');
    setText('#bestPace', '--');
    setText('#best5k', '--');
  }

  emptyState.style.display =
    runs.length === 0 ? 'block' : 'none';

  runList.innerHTML = '';

  runs.forEach(run => {
    const card = document.createElement('article');
    card.className = 'run-item';

    const info = document.createElement('div');
    info.className = 'run-info';

    const date = document.createElement('h3');

    date.textContent = new Date(
      `${run.date}T00:00:00`
    ).toLocaleDateString('es-SV');

    const details = document.createElement('p');

    details.textContent =
      `${run.distance} km · ${run.duration} min · Ritmo ${run.pace}/km`;

    const notes = document.createElement('p');
    notes.className = 'run-notes';
    notes.textContent = run.notes || 'Sin notas';

    info.append(date, details, notes);

    const actions = document.createElement('div');
    actions.className = 'run-actions';

    const editButton = document.createElement('button');
    editButton.textContent = 'Editar';
    editButton.className = 'edit-button';
    editButton.dataset.action = 'edit';
    editButton.dataset.id = String(run.id);

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Eliminar';
    deleteButton.className = 'delete-button';
    deleteButton.dataset.action = 'delete';
    deleteButton.dataset.id = String(run.id);

    actions.append(editButton, deleteButton);
    card.append(info, actions);

    if (run.route) {
      const mapContainer = document.createElement('div');
      mapContainer.className = 'run-map';

      card.appendChild(mapContainer);
      runList.appendChild(card);

      try {
        const routeCoordinates =
          JSON.parse(run.route) as [number, number][];

        renderRouteMap(mapContainer, routeCoordinates);
      } catch (error) {
        console.error('Error mostrando mapa:', error);
        mapContainer.textContent = 'No se pudo mostrar el recorrido.';
      }

      return;
    }

    runList.appendChild(card);
  });
}

// Abrir formulario desde los botones
document.querySelectorAll('#addRun, #firstRun').forEach(button => {
  button.addEventListener('click', () => openRunForm());
});

// Cancelar formulario
document.querySelector('#cancelRun')!.addEventListener('click', () => {
  dialog.close();
});

// Guardar o actualizar carrera manual
runForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const id =
    (document.querySelector('#runId') as HTMLInputElement).value;

  const date =
    (document.querySelector('#date') as HTMLInputElement).value;

  const distance =
    Number((document.querySelector('#distance') as HTMLInputElement).value);

  const duration =
    Number((document.querySelector('#duration') as HTMLInputElement).value);

  const notes =
    (document.querySelector('#notes') as HTMLTextAreaElement).value.trim();

  if (
    !date ||
    !Number.isFinite(distance) ||
    !Number.isFinite(duration) ||
    distance <= 0 ||
    duration <= 0
  ) {
    alert('Verifica la fecha, distancia y duración.');
    return;
  }

  if (id) {
    updateRun(Number(id), date, distance, duration, notes);
  } else {
    addRun(date, distance, duration, notes);
  }

  dialog.close();
  renderRuns();
});

// Editar y eliminar carreras
runList.addEventListener('click', (event) => {
  const target = event.target as HTMLElement;

  const button = target.closest<HTMLButtonElement>(
    'button[data-action]'
  );

  if (!button) return;

  const id = Number(button.dataset.id);
  const action = button.dataset.action;

  if (action === 'edit') {
    const run = getRuns().find(item => item.id === id);

    if (run) openRunForm(run);
  }

  if (action === 'delete') {
    if (confirm('¿Seguro que deseas eliminar esta carrera?')) {
      deleteRun(id);
      renderRuns();
    }
  }
});

// Inicializar aplicación
initializeDatabase()
  .then(() => {
    console.log('RunTracker: base de datos lista');
    renderRuns();
    updateLiveStats();
  })
  .catch(error => {
    console.error('Error al iniciar SQLite:', error);
  });
