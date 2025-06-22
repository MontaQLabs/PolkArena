# PolkaHacks - Polkadot Ecosystem Hackathons Platform

A comprehensive Next.js web application for hosting and participating in Polkadot ecosystem hackathons. Built with modern web technologies and designed for scalability, security, and user experience.

## 🚀 Features

### Core Features
- **User Authentication**: Email/password and Google OAuth integration via Supabase
- **Hackathon Management**: Create, browse, and manage hackathons
- **Team Formation**: Create teams and manage team members
- **Project Submissions**: GitHub integration and demo submissions
- **Judging System**: Private judging interface with scoring and comments
- **Prize Distribution**: Winner announcements and prize management
- **User Profiles**: Comprehensive user profiles with hackathon history

### Design Features
- **Responsive Design**: Mobile-first approach with beautiful UI
- **Custom Color Palette**: Polkadot-inspired colors with dark/light mode
- **Unbounded Font**: Modern typography for enhanced readability
- **shadcn/ui Components**: Professional, accessible UI components
- **Gradient Animations**: Smooth transitions and hover effects

## 🛠 Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI primitives
- **Authentication**: Supabase Auth with Google OAuth
- **Database**: PostgreSQL via Supabase
- **Form Handling**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Styling**: Tailwind CSS with custom color palette
- **Fonts**: Unbounded font family

## 🎨 Color Palette

The application uses a carefully selected Polkadot-inspired color palette:

### Primary Colors
- **Mirage**: `#131b25` (Dark backgrounds)
- **Polkadot Pink**: `#FF2670` (Primary brand color)
- **Bright Turquoise**: `#08ceeb` (Accent color)
- **Violet**: `#7916F3` (Secondary accent)

### Supporting Colors
- **Iron**: `#e4e6e8` (Light backgrounds)
- **Eastern Blue**: `#198a96` (Dark accent)
- **Lime**: `#E4FF07` (Highlight color)
- **Cyan**: `#07FFFF` (Additional accent)
- **Storm** series: `#DCE2E9`, `#AEB7CB`, `#6E7391` (Grays)

## 📁 Project Structure

```
polkadot-hackathons/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── auth/              # Authentication pages
│   │   ├── hackathons/        # Hackathon-related pages
│   │   ├── globals.css        # Global styles with custom colors
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Homepage
│   ├── components/            # Reusable components
│   │   ├── layout/           # Layout components (header, footer)
│   │   ├── ui/               # shadcn/ui components
│   │   └── providers.tsx     # Context providers
│   ├── contexts/             # React contexts
│   │   └── auth-context.tsx  # Authentication context
│   └── lib/                  # Utility functions and configs
│       ├── supabase.ts       # Supabase client configuration
│       ├── database.types.ts # TypeScript database types
│       └── utils.ts          # Utility functions
├── database-schema.sql        # Complete database schema
└── README.md                 # Project documentation
```

## 🗄 Database Schema

The application uses a comprehensive PostgreSQL schema with the following tables:

### Core Tables
- **users**: User profiles extending Supabase auth
- **hackathons**: Event information and metadata
- **teams**: Team management for hackathons
- **team_members**: Team membership relationships
- **submissions**: Project submissions with GitHub links
- **judges**: Judge assignments for hackathons
- **scores**: Judging scores and feedback
- **winners**: Prize winners and rankings

### Key Features
- Row Level Security (RLS) for data protection
- Automated timestamps with triggers
- Comprehensive indexes for performance
- Foreign key relationships for data integrity

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd polkadot-hackathons
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Copy the example environment file and configure your variables:
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your Supabase credentials:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up the database**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor
   - Run the SQL commands from `database-schema.sql`
   - Enable Google OAuth in Supabase Auth settings

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Supabase Setup

1. **Create a new Supabase project**
2. **Configure authentication providers**:
   - Enable email authentication
   - Configure Google OAuth (optional but recommended)
3. **Set up the database schema** using the provided SQL file
4. **Configure Row Level Security** policies as defined in the schema

### Environment Variables

Create a `.env` file in the root directory with the following variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (for admin operations) | No |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID | No |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | No |

**Note**: The application will throw an error if required environment variables are missing. Make sure to copy `env.example` to `.env` and fill in your actual values.

## 🏗 Architecture

### Authentication Flow
1. User registers/logs in via Supabase Auth
2. User profile is created/updated in the `users` table
3. JWT tokens manage session state
4. Row Level Security ensures data access control

### Data Flow
1. **Hackathons**: Host creates hackathon → Published to platform
2. **Teams**: Users create/join teams for specific hackathons
3. **Submissions**: Teams submit projects with GitHub links
4. **Judging**: Assigned judges score submissions
5. **Winners**: Results calculated and announced

### Security
- Row Level Security on all database tables
- JWT-based authentication
- Input validation with Zod schemas
- CSRF protection via Supabase

## 🎯 Usage

### For Participants
1. **Sign up** for an account
2. **Browse hackathons** on the main page
3. **Join** or **create a team** for hackathons
4. **Submit projects** with GitHub repositories
5. **Track progress** on your profile

### For Hosts
1. **Create hackathons** with details and prizes
2. **Manage** team registrations
3. **Assign judges** for evaluation
4. **Announce winners** and distribute prizes

### For Judges
1. **Access judging interface** for assigned hackathons
2. **Review submissions** and team information
3. **Score projects** with comments
4. **Submit final evaluations**

## 🔮 Future Enhancements

### Planned Features
- **Wallet Integration**: Connect Web3 wallets for prize distribution
- **On-chain Voting**: Decentralized judging mechanisms
- **NFT Certificates**: Achievement badges and certificates
- **Live Streaming**: Integrated presentation capabilities
- **Mentorship**: Connect participants with mentors
- **API Integration**: Third-party integrations (GitHub, Discord)

### Technical Improvements
- **Real-time Updates**: WebSocket integration for live updates
- **Advanced Search**: Elasticsearch for better discovery
- **File Uploads**: Direct file submissions and portfolios
- **Analytics Dashboard**: Comprehensive metrics and insights
- **Mobile App**: React Native companion app

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for details on:
- Code style and standards
- Pull request process
- Issue reporting
- Feature requests

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- **Documentation**: Check this README and inline code comments
- **Issues**: Create a GitHub issue for bugs or feature requests
- **Community**: Join our Discord server for discussions

## 🏆 Acknowledgments

- **Polkadot Foundation** for ecosystem support
- **Supabase** for backend infrastructure
- **Vercel** for deployment platform
- **shadcn/ui** for component library
- **Next.js** team for the excellent framework

---

Built with ❤️ for the Polkadot ecosystem
