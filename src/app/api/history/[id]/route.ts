import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { id } = await params; // Next.js 15+ standard for dynamic routes
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch all nodes belonging to this specific project_id
    const { data, error } = await supabase
      .from('nodes')
      .select('*')
      .eq('project_id', id);

    if (error) throw error;
    return NextResponse.json(data);

  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch nodes" }, { status: 500 });
  }
}


// Keep your existing GET function up here...

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
      const supabase = await createClient();
      const { id } = await params;
      
      // Verify user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
      // Delete the project. Thanks to your SQL ON DELETE CASCADE setup, 
      // this automatically deletes all associated nodes as well!
      const { error } = await supabase.from('projects').delete().eq('id', id);
  
      if (error) throw error;
      return NextResponse.json({ success: true });
  
    } catch (error) {
      return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
    }
  }