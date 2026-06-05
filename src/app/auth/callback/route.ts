import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  // Get the URL parameters Google sends back
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    // Exchange the Google code for a secure Supabase session
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Success! Send them to the workspace
      return NextResponse.redirect(`${origin}/`)
    }
  }

  // If something goes wrong, send them back to login with an error
  return NextResponse.redirect(`${origin}/login?message=Could not authenticate with Google`)
}