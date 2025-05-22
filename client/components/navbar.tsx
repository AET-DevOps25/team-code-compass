"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Calendar, BarChart2 } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import { cn } from "@/lib/utils"

export default function Navbar() {
  const pathname = usePathname()

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/workout-plan", label: "My Plan", icon: Calendar },
    { href: "/progress", label: "Progress", icon: BarChart2 },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-primary-foreground">F</span>
          </div>
          <span className="font-bold text-xl hidden md:inline-block">FlexFit</span>
        </div>

        <nav className="flex items-center gap-1 md:gap-6">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="hidden md:inline-block">{item.label}</span>
              </Link>
            )
          })}
          <div className="ml-2">
            <ModeToggle />
          </div>
        </nav>
      </div>
    </header>
  )
}
