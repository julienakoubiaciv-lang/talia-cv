import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme.jsx';
import Home from './pages/Home.jsx';
import Generate from './pages/Generate.jsx';
import Editor from './pages/Editor.jsx';
import Bulk from './pages/Bulk.jsx';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/generate" element={<Generate />} />
          <Route path="/bulk" element={<Bulk />} />
          <Route path="/editor" element={<Editor />} />
          <Route path="/editor/:id" element={<Editor />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
