import Link from "next/link";
import { Github, Twitter, ArrowUpRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-sui-ocean border-t-4 border-sui-sea">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-sui-sea flex items-center justify-center">
                <img 
                  src="/logo.svg" 
                  alt="Crucible" 
                  className="h-6 w-6 object-contain brightness-0 invert"
                />
              </div>
              <span className="font-black text-2xl text-white uppercase tracking-tight">
                Crucible
              </span>
            </Link>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs mb-6">
              The hackathon platform for Sui builders.
            </p>
            <div className="flex gap-2">
              <a
                href="https://github.com/montaqlabs"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 hover:bg-sui-sea text-white flex items-center justify-center transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://x.com/montaqlabs"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 hover:bg-sui-sea text-white flex items-center justify-center transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="font-black text-white text-sm uppercase tracking-widest mb-6">Platform</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/hackathons" className="text-white/60 hover:text-white text-sm uppercase tracking-wide transition-colors flex items-center gap-1 group">
                  Hackathons
                  <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link href="/events" className="text-white/60 hover:text-white text-sm uppercase tracking-wide transition-colors flex items-center gap-1 group">
                  Events
                  <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link href="/bounties" className="text-white/60 hover:text-white text-sm uppercase tracking-wide transition-colors flex items-center gap-1 group">
                  Bounties
                  <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link href="/leaderboard" className="text-white/60 hover:text-white text-sm uppercase tracking-wide transition-colors flex items-center gap-1 group">
                  Leaderboard
                  <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Tools */}
          <div>
            <h3 className="font-black text-white text-sm uppercase tracking-widest mb-6">Tools</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/tools/quiz" className="text-white/60 hover:text-white text-sm uppercase tracking-wide transition-colors">
                  Quiz
                </Link>
              </li>
              <li>
                <Link href="/tools/buzzer" className="text-white/60 hover:text-white text-sm uppercase tracking-wide transition-colors">
                  Buzzer
                </Link>
              </li>
              <li>
                <Link href="/tools/social-quest" className="text-white/60 hover:text-white text-sm uppercase tracking-wide transition-colors">
                  Social Quest
                </Link>
              </li>
            </ul>
          </div>

          {/* Ecosystem */}
          <div>
            <h3 className="font-black text-white text-sm uppercase tracking-widest mb-6">Ecosystem</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://sui.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sui-sea hover:text-white text-sm uppercase tracking-wide transition-colors flex items-center gap-1"
                >
                  Sui Network
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://walrus.xyz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-walrus-teal hover:text-white text-sm uppercase tracking-wide transition-colors flex items-center gap-1"
                >
                  Walrus
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="border-t-2 border-white/10 mt-16 pt-8">
          <p className="text-xs text-white/40 uppercase tracking-widest mb-4 text-center">Tech Stack</p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <span className="px-3 py-1 bg-white/5 text-sui-sea text-xs font-bold uppercase tracking-widest">
              Sui Smart Contracts
            </span>
            <span className="px-3 py-1 bg-white/5 text-walrus-teal text-xs font-bold uppercase tracking-widest">
              Walrus Storage
            </span>
            <span className="px-3 py-1 bg-white/5 text-white text-xs font-bold uppercase tracking-widest">
              Seal Encryption
            </span>
            <span className="px-3 py-1 bg-white/5 text-sui-sea text-xs font-bold uppercase tracking-widest">
              ZkLogin
            </span>
            <span className="px-3 py-1 bg-white/5 text-walrus-teal text-xs font-bold uppercase tracking-widest">
              NFT Ticketing
            </span>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t-2 border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-white/30 uppercase tracking-widest">
            © 2025 MontaQ Labs
          </p>
          <p className="text-sm text-white/30 uppercase tracking-widest">
            Built for <span className="text-sui-sea font-bold">SUI</span> · Powered by <span className="text-walrus-teal font-bold">WALRUS</span> · Secured by <span className="text-white font-bold">SEAL</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
