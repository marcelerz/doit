# Doit - Simple Todo App

A beautiful and simple todo application built with Next.js, TypeScript, and Tailwind CSS. Features local storage persistence and a mobile-responsive design.

## Features

- ✅ Add, edit, and delete tasks
- ✅ Mark tasks as complete/incomplete
- ✅ Persistent storage using localStorage
- ✅ Mobile-responsive design
- ✅ Dark mode support
- ✅ Clean and modern UI with Tailwind CSS

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

## Project Structure

```
doit/
├── src/
│   ├── app/
│   │   ├── layout.tsx       # Root layout with metadata
│   │   ├── page.tsx         # Main page component
│   │   └── globals.css      # Global styles
│   ├── components/
│   │   ├── TodoList.tsx     # Main todo list component
│   │   └── TodoItem.tsx     # Individual todo item component
│   ├── hooks/
│   │   └── useTodos.ts      # Custom hook for todo management
│   └── types/
│       └── todo.ts          # TypeScript type definitions
├── public/                  # Static assets
└── package.json
```

## Technologies Used

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS 4** - Utility-first CSS framework
- **React 19** - UI library
- **localStorage** - Client-side data persistence

## Features in Detail

### Todo Management

- Create new todos with a simple input form
- Edit existing todos inline
- Delete unwanted todos
- Toggle completion status with a checkbox

### Responsive Design

- Full-page layout optimized for both desktop and mobile
- Touch-friendly UI elements
- Adaptive spacing and sizing

### Data Persistence

- All todos are automatically saved to localStorage
- Data persists across browser sessions
- No backend required

## Build for Production

Create an optimized production build:

```bash
npm run build
npm start
```

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
