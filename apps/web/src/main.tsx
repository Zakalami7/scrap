import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { RootLayout } from './ui/RootLayout';
import { HomePage } from './pages/HomePage';
import { FreelancersPage } from './pages/FreelancersPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { RecommendationsPage } from './pages/RecommendationsPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'freelancers', element: <FreelancersPage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'recommendations', element: <RecommendationsPage /> }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);