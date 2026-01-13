import Link from "next/link";
import { Github, Twitter, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-sui-sea/10 bg-gradient-to-b from-white to-sui-aqua/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and description */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4 group">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sui-sea to-walrus-teal p-0.5 transition-transform group-hover:scale-105">
                <div className="h-full w-full bg-white rounded-lg flex items-center justify-center">
                  <img 
                    src="/logo.svg" 
                    alt="Crucible Logo" 
                    className="h-6 w-6 object-contain"
                    style={{ filter: 'brightness(0) saturate(100%) invert(48%) sepia(79%) saturate(2476%) hue-rotate(186deg) brightness(118%) contrast(119%)' }}
                  />
                </div>
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-sui-sea to-walrus-teal bg-clip-text text-transparent">
                Crucible
              </span>
            </Link>
            <p className="text-sui-ocean/60 mb-4 max-w-md leading-relaxed">
              The premier platform for Sui and Walrus ecosystem innovation. 
              Where developers build the future of decentralized storage.
            </p>
            <div className="flex space-x-3">
              <a
                href="https://github.com/montaqlabs"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-sui-sea/10 hover:bg-sui-sea text-sui-ocean/60 hover:text-white flex items-center justify-center transition-all"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="https://x.com/montaqlabs"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-sui-sea/10 hover:bg-sui-sea text-sui-ocean/60 hover:text-white flex items-center justify-center transition-all"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="font-bold text-sui-ocean mb-4">Platform</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/hackathons"
                  className="text-sui-ocean/60 hover:text-sui-sea transition-colors"
                >
                  Hackathons
                </Link>
              </li>
              <li>
                <Link
                  href="/hackathons/create"
                  className="text-sui-ocean/60 hover:text-sui-sea transition-colors"
                >
                  Host Event
                </Link>
              </li>
              <li>
                <Link
                  href="/leaderboard"
                  className="text-sui-ocean/60 hover:text-sui-sea transition-colors"
                >
                  Leaderboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-bold text-sui-ocean mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
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

        <div className="border-t border-sui-sea/10 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-sui-ocean/50">
            © 2025 MontaQ Labs. All rights reserved.
          </p>
          <p className="text-sm text-sui-ocean/50 flex items-center gap-1 mt-4 sm:mt-0">
            Built with <Heart className="h-3.5 w-3.5 text-sui-sea fill-sui-sea" /> for the Sui & Walrus community
          </p>
        </div>
      </div>
    </footer>
  );
}
