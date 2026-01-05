import React, { useState, useEffect } from 'react';
import { Container, Navbar, Nav, Button, Spinner, Alert, Form, Dropdown, Image } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { FaYoutube, FaDownload, FaSearch, FaPlay, FaUser, FaGithub, FaVideo, FaHeadphones, FaGlobe, FaVk, FaSignOutAlt, FaHistory } from 'react-icons/fa';
import axios from 'axios';
import './index.css';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import { getAuth, signOut } from 'firebase/auth';

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState(null);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [serverStatus, setServerStatus] = useState(null); // { type, text }
  const [updatingServer, setUpdatingServer] = useState(false);

  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedAudio, setSelectedAudio] = useState(null);

  const [showAuth, setShowAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    // URL Params
    const params = new URLSearchParams(window.location.search);
    const queryUrl = params.get('url');
    if (queryUrl) {
      setUrl(queryUrl);
      fetchVideoInfo(null, queryUrl);
    }

    // Load History
    const savedHistory = localStorage.getItem('neo_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const fetchVideoInfo = async (e, overrideUrl) => {
    if (e) e.preventDefault();
    const targetUrl = overrideUrl || url;
    if (!targetUrl) return;

    setLoading(true);
    setError(null);
    setVideoInfo(null);
    setSelectedVideo(null);
    setSelectedAudio(null);

    try {
      // Use prod URL as default or env var
      const API_BASE = import.meta.env.VITE_API_URL || 'https://neo-downloader-backend.onrender.com';
      const res = await axios.post(`${API_BASE}/api/info`, { url: targetUrl });
      const data = res.data;

      const videoFormats = data.formats.filter(f => f.isVideo).sort((a, b) => (b.height || 0) - (a.height || 0));
      const audioFormats = data.formats.filter(f => f.isAudio && f.vcodec === 'none').sort((a, b) => (b.filesize || 0) - (a.filesize || 0));

      setVideoInfo({ ...data, videoFormats, audioFormats });
      if (audioFormats.length > 0) setSelectedAudio(audioFormats[0].format_id);

    } catch (err) {
      console.error(err);
      // Show specific error from backend if available (e.g. "Sign in to confirm")
      const backendError = err.response?.data?.details || err.response?.data?.error;
      setError(backendError || 'Failed to fetch video information.');
      setVideoInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!selectedVideo) return;
    setDownloading(true);

    // Save to History
    const newEntry = {
      title: videoInfo.title,
      thumbnail: videoInfo.thumbnail,
      quality: `${selectedVideo.height}p`,
      date: new Date().toLocaleDateString(),
      url: url
    };

    const updatedHistory = [newEntry, ...history].slice(0, 50); // Keep last 50
    setHistory(updatedHistory);
    localStorage.setItem('neo_history', JSON.stringify(updatedHistory));

    const ext = (selectedVideo && selectedAudio) ? 'mkv' : (selectedVideo.ext || 'mp4');
    const API_BASE = import.meta.env.VITE_API_URL || 'https://neo-downloader-backend.onrender.com';
    let downloadUrl = `${API_BASE}/api/download?url=${encodeURIComponent(url)}&video_id=${selectedVideo.format_id}&ext=${ext}&title=${encodeURIComponent(videoInfo.title)}`;
    if (selectedAudio) downloadUrl += `&audio_id=${selectedAudio}`;
    window.location.href = downloadUrl;
    setTimeout(() => setDownloading(false), 3000);
  };

  const handleLogout = () => {
    if (!getAuth()) return;
    signOut(getAuth()).then(() => {
      setUser(null);
    });
  };

  const pingServer = async () => {
    setServerStatus({ type: 'info', text: 'Pinging...' });
    const start = Date.now();
    try {
      // Use relative path to leverage Vercel Proxy (bypasses CORS)
      // Local dev needs vite.config.js proxy or fallback
      const API_BASE = import.meta.env.VITE_API_URL || '';
      console.log("Pinging API:", API_BASE || '/api (relative)');

      await axios.get(`${API_BASE}/api/health`);
      const latency = Date.now() - start;
      setServerStatus({ type: 'success', text: `Connected via Proxy (${latency}ms)` });

      // Auto-clear after 3s
      setTimeout(() => setServerStatus(null), 5000);
    } catch (err) {
      console.error("Ping Failed:", err);
      // Fallback to direct connection if proxy fails
      try {
        const DIRECT_URL = 'https://neo-downloader-backend.onrender.com';
        await axios.get(`${DIRECT_URL}/api/health`);
        setServerStatus({ type: 'success', text: 'Connected Direct' });
      } catch (e) {
        setServerStatus({ type: 'danger', text: 'Server Offline' });
      }
    }
  };

  const updateServer = async () => {
    setUpdatingServer(true);
    setServerStatus({ type: 'warning', text: 'Updating Backend Engine...' });
    try {
      // Try relative first (Proxy)
      const API_BASE = import.meta.env.VITE_API_URL || '';
      await axios.post(`${API_BASE}/api/update`);
      setServerStatus({ type: 'success', text: 'Update Complete!' });
    } catch (err) {
      // Retry Direct
      try {
        await axios.post('https://neo-downloader-backend.onrender.com/api/update');
        setServerStatus({ type: 'success', text: 'Update Complete (Direct)!' });
      } catch (e) {
        setServerStatus({ type: 'danger', text: 'Update Failed' });
      }
    } finally {
      setUpdatingServer(false);
    }
  };

  return (
    <div className="app-container">
      <Navbar expand="lg" variant="dark" className="glass-panel mb-4 mx-3 mt-3 px-4 sticky-top">
        <Navbar.Brand href="#">
          <FaVideo className="me-2 text-neon-blue" size={28} />
          <span className="fw-bold tracking-wide">NeoDownloader</span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
          <Nav className="align-items-center gap-3">
            <span className="text-secondary small d-none d-md-block">Created by <span className="text-neon-green fw-bold">Dharaneesh20</span></span>
            <a href="https://github.com/Dharaneesh20" target="_blank" className="text-white hover-scale"><FaGithub size={24} /></a>
            {user ? (
              <Dropdown align="end">
                <Dropdown.Toggle as={Button} variant="link" className="text-decoration-none p-0 border-0 shadow-none">
                  {user.photoURL ? (
                    <Image src={user.photoURL} roundedCircle style={{ width: '40px', height: '40px', border: '2px solid #00d2ff' }} />
                  ) : (
                    <div className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white" style={{ width: '40px', height: '40px', border: '2px solid #00d2ff' }}>
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </Dropdown.Toggle>

                <Dropdown.Menu className="glass-panel border-neon-blue mt-2 shadow-lg dropdown-dark">
                  <Dropdown.Item onClick={() => setShowProfile(true)} className="text-white hover-bg-light-10">
                    <FaUser className="me-2 text-neon-blue" /> Profile & History
                  </Dropdown.Item>
                  <Dropdown.Divider className="bg-secondary opacity-25" />
                  <Dropdown.Item onClick={handleLogout} className="text-neon-red hover-bg-light-10">
                    <FaSignOutAlt className="me-2" /> Logout
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              <Button variant="outline-light" className="glass-btn py-1" onClick={() => setShowAuth(true)}>Login</Button>
            )}
          </Nav>
        </Navbar.Collapse>
      </Navbar>

      <AuthModal show={showAuth} onHide={() => setShowAuth(false)} setUser={setUser} />
      <ProfileModal show={showProfile} onHide={() => setShowProfile(false)} user={user} history={history} />

      <Container className="d-flex flex-column align-items-center" style={{ minHeight: '80vh' }}>

        {/* Hero Section */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center mb-5 w-100">
          <div className="mb-4">
            <h1 className="display-4 fw-bold mb-2 text-white" style={{ textShadow: '0 0 20px rgba(0, 210, 255, 0.4)' }}>Ultimate 8K Video Downloader</h1>
            <p className="text-secondary lead">Supports <FaYoutube className="text-danger mx-1" /> YouTube, <FaVideo className="text-info mx-1" /> Vimeo, <FaVk className="text-primary mx-1" /> VK, and more.</p>

            {/* Server Status Controls */}
            <div className="d-flex justify-content-center gap-3 mb-4">
              <Button variant="outline-success" size="sm" onClick={pingServer} className="glass-btn rounded-pill px-3">
                📡 Check Server Status
              </Button>
              <Button variant="outline-danger" size="sm" onClick={updateServer} disabled={updatingServer} className="glass-btn rounded-pill px-3">
                {updatingServer ? 'Updating...' : '⚡ Force Engine Update'}
              </Button>
            </div>
            {serverStatus && (
              <Alert variant={serverStatus.type} className="mx-auto" style={{ maxWidth: '400px' }}>
                {serverStatus.text}
              </Alert>
            )}

            <div className="d-flex justify-content-center gap-3 mt-3 opacity-75">
              <span className="badge glass-panel text-neon-blue border border-info border-opacity-25 px-3 py-2">8K HDR</span>
              <span className="badge glass-panel text-neon-green border border-success border-opacity-25 px-3 py-2">60 FPS</span>
              <span className="badge glass-panel text-neon-red border border-danger border-opacity-25 px-3 py-2">High Speed</span>
            </div>
          </div>

          <Form onSubmit={fetchVideoInfo} className="position-relative mx-auto mt-5" style={{ maxWidth: '800px' }}>
            <Form.Control
              type="text"
              placeholder="Paste Video URL..."
              className="glass-input ps-5 py-4 fs-5 text-center rounded-pill border-neon-blue"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              style={{ boxShadow: '0 0 25px rgba(0, 210, 255, 0.15)' }}
            />
            <Button
              type="submit"
              className="position-absolute top-50 end-0 translate-middle-y me-3 rounded-circle p-3 glass-btn border-0 text-neon-blue"
              disabled={loading}
              style={{ width: '50px', height: '50px' }}
            >
              {loading ? <Spinner size="sm" /> : <FaSearch />}
            </Button>
          </Form>
        </motion.div>

        <AnimatePresence>
          {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-100 text-center mb-4"><Alert variant="danger" className="d-inline-block glass-panel text-white border-neon-red bg-danger bg-opacity-25">{error}</Alert></motion.div>}
        </AnimatePresence>

        <AnimatePresence>
          {videoInfo && (
            <motion.div
              initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}
              className="w-100 glass-panel p-5 mb-5"
              style={{ maxWidth: '1100px', background: 'rgba(5, 10, 20, 0.85)', backdropFilter: 'blur(20px)' }}
            >
              <div className="row">
                {/* Large Thumbnail Section */}
                <div className="col-lg-5 mb-4 mb-lg-0">
                  <div className="position-relative rounded-4 overflow-hidden shadow-lg border-neon-blue aspect-ratio-16x9 h-100">
                    <img src={videoInfo.thumbnail} className="img-fluid w-100 h-100 object-fit-cover" />
                    <div className="position-absolute bottom-0 start-0 w-100 p-3 bg-gradient-to-t from-black to-transparent">
                      <span className="badge bg-danger shadow-sm fs-6">{videoInfo.duration_string || `${videoInfo.duration}s`}</span>
                    </div>
                  </div>
                </div>

                {/* Info & Title */}
                <div className="col-lg-7 d-flex flex-column justify-content-center ps-lg-5">
                  <h2 className="fw-bold mb-3 text-white" style={{ textShadow: '0 0 10px rgba(255,255,255,0.3)' }}>{videoInfo.title}</h2>
                  <div className="d-flex gap-2 mb-4">
                    <span className="badge glass-panel text-neon-green border border-success border-opacity-25"><FaGlobe className="me-1" /> Public</span>
                    <span className="badge glass-panel text-warning border border-warning border-opacity-25">Video</span>
                  </div>
                  <p className="text-secondary small">Select your preferred quality below. For best results, audio merging is automatically handled.</p>
                </div>
              </div>

              <hr className="border-secondary my-5 opacity-25" />

              <h4 className="text-neon-blue mb-4"><FaVideo className="me-2" /> Video Quality</h4>

              <div className="grid-container mb-5">
                {videoInfo.videoFormats.map((format, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.05 }}
                    className={`grid-card glass-panel p-3 cursor-pointer text-center position-relative ${selectedVideo?.format_id === format.format_id ? 'border-neon-green bg-white bg-opacity-5' : 'border-secondary border-opacity-25'}`}
                    onClick={() => setSelectedVideo(format)}
                    style={{ transition: 'all 0.3s' }}
                  >
                    {format.height >= 2160 && <div className="position-absolute top-0 start-50 translate-middle badge bg-danger shadow-sm">UHD</div>}

                    <div className="fs-4 fw-bold text-white mb-0">{format.height}p</div>
                    <div className="text-muted small mb-2">{format.resolution}</div>
                    <div className="badge bg-dark mb-2 text-neon-blue border border-info border-opacity-25">{format.ext.toUpperCase()}</div>
                    <div className="small text-secondary">{format.filesize ? (format.filesize / 1024 / 1024).toFixed(1) + ' MB' : 'Stream'}</div>
                  </motion.div>
                ))}
              </div>

              <h4 className="text-neon-red mb-4"><FaHeadphones className="me-2" /> Audio Stream</h4>
              <div className="d-flex flex-wrap gap-3 mb-5">
                {videoInfo.audioFormats.slice(0, 5).map((format, idx) => (
                  <Button
                    key={idx}
                    variant={selectedAudio === format.format_id ? 'light' : 'outline-secondary'}
                    onClick={() => setSelectedAudio(format.format_id)}
                    className={`rounded-pill ${selectedAudio === format.format_id ? 'text-neon-red fw-bold shadow-sm' : 'text-secondary'}`}
                  >
                    {format.acodec} ({(format.filesize / 1024 / 1024).toFixed(1)} MB)
                  </Button>
                ))}
              </div>

              <div className="text-center">
                <Button
                  size="lg"
                  className="glass-btn px-5 py-3 fs-4 border-neon-green text-neon-green w-100"
                  style={{ maxWidth: '400px', boxShadow: '0 0 30px rgba(0, 255, 157, 0.1)' }}
                  onClick={handleDownload}
                  disabled={!selectedVideo || downloading}
                >
                  {downloading ? (
                    <span><Spinner size="sm" className="me-2" /> Contacting Server...</span>
                  ) : (
                    <span><FaDownload className="me-2" /> Download Now</span>
                  )}
                </Button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </Container>

      <style>{`
          .grid-container {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
              gap: 20px;
          }
          .dropdown-dark .dropdown-item:hover {
              background: rgba(255, 255, 255, 0.1);
          }
          .dropdown-dark .dropdown-item {
              color: rgba(255, 255, 255, 0.8);
          }
           /* Bootstrap override for transparency in dropdown */
          .dropdown-menu { background: transparent !important; }
      `}</style>
    </div>
  );
}

export default App;
