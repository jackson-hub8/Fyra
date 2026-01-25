/// file: App.tsx
/// Jackson Hurley, Kaitlyn Maes, Cam Horine
/// Main app component with routing

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import SignupPage1 from './pages/SignupPage1';
import SignupPage2 from './pages/SignupPage2';
import Unmatched from './pages/Unmatched';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/signup" element={<SignupPage1 />} />
        <Route path="/signup/password" element={<SignupPage2 />} />
        <Route path="/matched" element={<Home />} />
        <Route path="/unmatched" element={<Unmatched />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
