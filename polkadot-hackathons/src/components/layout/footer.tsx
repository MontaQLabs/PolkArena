import Link from "next/link";
import { Github, Twitter, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and description */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="h-8 w-8 rounded-lg overflow-hidden">
                <img 
                  src="/logo.png" 
                  alt="PolkaArena Logo" 
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="font-bold text-xl text-polkadot-pink">
                PolkaArena
              </span>
            </Link>
            <p className="text-muted-foreground mb-4 max-w-md">
              The ultimate battleground for Polkadot ecosystem innovation. 
              Where warriors forge the future and legends are born in the heat of battle.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://github.com/montaqlabs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-polkadot-pink transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://x.com/montaqlabs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-polkadot-pink transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="font-semibold mb-4">Arena</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/hackathons"
                  className="hover:text-polkadot-pink transition-colors"
                >
                  ⚔️ Browse Hackathons
                </Link>
              </li>
              <li>
                <Link
                  href="/hackathons/create"
                  className="hover:text-polkadot-pink transition-colors"
                >
                  🏟️ Host a Hackathon
                </Link>
              </li>
              <li>
                <Link
                  href="/leaderboard"
                  className="hover:text-polkadot-pink transition-colors"
                >
                  🏆 Hall of Fame
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a
                  href="https://polkadot.network"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-polkadot-pink transition-colors"
                >
                  Polkadot Network
                </a>
              </li>
              <li>
                <a
                  href="https://substrate.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-polkadot-pink transition-colors"
                >
                  Substrate
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/40 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © 2025 MontaQ Labs. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground flex items-center mt-4 sm:mt-0">
            Forged with <Heart className="h-4 w-4 mx-1 text-polkadot-pink" /> for
            the warrior spirit
          </p>
        </div>
      </div>
    </footer>
  );
}
