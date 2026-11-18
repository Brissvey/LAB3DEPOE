
import initSqlJs, { type Database } from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

let db: Database;

const STORAGE_KEY = 'runtracker_database';

function saveDatabase(): void {
  const data = db.export();

  let binary = '';

  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }

  localStorage.setItem(
    STORAGE_KEY,
    btoa(binary)
  );
}

export async function initializeDatabase(): Promise<void> {
  const SQL = await initSqlJs({
    locateFile: () => wasmUrl
  });

  const savedDatabase = localStorage.getItem(STORAGE_KEY);

  if (savedDatabase) {
    const binary = atob(savedDatabase);

    const bytes = Uint8Array.from(
      binary,
      character => character.charCodeAt(0)
    );

    db = new SQL.Database(bytes);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      distance REAL NOT NULL,
      duration INTEGER NOT NULL,
      pace TEXT NOT NULL,
      notes TEXT,
      route TEXT
    );
  `);

  // Comprobar si la columna route ya existe
  const columns = db.exec('PRAGMA table_info(runs)');

  const hasRoute = columns[0]?.values.some(
    column => column[1] === 'route'
  );

  // Agregarla únicamente si todavía no existe
  if (!hasRoute) {
    db.run('ALTER TABLE runs ADD COLUMN route TEXT');
  }

  saveDatabase();

  console.log('SQLite conectado correctamente');
}

export function getDatabase(): Database {
  if (!db) {
    throw new Error('La base de datos no está inicializada');
  }

  return db;
}

export function persistDatabase(): void {
  saveDatabase();
}
