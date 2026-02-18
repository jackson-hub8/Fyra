/// file: App.tsx
/// Jackson Hurley, Kaitlyn Maes, Cam Horine
/// Main app component with routing

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Home from './pages/Home';
import Calendar from './pages/calendar/Calendar';
import CreateEvent from './pages/calendar/CreateEvent';
import EditEvent from './pages/calendar/EditEvent';
import Profile from './pages/profile/Profile';
import SignupPage1 from './pages/auth/SignupPage1';
import SignupPage2 from './pages/auth/SignupPage2';
import ProfileSetup from './pages/auth/ProfileSetup';
import Terms from './pages/auth/Terms';
import UnmatchedLayout from './pages/unmatched/UnmatchedLayout';
import UnmatchedIndex from './pages/unmatched/UnmatchedIndex';
import UnmatchedSearch from './pages/unmatched/UnmatchedSearch';
import UnmatchedMatching from './pages/unmatched/UnmatchedMatching';

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
        <Route path="/calendar/new" element={<CreateEvent />} />
        <Route path="/calendar/edit/:id" element={<EditEvent />} />
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
