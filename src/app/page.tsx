import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProjectForm } from '@/components/organisms/ProjectForm'

export default async function Home() {
  // 1. Initialize Supabase on the server
  const supabase = await createClient()
  
  // 2. Fetch the currently authenticated user
  const { data: { user }, error } = await supabase.auth.getUser()
  
  // Optional safety net: If somehow there is no user, send them back to login
  if (error || !user) {
    redirect('/login') // Change '/login' if your login route is named something else (e.g., '/')
  }

  // 3. Create the Server Action to handle signing out
  const signOutAction = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login') // Redirect to your login page after successful sign out
  }

  return (
    <div className="flex flex-col h-screen w-full bg-[#0a0a0a] text-zinc-100 overflow-hidden">
      
      {/* TOP NAVBAR */}
      <header className="h-16 flex-shrink-0 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-6 z-10">
        <div className="flex flex-col">
          <span className="font-bold text-zinc-100 tracking-tight">Workspace</span>
          {/* Dynamically display the real user's email here! */}
          <span className="text-[10px] text-zinc-500">{user.email}</span>
        </div>
        
        {/* Wire up the sign out action using a Next.js form */}
        <form action={signOutAction}>
          <button 
            type="submit"
            className="text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            Sign Out
          </button>
        </form>
      </header>

      {/* MAIN CANVAS */}
      <main className="flex-1 w-full overflow-hidden">
        <ProjectForm />
      </main>

    </div>
  )
}