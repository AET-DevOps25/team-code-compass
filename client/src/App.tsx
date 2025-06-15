import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TopNavigation } from './components/TopNavigation'
import { CalendarSection } from './components/CalendarSection'
import { UserPreferencesPanel } from './components/UserPreferencesPanel'
import { LLMChatPanel } from './components/LLMChatPanel'
import './App.css'

const queryClient = new QueryClient()

function App() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-y-12"></div>
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-white/5 to-transparent transform skew-y-12"></div>
        </div>
        
        {/* Top Navigation */}
        <TopNavigation />
        
        {/* Main Content Area */}
        <div className="flex h-[calc(100vh-80px)] p-6 gap-6">
          {/* Main Calendar Section - Much Wider */}
          <div className="flex-1 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
            <CalendarSection 
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />
          </div>
          
          {/* Right Sidebar - Narrower and Compact */}
          <div className="w-80 flex flex-col gap-6">
            {/* Compact User Preferences */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
              <UserPreferencesPanel />
            </div>
            
            {/* LLM Chat Panel */}
            <div className="flex-1 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
              <LLMChatPanel />
            </div>
          </div>
        </div>
        
        {/* Floating Elements for Visual Appeal */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-xl"></div>
      </div>
    </QueryClientProvider>
  )
}

export default App 