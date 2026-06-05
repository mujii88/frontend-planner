import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { randomUUID } from 'crypto'; // Required for generating valid Postgres UUIDs

// Initialize the Groq provider
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    const supabase = await createClient();
    
    // 1. Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 2. Define the system prompt with strict relational hierarchy rules
    const systemPrompt = `You are an expert React/Next.js Software Architect. 
    Your job is to break down application requirements into a deep, hierarchical atomic component architecture.
    Strictly follow atomic design principles (pages -> organisms -> molecules -> atoms).

    CRITICAL INSTRUCTION: You must generate a relational parent-child hierarchy. 
    1. Every node must have a unique string \`id\` (e.g., 'page-1', 'org-1', 'mol-1').
    2. Child nodes must include a \`parent_id\` that strictly matches the \`id\` of their parent.
    3. Root nodes (Pages) must have a \`parent_id\` of null.
    4. Organisms must have a \`parent_id\` pointing to a Page.
    5. Molecules must have a \`parent_id\` pointing to an Organism.
    6. Atoms must have a \`parent_id\` pointing to a Molecule or Organism.

    Return ONLY raw valid JSON. Do not wrap the response in markdown blocks like \`\`\`json. Your output must strictly match this structure:
    {
      "nodes": [
        {
          "id": "page-dash-1",
          "parent_id": null,
          "type": "page",
          "name": "DashboardPage",
          "description": "Main entry point",
          "content": {}
        },
        {
          "id": "org-nav-1",
          "parent_id": "page-dash-1",
          "type": "organism",
          "name": "SideNavigation",
          "description": "Main routing sidebar",
          "content": {}
        }
      ]
    }`;

    // 3. Generate the Architecture
    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system: systemPrompt,
      prompt: prompt,
    });

    // CRITICAL: This must be a single line to avoid "Unterminated regexp literal" errors
    const parsedData = JSON.parse(text.replace(/```json/gi, '').replace(/```/gi, '').trim());
    const nodes = parsedData.nodes;

    // 4. Save to Supabase
    
    // First, save the project
    const { data: project, error: pError } = await supabase
      .from('projects')
      .insert({ user_id: user.id, title: prompt.substring(0, 50) } as any)
      .select()
      .single() as any;
    if (pError) throw pError;

    // Create a dictionary to map LLM string IDs to real Database UUIDs
    const idMap = new Map();
    nodes.forEach((n: any) => {
      idMap.set(n.id, randomUUID());
    });

    // Second, save all nodes in one batch using mapped UUIDs
    const nodesToInsert = nodes.map((n: any) => ({
      id: idMap.get(n.id), // Override the LLM's ID with our real UUID
      project_id: project.id,
      user_id: user.id,
      parent_id: n.parent_id ? idMap.get(n.parent_id) : null, // Safely map the parent connection
      type: n.type,
      name: n.name,
      description: n.description,
      content: n.content || {} // Ensure content is safely populated
    }));

    const { error: nError } = await supabase.from('nodes').insert(nodesToInsert as any);
    if (nError) throw nError;

    // Return the mapped nodes with the new UUIDs to the frontend so the Tree builds perfectly
    return NextResponse.json(nodesToInsert);

  } catch (error) {
    console.error("Pipeline Error:", error);
    return NextResponse.json({ error: "Failed to persist architecture." }, { status: 500 });
  }
}