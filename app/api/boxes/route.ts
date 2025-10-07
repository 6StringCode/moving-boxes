import { NextResponse } from 'next/server';
import { getBoxes, addBox, deleteBox, initDB } from '@/lib/db';

export async function GET() {
  try {
    await initDB();
    const boxes = await getBoxes();
    return NextResponse.json(boxes);
  } catch (error) {
    console.error('Error fetching boxes:', error);
    return NextResponse.json({ error: 'Failed to fetch boxes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { number, room, contents, priority } = await request.json();
    const box = await addBox(number, room, contents, priority);
    return NextResponse.json(box);
  } catch (error) {
    console.error('Error adding box:', error);
    return NextResponse.json({ error: 'Failed to add box' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await deleteBox(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting box:', error);
    return NextResponse.json({ error: 'Failed to delete box' }, { status: 500 });
  }
}