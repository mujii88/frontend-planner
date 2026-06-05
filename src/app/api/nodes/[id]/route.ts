import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// UPDATE a node
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const updates = await req.json();

    const { error } = await supabase
      .from('nodes')
      .update({
        name: updates.name,
        description: updates.description,
      })
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update node" }, { status: 500 });
  }
}

// DELETE a node
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Because of ON DELETE CASCADE in your SQL schema, 
    // deleting a parent automatically deletes all nested children!
    const { error } = await supabase.from('nodes').delete().eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete node" }, { status: 500 });
  }
}