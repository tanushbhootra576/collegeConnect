## Campus Connect


Campus Connect is a comprehensive Next.js-based platform designed to foster collaboration and communication among students. It provides a seamless environment for discovering peers, collaborating on projects, participating in discussions, and engaging in real-time chat through public channels or direct messages. The application features an enhanced user experience with rich profiles, instant notifications, and robust moderation tools to ensure a safe and productive community.

## Features

### Core Functionality
- **User Authentication**: Secure login and signup using Firebase Authentication.
- **User Profiles**: Detailed profiles with skills, interests, social links, and direct messaging capabilities.
- **Real-Time Chat**: Support for public channels, direct messages, reactions, stickers, replies, and moderation.
- **Notifications**: Browser-level notifications for direct messages, in addition to in-app toasts.
- **User Directory**: Searchable and filterable list of users by name, branch, skills, with pagination.

### Collaboration Tools
- **Projects**: Create and manage collaborative projects, connect with team members.
- **Discussions**: Engage in threaded discussions on various topics.
- **Events**: Organize and participate in campus events.
- **Quizzes**: Take and create quizzes for educational purposes.
- **Resources**: Share and access educational resources.
- **Skills**: List and discover skills offered by users.

### Administrative Features
- **Moderation**: Built-in toxicity detection, profanity filtering, and content moderation using libraries like `leo-profanity` and `bad-words`.
- **Reports**: Report inappropriate content or users.
- **User Management**: Block users, manage user roles.
- **Statistics**: View platform statistics and analytics.
- **Debug and Testing**: API endpoints for debugging, testing, and health checks.

### Additional Capabilities
- **Screenshot Generation**: Automated screenshot capabilities using Puppeteer.
- **File Drive**: Manage files and documents.
- **Seed Data**: Populate the database with initial data.
- **Force Repair**: Administrative tools for data repair.

## Tech Stack

- **Frontend**: Next.js 16 with App Router, TypeScript, Mantine UI, React Toastify
- **Backend**: Next.js API Routes, MongoDB with Mongoose
- **Authentication**: Firebase Auth and Firebase Admin SDK
- **Real-Time Communication**: Socket.io for chat
- **Styling**: PostCSS with Mantine presets
- **Icons**: Tabler Icons, Lucide React
- **Moderation**: Leo Profanity, Bad Words libraries
- **Automation**: Puppeteer for browser automation

## Prerequisites

Before running the application, ensure you have the following installed:

- **Node.js**: Version 18 or higher
- **MongoDB**: A running MongoDB instance (local or cloud)
- **Firebase Project**: Set up a Firebase project with Authentication enabled

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/tanushbhootra576/camp.git
   cd camp
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Create a `.env.local` file in the root directory and add the following variables:
   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # MongoDB
   MONGODB_URI=mongodb://localhost:27017/campus-connect

   # Other configurations (if any)
   ```

4. **Database Setup**:
   Ensure MongoDB is running and accessible. You can seed initial data using the `/api/seed` endpoint.

## Usage

1. **Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

2. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

3. **Linting**:
   ```bash
   npm run lint
   ```

## API Endpoints

The application includes various API routes for backend functionality:

- `/api/chat`: Chat-related operations
- `/api/users`: User management
- `/api/projects`: Project collaboration
- `/api/discussions`: Discussion threads
- `/api/events`: Event management
- `/api/quizzes`: Quiz functionality
- `/api/resources`: Resource sharing
- `/api/skills`: Skill listings
- `/api/reports`: Reporting system
- `/api/moderation`: Content moderation
- `/api/stats`: Platform statistics
- `/api/health`: Health checks
- `/api/seed`: Database seeding

For detailed API documentation, refer to the individual route files in `src/app/api/`.

## Browser Notifications

To enable browser notifications for direct messages:

1. Navigate to the chat section.
2. Click the bell icon next to "Direct Messages".
3. Allow notifications in the browser prompt.
4. Receive native alerts even when the page is not active.

## Deployment

The application is optimized for deployment on Vercel:

1. Push your code to a Git repository.
2. Connect the repository to Vercel.
3. Set environment variables in Vercel dashboard.
4. Deploy automatically on push to main branch.

Ensure `npm run build` passes locally before deployment.

## Project Structure

```
camp/
├── public/                 # Static assets
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── api/            # API routes
│   │   ├── chat/           # Chat page
│   │   ├── discussions/    # Discussions page
│   │   ├── events/         # Events page
│   │   ├── login/          # Login page
│   │   ├── profile/        # Profile page
│   │   ├── projects/       # Projects page
│   │   ├── quizzes/        # Quizzes page
│   │   ├── resources/      # Resources page
│   │   ├── signup/         # Signup page
│   │   ├── skills/         # Skills page
│   │   └── users/          # Users directory
│   ├── blocklists/         # Moderation word lists
│   ├── components/         # Reusable React components
│   ├── lib/                # Utility libraries
│   ├── models/             # Mongoose models
│   └── types/              # TypeScript type definitions
├── eslint.config.mjs       # ESLint configuration
├── next.config.ts          # Next.js configuration
├── package.json            # Dependencies and scripts
├── postcss.config.mjs      # PostCSS configuration
├── tsconfig.json           # TypeScript configuration
└── vercel.json             # Vercel deployment config
```

## Contributing

We welcome contributions to Campus Connect!

1. Fork the repository.
2. Create a feature branch from `main`.
3. Make your changes and ensure `npm run lint` and `npm run build` pass.
4. Test your changes thoroughly.
5. Submit a pull request with a clear description of the changes.
6. Include screenshots or recordings for UI changes.



### ✨ Developed by Tanush Bhootra

## Acknowledgments

- Thanks to the Next.js team for the excellent framework.
- Mantine UI for beautiful and accessible components.
- Firebase for robust authentication and backend services.
- All contributors and the open-source community.
