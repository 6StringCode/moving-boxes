import { sql } from '@vercel/postgres';

export async function initDB() {
  // Create table if it doesn't exist
  await sql`
    CREATE TABLE IF NOT EXISTS boxes (
      id SERIAL PRIMARY KEY,
      number INTEGER NOT NULL,
      room VARCHAR(100) NOT NULL,
      contents TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  // Drop priority column if it exists (migration)
  try {
    await sql`ALTER TABLE boxes DROP COLUMN IF EXISTS priority`;
  } catch (error) {
    // Column might not exist, that's fine
    console.log('Priority column already removed or does not exist');
  }
}

export async function getBoxes() {
  const { rows } = await sql`
    SELECT id, number, room, contents, created_at FROM boxes ORDER BY number ASC
  `;
  return rows;
}

export async function addBox(number: number, room: string, contents: string) {
  const { rows } = await sql`
    INSERT INTO boxes (number, room, contents)
    VALUES (${number}, ${room}, ${contents})
    RETURNING *
  `;
  return rows[0];
}

export async function updateBox(id: number, room: string, contents: string) {
  const { rows } = await sql`
    UPDATE boxes 
    SET room = ${room}, contents = ${contents}
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0];
}

export async function deleteBox(id: number) {
  await sql`DELETE FROM boxes WHERE id = ${id}`;
}

