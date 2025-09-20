# CoastalEye - Coastal Hazard Monitoring

## Project Overview

CoastalEye is a real-time coastal hazard monitoring and reporting system designed to help keep communities safe by enabling users to report disasters and check hazard status.

## Features

- Real-time coastal hazard monitoring
- Disaster reporting system
- Interactive hazard map
- Community safety alerts

## Technologies Used

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Mapbox GL JS

## Getting Started

### Prerequisites

- Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Installation

Follow these steps:

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd gothic-hazard-map

# Step 3: Install the necessary dependencies
npm i

# Step 4: Set up Mapbox token (FREE)
# Create a .env.local file in the root directory:
echo "VITE_MAPBOX_TOKEN=your_mapbox_token_here" > .env.local

# Step 5: Start the development server
npm run dev
```

### Mapbox Token Setup (FREE)

1. **Get your FREE token:**
   - Visit [mapbox.com](https://mapbox.com)
   - Sign up for a free account
   - Go to your account dashboard
   - Copy your "Default public token"

2. **Add token to your project:**
   - Create a `.env.local` file in the project root
   - Add: `VITE_MAPBOX_TOKEN=your_actual_token_here`
   - The app will automatically use this token

**Free tier includes:** 50,000 map loads per month - perfect for development!

### Development

The development server will start on `http://localhost:8080` with hot reloading enabled.

### Building for Production

```sh
npm run build
```

### Preview Production Build

```sh
npm run preview
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn-ui components
│   ├── Hero.tsx        # Landing page hero section
│   ├── MapComponent.tsx # Interactive map component
│   ├── Navbar.tsx      # Navigation bar
│   └── Footer.tsx      # Footer component
├── pages/              # Page components
│   ├── Index.tsx       # Home page
│   ├── SubmitReport.tsx # Report submission page
│   ├── ShowReport.tsx  # Report display page
│   └── ReportResults.tsx # Report results page
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
└── assets/             # Static assets
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.