import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import store from './store';
import { fetchCurrentUser } from './store/slices/authSlice';
import { SocketProvider } from './context/SocketContext';

import Landing        from './pages/Landing';
import Login          from './pages/Login';
import { Register }   from './pages/Login';
import Explore        from './pages/Explore';
import EventDetails   from './pages/EventDetails';
import UserDashboard  from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProfilePage    from './pages/ProfilePage';

import {
  Leaderboard, Certificates, VerifyCertificate,
  ChatPage, GoogleAuthSuccess,
  EditEvent, OrganizerDashboard, TeamPage,
} from './pages/allPages';

import { Footer, ProtectedRoute, LoadingScreen } from './components/common/index';
import Navbar from './components/common/Navbar';
import WebGLBackground from './components/common/WebGLBackground';
import CreateEvent from './pages/CreateEvent';
import NotFound from './pages/NotFound';

import './index.css';

const RootRedirect = () => {
  const { isAuthenticated, initializing, token } = useSelector(s => s.auth);
  if (initializing && token) return <LoadingScreen/>;
  if (isAuthenticated) return <Navigate to="/dashboard" replace/>;
  return <Landing/>;
};

const AppContent = () => {
  const dispatch = useDispatch();
  const { token, initializing } = useSelector(s => s.auth);

  useEffect(() => {
    // Force light theme
    document.documentElement.style.setProperty('color-scheme', 'light');
    document.body.style.background = '#F4F4FF';
    document.body.style.color = '#111827';
  }, []);

  useEffect(() => {
    if (token) dispatch(fetchCurrentUser());
    else dispatch({ type: 'auth/fetchCurrentUser/rejected' });
  }, [dispatch, token]);

  if (initializing && token) return <LoadingScreen/>;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F4F4FF', position: 'relative' }}>
      <WebGLBackground intensity={0.55}/>
      <Navbar/>
      <main style={{ flex: 1, position: 'relative', zIndex: 1, paddingTop: 60 }}>
        <Routes>
          <Route path="/"                       element={<RootRedirect/>}/>
          <Route path="/login"                  element={<Login/>}/>
          <Route path="/register"               element={<Register/>}/>
          <Route path="/explore"                element={<Explore/>}/>
          <Route path="/events/:slug"           element={<EventDetails/>}/>
          <Route path="/leaderboard"            element={<Leaderboard/>}/>
          <Route path="/verify-certificate/:id" element={<VerifyCertificate/>}/>
          <Route path="/auth/google/success"    element={<GoogleAuthSuccess/>}/>
          <Route path="/user/:id"               element={<ProfilePage/>}/>
          <Route path="/dashboard"    element={<ProtectedRoute><UserDashboard/></ProtectedRoute>}/>
          <Route path="/profile"      element={<ProtectedRoute><ProfilePage/></ProtectedRoute>}/>
          <Route path="/certificates" element={<ProtectedRoute><Certificates/></ProtectedRoute>}/>
          <Route path="/chat"         element={<ProtectedRoute><ChatPage/></ProtectedRoute>}/>
          <Route path="/chat/:chatId" element={<ProtectedRoute><ChatPage/></ProtectedRoute>}/>
          <Route path="/teams/:teamId"   element={<TeamPage/>}/>
          <Route path="/organizer"       element={<ProtectedRoute allowedRoles={['organizer','admin']}><OrganizerDashboard/></ProtectedRoute>}/>
          <Route path="/events/create"   element={<ProtectedRoute allowedRoles={['organizer','admin']}><CreateEvent/></ProtectedRoute>}/>
          <Route path="/events/:id/edit" element={<ProtectedRoute allowedRoles={['organizer','admin']}><EditEvent/></ProtectedRoute>}/>
          <Route path="/admin"           element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard/></ProtectedRoute>}/>
          <Route path="*" element={<NotFound/>}/>
        </Routes>
      </main>
      <Footer/>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#fff',
            color: '#111827',
            border: '1px solid rgba(91,110,245,0.18)',
            borderRadius: '14px',
            fontSize: '13px',
            fontWeight: 500,
            padding: '12px 18px',
            boxShadow: '0 8px 28px rgba(91,110,245,0.14)',
          },
          success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
        }}
      />
    </div>
  );
};

const App = () => (
  <Provider store={store}>
    <SocketProvider>
      <Router>
        <AppContent/>
      </Router>
    </SocketProvider>
  </Provider>
);

export default App;
