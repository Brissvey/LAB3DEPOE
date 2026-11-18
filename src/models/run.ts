
import {
    getDatabase,
    persistDatabase
  } from '../db/database';
  
  export interface Run {
    id: number;
    date: string;
    distance: number;
    duration: number;
    pace: string;
    notes: string;
    route: string | null;
  }
  
  export function getRuns(): Run[] {
    const db = getDatabase();
  
    const result = db.exec(`
      SELECT * FROM runs
      ORDER BY date DESC, id DESC
    `);
  
    if (result.length === 0) {
      return [];
    }
  
    return result[0].values.map((row) => ({
      id: Number(row[0]),
      date: String(row[1]),
      distance: Number(row[2]),
      duration: Number(row[3]),
      pace: String(row[4]),
      notes: String(row[5] ?? ''),
      route: row[6] == null ? null : String(row[6])
    }));
  }
  
  export function addRun(
    date: string,
    distance: number,
    duration: number,
    notes: string,
    route: string | null = null
  ): void {
    const db = getDatabase();
  
    const paceSeconds = Math.round(
      (duration * 60) / distance
    );
  
    const minutes = Math.floor(paceSeconds / 60);
    const seconds = paceSeconds % 60;
  
    const pace = `${minutes}:${String(seconds).padStart(2, '0')}`;
  
    db.run(
      `INSERT INTO runs
        (date, distance, duration, pace, notes, route)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [date, distance, duration, pace, notes, route]
    );
  
    persistDatabase();
  }
  
  export function updateRun(
    id: number,
    date: string,
    distance: number,
    duration: number,
    notes: string
  ): void {
    const db = getDatabase();
  
    const paceSeconds = Math.round(
      (duration * 60) / distance
    );
  
    const minutes = Math.floor(paceSeconds / 60);
    const seconds = paceSeconds % 60;
  
    const pace = `${minutes}:${String(seconds).padStart(2, '0')}`;
  
    db.run(
      `UPDATE runs
       SET date = ?, distance = ?, duration = ?,
           pace = ?, notes = ?
       WHERE id = ?`,
      [date, distance, duration, pace, notes, id]
    );
  
    persistDatabase();
  }
  
  export function deleteRun(id: number): void {
    const db = getDatabase();
  
    db.run('DELETE FROM runs WHERE id = ?', [id]);
  
    persistDatabase();
  }
  