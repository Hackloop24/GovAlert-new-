import React from 'react';
import Home from './Pages/Home';
// import Signin from './Pages/Signin';
import Signup from './Pages/Signup';
import Signin from './Pages/Signin';
import Submain from './Pages/Submain';
import Track from './Pages/Track';
import Report from './Pages/Report';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home2 from './Pages/Home2';
import Fund from './Pages/Fund';
import Admin from './Pages/Admin';
import MapView from './Pages/MapView';
import Responses from './Pages/Responses';
import VerifyEmail from './Pages/VerifyEmail';
import { ToastProvider } from './components/Toaster';
function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/report" element={<Report />} />
        <Route path="/login" element={<Signin />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/submain" element={<Submain />} />
        <Route path="/track" element={<Track />} />
        <Route path="/home" element={<Home />} />
        <Route path="/homeIn" element={<Home2 />} />
        <Route path="/fund" element={<Fund/>} />
        <Route path="/transparency" element={<Fund />} />
        <Route path="/map" element={<MapView />} />
        <Route path="/responses" element={<Responses />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
