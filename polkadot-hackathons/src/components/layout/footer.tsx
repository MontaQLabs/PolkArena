import Link from "next/link";
import { Github, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="h-9 w-9 rounded-xl bg-sui-ocean flex items-center justify-center">
                <img 
                  src="/logo.svg" 
                  alt="Crucible" 
                  className="h-5 w-5 object-contain brightness-0 invert"
                />
              </div>
              <span className="font-bold text-xl text-sui-ocean">
                Crucible
              </span>
            </Link>
            <p className="text-sui-ocean/50 text-sm leading-relaxed max-w-xs mb-6">
              The hackathon platform for Sui builders.
              <br />
              <span className="text-walrus-teal">Powered by Walrus.</span>
            </p>
            <div className="flex gap-3">
              <a
                href="https://github.com/montaqlabs"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-sui-ocean text-sui-ocean/60 hover:text-white flex items-center justify-center transition-all"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="https://x.com/montaqlabs"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-sui-ocean text-sui-ocean/60 hover:text-white flex items-center justify-center transition-all"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="font-semibold text-sui-ocean text-sm mb-4">Platform</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/hackathons" className="text-sui-ocean/60 hover:text-sui-ocean transition-colors">
                  Hackathons
                </Link>
              </li>
              <li>
                <Link href="/events" className="text-sui-ocean/60 hover:text-sui-ocean transition-colors">
                  Events
                </Link>
              </li>
              <li>
                <Link href="/bounties" className="text-sui-ocean/60 hover:text-sui-ocean transition-colors">
                  Bounties
                </Link>
              </li>
              <li>
                <Link href="/leaderboard" className="text-sui-ocean/60 hover:text-sui-ocean transition-colors">
                  Leaderboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Tools */}
          <div>
            <h3 className="font-semibold text-sui-ocean text-sm mb-4">Tools</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/tools/quiz" className="text-sui-ocean/60 hover:text-sui-ocean transition-colors">
                  Quiz
                </Link>
              </li>
              <li>
                <Link href="/tools/buzzer" className="text-sui-ocean/60 hover:text-sui-ocean transition-colors">
                  Buzzer
                </Link>
              </li>
              <li>
                <Link href="/tools/social-quest" className="text-sui-ocean/60 hover:text-sui-ocean transition-colors">
                  Social Quest
                </Link>
              </li>
            </ul>
          </div>

          {/* Ecosystem */}
          <div>
            <h3 className="font-semibold text-sui-ocean text-sm mb-4">Ecosystem</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="https://sui.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sui-ocean/60 hover:text-sui-sea transition-colors"
                >
                  Sui Network
                </a>
              </li>
              <li>
                <a
                  href="https://walrus.xyz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sui-ocean/60 hover:text-walrus-teal transition-colors"
                >
                  Walrus Protocol
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-sui-ocean/40">
            © 2025 MontaQ Labs
          </p>
          <p className="text-sm text-sui-ocean/40">
            Built for <span className="text-sui-sea">Sui</span> · Powered by <span className="text-walrus-teal">Walrus</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
