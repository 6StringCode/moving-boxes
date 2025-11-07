import { NextResponse } from 'next/server';
import { getBoxes, addBox, updateBox, deleteBox, toggleBoxHidden, initDB } from '@/lib/db';

export async function GET(request: Request) {
  try {
    await initDB();
    const { searchParams } = new URL(request.url);
    const includeHidden = searchParams.get('includeHidden') === 'true';
    const boxes = await getBoxes(includeHidden);
    return NextResponse.json(boxes);
  } catch (error) {
    console.error('Error fetching boxes:', error);
    return NextResponse.json({ error: 'Failed to fetch boxes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { number, room, contents, image_url } = await request.json();
    const box = await addBox(number, room, contents, image_url);
    return NextResponse.json(box);
  } catch (error) {
    console.error('Error adding box:', error);
    return NextResponse.json({ error: 'Failed to add box' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    // Handle hide/unhide requests
    if (body.action === 'toggleHidden') {
      const box = await toggleBoxHidden(body.id, body.hidden);
      return NextResponse.json(box);
    }

    // Handle regular updates
    const { id, room, contents, image_url } = body;
    const box = await updateBox(id, room, contents, image_url);
    return NextResponse.json(box);
  } catch (error) {
    console.error('Error updating box:', error);
    return NextResponse.json({ error: 'Failed to update box' }, { status: 500 });
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