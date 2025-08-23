import { jsx as _jsx } from "react/jsx-runtime";
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
        element: _jsx(RootLayout, {}),
        children: [
            { index: true, element: _jsx(HomePage, {}) },
            { path: 'freelancers', element: _jsx(FreelancersPage, {}) },
            { path: 'projects', element: _jsx(ProjectsPage, {}) },
            { path: 'recommendations', element: _jsx(RecommendationsPage, {}) }
        ]
    }
]);
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(RouterProvider, { router: router }) }));
