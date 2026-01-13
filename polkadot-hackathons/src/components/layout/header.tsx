"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Menu,
  User,
  Plus,
  Calendar,
  Trophy,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";

export function Header() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-sui-sea/10 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80">
      <div className="container mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-18 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0 group">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-sui-sea to-walrus-teal p-0.5 transition-transform group-hover:scale-105">
              <div className="h-full w-full bg-white rounded-lg flex items-center justify-center">
                <img 
                  src="/logo.svg" 
                  alt="Crucible Logo" 
                  className="h-5 w-5 sm:h-6 sm:w-6 object-contain"
                  style={{ filter: 'brightness(0) saturate(100%) invert(48%) sepia(79%) saturate(2476%) hue-rotate(186deg) brightness(118%) contrast(119%)' }}
                />
              </div>
            </div>
            <span className="font-bold text-lg sm:text-xl bg-gradient-to-r from-sui-sea to-walrus-teal bg-clip-text text-transparent">
              Crucible
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8 ml-8 lg:ml-12">
            <Link
              href="/hackathons"
                className="text-sui-ocean/70 hover:text-sui-sea hover:bg-sui-sea/5 transition-all px-3 py-2 rounded-lg font-medium whitespace-nowrap"
            >
                Hackathons
            </Link>
            <Link
              href="/leaderboard"
              className="text-sui-ocean/70 hover:text-sui-sea hover:bg-sui-sea/5 transition-all px-3 py-2 rounded-lg font-medium whitespace-nowrap"
            >
              Leaderboard
            </Link>
            <Link
              href="/events"
              className="text-sui-ocean/70 hover:text-sui-sea hover:bg-sui-sea/5 transition-all px-3 py-2 rounded-lg font-medium whitespace-nowrap"
            >
              Events
            </Link>
            <Link
              href="/bounties"
              className="text-sui-ocean/70 hover:text-sui-sea hover:bg-sui-sea/5 transition-all px-3 py-2 rounded-lg font-medium whitespace-nowrap"
            >
              Bounties
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-sui-ocean/70 hover:text-sui-sea hover:bg-sui-sea/5 transition-all px-3 py-2 rounded-lg font-medium">
                  Tools
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <Link href="/tools/quiz">
                    Quiz
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/tools/buzzer">
                    Buzzer
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/tools/social-quest">
                    Social Quest
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* {user && (
              <Link
                href="/hackathons/create"
                className="text-foreground/80 hover:text-crucible-orange transition-colors font-medium"
              >
                Host Event
              </Link>
            )} */}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">

            {user ? (
              <>
                {/* Desktop user menu */}
                <div className="hidden md:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="relative h-9 w-9 rounded-full"
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={profile?.avatar_url || ""} />
                          <AvatarFallback className="bg-sui-sea text-white">
                            {profile?.name?.[0]?.toUpperCase() ||
                              user.email?.[0]?.toUpperCase() ||
                              "U"}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-56"
                      align="end"
                      forceMount
                    >
                      <div className="flex items-center justify-start gap-2 p-2">
                        <div className="flex flex-col space-y-1 leading-none">
                          {profile?.name && (
                            <p className="font-medium">{profile.name}</p>
                          )}
                          <p className="w-[200px] truncate text-sm text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/profile">
                          <User className="mr-2 h-4 w-4" />
                          ⚔️ Warrior Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/hackathons/create">
                          <Plus className="mr-2 h-4 w-4" />
                          🏟️ Host Hackathon
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/events/create">
                          <Calendar className="mr-2 h-4 w-4" />
                          📅 Host Event
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  className="hidden md:inline-flex text-sui-ocean/70 hover:text-sui-sea hover:bg-sui-sea/5"
                >
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button
                  asChild
                  className="hidden md:inline-flex bg-gradient-to-r from-sui-sea to-walrus-teal hover:from-sui-ocean hover:to-sui-sea text-white rounded-xl"
                >
                  <Link href="/auth/signup">Get Started</Link>
                </Button>

                {/* Mobile auth buttons */}
                <div className="md:hidden flex items-center space-x-1">
                  <Button asChild variant="ghost" size="sm" className="text-xs px-2">
                    <Link href="/auth/login">Enter</Link>
                  </Button>
                  <Button asChild size="sm" className="bg-sui-sea hover:bg-sui-sea/90 text-xs px-2">
                    <Link href="/auth/signup">Join</Link>
                  </Button>
                </div>
              </>
            )}

            {/* Mobile menu button - ALWAYS visible */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden h-8 w-8 px-0"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border/40 py-4">
            <nav className="flex flex-col space-y-1">
              {/* Navigation Links */}
              <Link
                href="/hackathons"
                className="flex items-center space-x-3 text-foreground/80 hover:text-sui-sea hover:bg-muted transition-colors py-3 px-2 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                <Calendar className="h-4 w-4" />
                <span>Hackathons</span>
              </Link>
              <Link
                href="/leaderboard"
                className="flex items-center space-x-3 text-foreground/80 hover:text-sui-sea hover:bg-muted transition-colors py-3 px-2 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                <Trophy className="h-4 w-4" />
                <span>Leaderboard</span>
              </Link>
              <Link
                href="/events"
                className="flex items-center space-x-3 text-foreground/80 hover:text-sui-sea hover:bg-muted transition-colors py-3 px-2 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                <Calendar className="h-4 w-4" />
                <span>Events</span>
              </Link>
              <div className="border-t border-border/40 my-2 pt-2">
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Tools
                </div>
                <Link
                  href="/tools/quiz"
                  className="flex items-center space-x-3 text-foreground/80 hover:text-sui-sea hover:bg-muted transition-colors py-3 px-2 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Calendar className="h-4 w-4" />
                  <span>Quiz</span>
                </Link>
                <Link
                  href="/tools/buzzer"
                  className="flex items-center space-x-3 text-foreground/80 hover:text-sui-sea hover:bg-muted transition-colors py-3 px-2 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Calendar className="h-4 w-4" />
                  <span>Buzzer</span>
                </Link>
                <Link
                  href="/tools/social-quest"
                  className="flex items-center space-x-3 text-foreground/80 hover:text-sui-sea hover:bg-muted transition-colors py-3 px-2 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Calendar className="h-4 w-4" />
                  <span>Social Quest</span>
                </Link>
                <Link
                  href="/bounties"
                  className="flex items-center space-x-3 text-foreground/80 hover:text-sui-sea hover:bg-muted transition-colors py-3 px-2 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Calendar className="h-4 w-4" />
                  <span>Bounties</span>
                </Link>
              </div>

              {/* User-specific actions */}
              {user && (
                <>
                  <div className="border-t border-border/40 my-2 pt-2">
                    <div className="flex items-center space-x-3 py-2 px-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={profile?.avatar_url || ""} />
                        <AvatarFallback className="bg-sui-sea text-white text-xs">
                          {profile?.name?.[0]?.toUpperCase() ||
                            user.email?.[0]?.toUpperCase() ||
                            "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{profile?.name || "User"}</span>
                        <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Link
                    href="/profile"
                    className="flex items-center space-x-3 text-foreground/80 hover:text-sui-sea hover:bg-muted transition-colors py-3 px-2 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    <span>👤 Developer Profile</span>
                  </Link>
                  
                  <Link
                    href="/hackathons/create"
                    className="flex items-center space-x-3 text-foreground/80 hover:text-sui-sea hover:bg-muted transition-colors py-3 px-2 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Plus className="h-4 w-4" />
                    <span>🏆 Host Hackathon</span>
                  </Link>
                  
                  <Link
                    href="/events/create"
                    className="flex items-center space-x-3 text-foreground/80 hover:text-sui-sea hover:bg-muted transition-colors py-3 px-2 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Calendar className="h-4 w-4" />
                    <span>📅 Host Event</span>
                  </Link>
                </>
              )}


              {/* Authentication actions */}
              {user ? (
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                  className="flex items-center space-x-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 transition-colors py-3 px-2 rounded-md text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>🚪 Sign Out</span>
                  </button>
              ) : (
                <div className="border-t border-border/40 my-2 pt-2 space-y-1">
                  <Link
                    href="/auth/login"
                    className="flex items-center space-x-3 text-foreground/80 hover:text-sui-sea hover:bg-muted transition-colors py-3 px-2 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    <span>🚀 Get Started</span>
                  </Link>
                <Link
                  href="/auth/signup"
                    className="flex items-center space-x-3 text-sui-sea hover:text-sui-sea/80 hover:bg-sui-sea/10 transition-colors py-3 px-2 rounded-md font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Plus className="h-4 w-4" />
                  <span>👥 Join Community</span>
                </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
