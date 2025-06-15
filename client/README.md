# FlexFit - Personal Fitness Assistant

A responsive web application built with React, TypeScript, and Vite, featuring an interactive calendar, user preferences panel, and LLM chat interface for fitness guidance.

## Features

- **Top Navigation**: Brand logo and user authentication dropdown
- **Interactive Calendar**: View and manage workout schedules with expandable exercise details
- **User Preferences Panel**: Customizable fitness goals, experience levels, and equipment preferences
- **LLM Chat Interface**: AI-powered fitness assistant for personalized guidance
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Icons**: Lucide React
- **State Management**: React hooks
- **Data Fetching**: TanStack Query (React Query)

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository and navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and visit `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
client/
├── src/
│   ├── components/
│   │   ├── ui/           # shadcn/ui components
│   │   ├── CalendarSidebar.tsx
│   │   ├── TopNavigation.tsx
│   │   ├── UserPreferencesPanel.tsx
│   │   └── LLMChatPanel.tsx
│   ├── types/
│   │   └── index.ts      # TypeScript type definitions
│   ├── lib/
│   │   └── utils.ts      # Utility functions
│   ├── App.tsx           # Main application component
│   ├── App.css           # Global styles
│   └── main.tsx          # Application entry point
├── public/               # Static assets
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── tailwind.config.js   # Tailwind CSS configuration
├── tsconfig.json        # TypeScript configuration
└── vite.config.ts       # Vite configuration
```

## Data Model

The application uses TypeScript enums and interfaces based on the fitness domain:

### Core Enums
- `Gender`: User gender options
- `ExperienceLevel`: Fitness experience levels
- `FitnessGoal`: Available fitness objectives
- `SportType`: Types of workout activities
- `EquipmentItem`: Available exercise equipment
- `IntensityPreference`: Workout intensity levels

### Main Entities
- `User`: User profile information
- `UserPreferences`: Customizable fitness preferences
- `DailyWorkout`: Daily workout schedule
- `ScheduledExercise`: Individual exercises within workouts

## Component Overview

### TopNavigation
- FlexFit branding with logo
- User authentication dropdown (Login/Register)
- Responsive design with backdrop blur effect

### CalendarSidebar
- Interactive monthly calendar grid
- Visual workout indicators
- Expandable exercise details on date click
- Mock workout data with exercise information

### UserPreferencesPanel
- User profile display with avatar
- Editable fitness preferences
- Experience level selection
- Multi-select fitness goals and sport types
- Intensity and duration preferences
- Toggle edit mode for preference updates

### LLMChatPanel
- Real-time chat interface with AI assistant
- Message history with timestamps
- Typing indicators and loading states
- Mock AI responses for fitness-related queries
- Responsive chat bubbles and scrollable history

## Responsive Design

The application is fully responsive and includes:
- Mobile-first approach
- Flexible grid layouts
- Collapsible panels on smaller screens
- Touch-friendly interface elements
- Optimized typography and spacing

## Customization

### Styling
- Modify `tailwind.config.js` for custom colors and themes
- Update CSS variables in `App.css` for design system changes
- shadcn/ui components can be customized via className props

### Data Integration
- Replace mock data in components with actual API calls
- Update type definitions in `src/types/index.ts`
- Implement backend integration using TanStack Query

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or support, please open an issue in the repository or contact the development team. 