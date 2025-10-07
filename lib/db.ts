import { sql } from '@vercel/postgres';

export async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS boxes (
      id SERIAL PRIMARY KEY,
      number INTEGER NOT NULL,
      room VARCHAR(100) NOT NULL,
      contents TEXT NOT NULL,
      priority VARCHAR(20) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
}

export async function getBoxes() {
  const { rows } = await sql`
    SELECT * FROM boxes ORDER BY number ASC
  `;
  return rows;
}

export async function addBox(number: number, room: string, contents: string, priority: string) {
  const { rows } = await sql`
    INSERT INTO boxes (number, room, contents, priority)
    VALUES (${number}, ${room}, ${contents}, ${priority})
    RETURNING *
  `;
  return rows[0];
}

export async function deleteBox(id: number) {
  await sql`DELETE FROM boxes WHERE id = ${id}`;
}

