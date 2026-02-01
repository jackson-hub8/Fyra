/// file: App.tsx
/// Jackson Hurley, Kaitlyn Maes, Cam Horine
/// Main app component with routing

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Calendar from './pages/Calendar';
import Profile from './pages/Profile';
import SignupPage1 from './pages/SignupPage1';
import SignupPage2 from './pages/SignupPage2';
import ProfileSetup from './pages/ProfileSetup';
import Terms from './pages/Terms';
import UnmatchedLayout from './pages/UnmatchedLayout';
import UnmatchedIndex from './pages/UnmatchedIndex';
import UnmatchedSearch from './pages/UnmatchedSearch';
import UnmatchedMatching from './pages/UnmatchedMatching';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/signup" element={<SignupPage1 />} />
        <Route path="/signup/password" element={<SignupPage2 />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/profile-setup" element={<ProfileSetup />} />
        <Route path="/matched" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/unmatched" element={<UnmatchedLayout />}>
          <Route index element={<UnmatchedIndex />} />
          <Route path="search" element={<UnmatchedSearch />} />
          <Route path="matching" element={<UnmatchedMatching />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
