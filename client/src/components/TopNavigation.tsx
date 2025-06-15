import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, User, LogIn, UserPlus, Settings, Activity } from 'lucide-react'

export function TopNavigation() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  return (
    <header className="h-20 bg-white/5 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-8 relative z-50">
      {/* Left - Brand/Logo */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            FlexFit
          </h1>
          <p className="text-xs text-white/60">Personal Fitness Assistant</p>
        </div>
      </div>

      {/* Center - Navigation Items (Optional) */}
      <nav className="hidden md:flex items-center space-x-8">
        <button className="text-white/80 hover:text-white transition-colors text-sm font-medium">
          Dashboard
        </button>
        <button className="text-white/80 hover:text-white transition-colors text-sm font-medium">
          Workouts
        </button>
        <button className="text-white/80 hover:text-white transition-colors text-sm font-medium">
          Progress
        </button>
      </nav>

      {/* Right - User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="text-white hover:bg-white/10 border border-white/20 backdrop-blur-sm px-4 py-2 rounded-xl transition-all hover:border-white/40"
          >
            <User className="w-4 h-4 mr-2" />
            {isLoggedIn ? 'Account' : 'Sign In'}
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-56 bg-white/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-xl"
        >
          {isLoggedIn ? (
            <>
              <div className="px-3 py-2 border-b border-gray-200">
                <p className="text-sm font-medium text-gray-900">John Doe</p>
                <p className="text-xs text-gray-500">john.doe@example.com</p>
              </div>
              <DropdownMenuItem className="flex items-center gap-2 text-gray-700 hover:bg-gray-100">
                <User className="w-4 h-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 text-gray-700 hover:bg-gray-100">
                <Settings className="w-4 h-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 text-gray-700 hover:bg-gray-100">
                <Activity className="w-4 h-4" />
                Activity
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setIsLoggedIn(false)}
                className="flex items-center gap-2 text-red-600 hover:bg-red-50"
              >
                <LogIn className="w-4 h-4" />
                Sign Out
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem 
                onClick={() => setIsLoggedIn(true)}
                className="flex items-center gap-2 text-gray-700 hover:bg-gray-100"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setIsLoggedIn(true)}
                className="flex items-center gap-2 text-gray-700 hover:bg-gray-100"
              >
                <UserPlus className="w-4 h-4" />
                Create Account
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="px-3 py-2">
                <p className="text-xs text-gray-500">New to FlexFit?</p>
                <p className="text-xs text-gray-400">Join thousands of users achieving their fitness goals!</p>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
} 