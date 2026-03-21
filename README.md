# Kanakku - UPI-Focused Expense Tracker

A modern, feature-rich expense tracking and bill-splitting Progressive Web App (PWA) designed for the Indian market with UPI integration.

## Features

- 📊 **Expense & Income Tracking** - Track daily expenses and income with categories
- 👥 **Group Expenses & Bill Splitting** - Manage shared expenses with friends and family
- 📈 **Analytics & Insights** - Visual charts and spending patterns
- 💰 **Budget Management** - Set and track budgets with notifications
- 🔔 **Real-time Notifications** - Stay updated on expenses and settlements
- 📱 **PWA Support** - Install as an app with offline capabilities
- 🌙 **Dark Mode** - Easy on the eyes theme switching
- 🇮🇳 **UPI Integration** - Designed for Indian payment methods

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- **npm** (v7 or higher) - Comes with Node.js
- **Supabase Account** - [Sign up at supabase.com](https://supabase.com)

## Installation

### 1. Clone the Repository

```sh
git clone https://github.com/Easwarp45/kanakku.git
cd kanakku
```

### 2. Install Dependencies

```sh
npm install
```

### 3. Set Up Supabase

#### Create a Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Click **New Project**
3. Fill in your project details:
   - **Name**: Choose a name (e.g., "kanakku-prod")
   - **Database Password**: Create a secure password
   - **Region**: Select closest to your location
4. Click **Create new project** and wait for setup to complete

#### Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://xtqtmcmheazewnpfftty.supabase.co`)
   - **Project ID** (found in Project URL)
   - **anon/public key** (under "Project API keys")

### 4. Configure Environment Variables

1. Copy the example environment file:

```sh
cp .env.example .env
```

2. Open `.env` in your text editor and fill in your Supabase credentials:

```env
VITE_SUPABASE_PROJECT_ID="your_project_id"
VITE_SUPABASE_URL="https://your_project_id.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your_publishable_key"
VITE_SUPABASE_ANON_KEY="your_anon_key"
```

**Important**: Never commit your `.env` file to version control. It's already listed in `.gitignore`.

### 5. Set Up Database Schema

The app requires specific database tables and policies. The schema should be automatically created when you first use the app, or you can set it up manually:

1. Go to **SQL Editor** in your Supabase dashboard
2. Run the database migrations (check the `supabase/migrations` folder if available)

### 6. (Optional) Seed Test Data

For development and testing, you can populate the database with sample data:

```sh
# See scripts/README.md for detailed instructions
# Option 1: Use SQL Editor in Supabase Dashboard (Recommended)
# Option 2: Run the TypeScript seed script
npx ts-node scripts/seed-data.ts
```

See [scripts/README.md](./scripts/README.md) for detailed seeding instructions and test user credentials.

### 7. Start the Development Server

```sh
npm run dev
```

The app will be available at `http://localhost:8080`

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 8080 with hot reload |
| `npm run build` | Build for production (optimized) |
| `npm run build:dev` | Build in development mode |
| `npm run lint` | Run ESLint to check code quality |
| `npm run preview` | Preview production build locally |

### Project Structure

```
kanakku/
├── src/
│   ├── components/     # React components (UI, auth, layout, etc.)
│   ├── pages/          # Page components (Dashboard, Expenses, Groups, etc.)
│   ├── hooks/          # Custom React hooks
│   ├── integrations/   # External service integrations (Supabase)
│   ├── types/          # TypeScript type definitions
│   ├── lib/            # Utility functions
│   └── App.tsx         # Main application component
├── public/             # Static assets (icons, manifest)
├── scripts/            # Database seeding and utility scripts
└── dist/               # Production build output
```

## How to Edit This Code

There are several ways to work with this codebase:

### Option 1: Use Lovable (Visual Development)

Visit your [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting. Changes made via Lovable will be committed automatically to this repo.

### Option 2: Local Development with Your IDE

This is the recommended approach for most developers. Follow the installation steps above, then use your preferred code editor (VS Code, WebStorm, etc.).

### Option 3: Edit Directly on GitHub

- Navigate to the desired file(s)
- Click the "Edit" button (pencil icon) at the top right
- Make your changes and commit

### Option 4: GitHub Codespaces

- Click the "Code" button on GitHub
- Select the "Codespaces" tab
- Click "New codespace" to launch a cloud development environment

## Technologies Used

This project is built with modern web technologies:

- **[Vite](https://vitejs.dev/)** - Fast build tool and dev server
- **[React 18](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Supabase](https://supabase.com/)** - Backend-as-a-Service (PostgreSQL database, auth, storage)
- **[shadcn/ui](https://ui.shadcn.com/)** - Beautifully designed components built on Radix UI
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[React Query](https://tanstack.com/query)** - Data fetching and state management
- **[React Router](https://reactrouter.com/)** - Client-side routing
- **[React Hook Form](https://react-hook-form.com/)** - Form validation with Zod
- **[Recharts](https://recharts.org/)** - Data visualization
- **[Vite PWA](https://vite-pwa-org.netlify.app/)** - Progressive Web App support

## Deployment

### Deploy to Lovable

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on **Share → Publish**.

### Deploy to Other Platforms

This is a static site that can be deployed to any hosting platform:

1. **Build for production:**
   ```sh
   npm run build
   ```

2. **Deploy the `dist` folder** to your preferred hosting:
   - [Vercel](https://vercel.com/)
   - [Netlify](https://www.netlify.com/)
   - [Cloudflare Pages](https://pages.cloudflare.com/)
   - [GitHub Pages](https://pages.github.com/)

3. **Configure environment variables** on your hosting platform with your Supabase credentials

## Additional Setup

### Receipt Storage Setup

To enable receipt upload functionality, you need to configure Supabase Storage:

1. See [RECEIPT_STORAGE_SETUP.md](./RECEIPT_STORAGE_SETUP.md) for detailed instructions
2. Create a storage bucket in Supabase
3. Configure Row Level Security (RLS) policies

### Custom Domain

To connect a custom domain to your Lovable project:

1. Navigate to **Project > Settings > Domains**
2. Click **Connect Domain**
3. Follow the DNS configuration steps

Read more: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Troubleshooting

### Development Server Won't Start

**Problem**: `npm run dev` fails or shows errors

**Solutions**:
- Ensure Node.js v16+ is installed: `node --version`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check if port 8080 is already in use
- Verify your `.env` file exists and contains valid Supabase credentials

### Supabase Connection Issues

**Problem**: "Failed to fetch" or authentication errors

**Solutions**:
- Verify your Supabase credentials in `.env`
- Check that your Supabase project is active
- Ensure your IP isn't blocked in Supabase dashboard
- Check browser console for specific error messages

### Build Fails

**Problem**: `npm run build` produces errors

**Solutions**:
- Run `npm run lint` to identify code issues
- Check TypeScript errors: `npx tsc --noEmit`
- Ensure all dependencies are installed
- Clear build cache: `rm -rf dist && npm run build`

### Database/Schema Issues

**Problem**: Tables or columns don't exist

**Solutions**:
- Check if database schema is properly set up in Supabase
- Run migrations if available
- Verify RLS policies allow access to tables
- Check Supabase logs for detailed error messages

### Test Data Not Appearing

**Problem**: After seeding, no data shows in the app

**Solutions**:
- Clear browser cache and hard refresh (Ctrl+Shift+R)
- Check Network tab in DevTools for API errors
- Verify you're logged in with the correct test user
- Check RLS policies in Supabase allow read access

## Additional Documentation

- [Test Data Seeding Guide](./scripts/README.md) - How to populate test data
- [Receipt Storage Setup](./RECEIPT_STORAGE_SETUP.md) - Configure receipt uploads
- [RLS Policy Fix](./RLS_POLICY_FIX.md) - Row Level Security troubleshooting
- [Performance Optimization](./PERFORMANCE_OPTIMIZATION.md) - Tips for better performance
- [Fix Members Display](./FIX_MEMBERS_DISPLAY.md) - Group members troubleshooting

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is private and proprietary.

## Support

For issues and questions:
- Check the troubleshooting section above
- Review the additional documentation files
- Open an issue on GitHub
- Contact the development team

---

**Built with ❤️ for managing Indian expenses efficiently**
