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
  X,
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
    <header className="sticky top-0 z-50 w-full bg-white border-b-2 border-sui-ocean">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 flex-shrink-0">
            <div className="h-8 w-8 bg-sui-ocean flex items-center justify-center">
              <img 
                src="/logo.svg" 
                alt="Crucible" 
                className="h-5 w-5 object-contain brightness-0 invert"
              />
            </div>
            <span className="font-black text-xl text-sui-ocean uppercase tracking-tight">
              Crucible
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/hackathons"
              className="text-sui-ocean/70 hover:text-sui-ocean hover:bg-gray-100 px-4 py-2 text-sm font-bold uppercase tracking-wide transition-colors"
            >
              Hackathons
            </Link>
            <Link
              href="/events"
              className="text-sui-ocean/70 hover:text-sui-ocean hover:bg-gray-100 px-4 py-2 text-sm font-bold uppercase tracking-wide transition-colors"
            >
              Events
            </Link>
            <Link
              href="/bounties"
              className="text-sui-ocean/70 hover:text-sui-ocean hover:bg-gray-100 px-4 py-2 text-sm font-bold uppercase tracking-wide transition-colors"
            >
              Bounties
            </Link>
            <Link
              href="/leaderboard"
              className="text-sui-ocean/70 hover:text-sui-ocean hover:bg-gray-100 px-4 py-2 text-sm font-bold uppercase tracking-wide transition-colors"
            >
              Leaderboard
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-sui-ocean/70 hover:text-sui-ocean hover:bg-gray-100 px-4 py-2 text-sm font-bold uppercase tracking-wide rounded-none">
                  Tools
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-none border-2 border-sui-ocean">
                <DropdownMenuItem asChild className="font-bold uppercase text-xs tracking-wide">
                  <Link href="/tools/quiz">Quiz</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="font-bold uppercase text-xs tracking-wide">
                  <Link href="/tools/buzzer">Buzzer</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="font-bold uppercase text-xs tracking-wide">
                  <Link href="/tools/social-quest">Social Quest</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Desktop user menu */}
                <div className="hidden md:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="relative h-9 w-9 rounded-none"
                      >
                        <Avatar className="h-9 w-9 rounded-none">
                          <AvatarImage src={profile?.avatar_url || ""} />
                          <AvatarFallback className="bg-sui-sea text-white rounded-none font-bold">
                            {profile?.name?.[0]?.toUpperCase() ||
                              user.email?.[0]?.toUpperCase() ||
                              "U"}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-56 rounded-none border-2 border-sui-ocean"
                      align="end"
                      forceMount
                    >
                      <div className="flex items-center justify-start gap-2 p-2">
                        <div className="flex flex-col space-y-1 leading-none">
                          {profile?.name && (
                            <p className="font-bold uppercase text-sm">{profile.name}</p>
                          )}
                          <p className="w-[200px] truncate text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="font-bold uppercase text-xs tracking-wide">
                        <Link href="/profile">
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="font-bold uppercase text-xs tracking-wide">
                        <Link href="/hackathons/create">
                          <Plus className="mr-2 h-4 w-4" />
                          Host Hackathon
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="font-bold uppercase text-xs tracking-wide">
                        <Link href="/events/create">
                          <Calendar className="mr-2 h-4 w-4" />
                          Host Event
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="font-bold uppercase text-xs tracking-wide">
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
                  className="hidden md:inline-flex text-sui-ocean/70 hover:text-sui-ocean text-sm font-bold uppercase tracking-wide rounded-none"
                >
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button
                  asChild
                  className="hidden md:inline-flex bg-sui-ocean hover:bg-sui-sea text-white text-sm font-bold uppercase tracking-wide rounded-none px-6"
                >
                  <Link href="/auth/signup">Get Started</Link>
                </Button>

                {/* Mobile auth buttons */}
                <div className="md:hidden flex items-center gap-2">
                  <Button asChild className="bg-sui-ocean text-white text-sm font-bold uppercase rounded-none px-4">
                    <Link href="/auth/signup">Join</Link>
                  </Button>
                </div>
              </>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden h-10 w-10 p-0 rounded-none"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t-2 border-sui-ocean py-4">
            <nav className="flex flex-col">
              <Link
                href="/hackathons"
                className="text-sui-ocean font-bold uppercase tracking-wide py-3 hover:bg-gray-100 px-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Hackathons
              </Link>
              <Link
                href="/events"
                className="text-sui-ocean font-bold uppercase tracking-wide py-3 hover:bg-gray-100 px-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Events
              </Link>
              <Link
                href="/bounties"
                className="text-sui-ocean font-bold uppercase tracking-wide py-3 hover:bg-gray-100 px-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Bounties
              </Link>
              <Link
                href="/leaderboard"
                className="text-sui-ocean font-bold uppercase tracking-wide py-3 hover:bg-gray-100 px-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Leaderboard
              </Link>
              
              <div className="border-t-2 border-gray-200 mt-4 pt-4">
                <p className="text-xs text-gray-500 uppercase tracking-widest px-2 mb-2">Tools</p>
                <Link
                  href="/tools/quiz"
                  className="text-sui-ocean/70 font-bold uppercase tracking-wide py-2 hover:bg-gray-100 px-2 block"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Quiz
                </Link>
                <Link
                  href="/tools/buzzer"
                  className="text-sui-ocean/70 font-bold uppercase tracking-wide py-2 hover:bg-gray-100 px-2 block"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Buzzer
                </Link>
                <Link
                  href="/tools/social-quest"
                  className="text-sui-ocean/70 font-bold uppercase tracking-wide py-2 hover:bg-gray-100 px-2 block"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Social Quest
                </Link>
              </div>

              {user && (
                <div className="border-t-2 border-gray-200 mt-4 pt-4">
                  <Link
                    href="/profile"
                    className="text-sui-ocean font-bold uppercase tracking-wide py-3 hover:bg-gray-100 px-2 block"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    href="/hackathons/create"
                    className="text-sui-ocean font-bold uppercase tracking-wide py-3 hover:bg-gray-100 px-2 block"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Host Hackathon
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    className="text-red-600 font-bold uppercase tracking-wide py-3 hover:bg-red-50 px-2 w-full text-left"
                  >
                    Sign Out
                  </button>
                </div>
              )}

              {!user && (
                <div className="border-t-2 border-gray-200 mt-4 pt-4 flex gap-2 px-2">
                  <Button asChild variant="outline" className="flex-1 rounded-none font-bold uppercase border-2 border-sui-ocean">
                    <Link href="/auth/login">Sign In</Link>
                  </Button>
                  <Button asChild className="flex-1 rounded-none font-bold uppercase bg-sui-ocean">
                    <Link href="/auth/signup">Join</Link>
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
