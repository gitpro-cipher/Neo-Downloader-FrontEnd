import React, { useState } from 'react';
import { Modal, Button, Image, Alert } from 'react-bootstrap';
import axios from 'axios';
import { FaHistory, FaDownload, FaUserCircle } from 'react-icons/fa';

const ProfileModal = ({ show, onHide, user, history }) => {
    const [updating, setUpdating] = useState(false);
    const [msg, setMsg] = useState(null);

    const updateServer = async () => {
        setUpdating(true);
        setMsg(null);
        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'https://neo-downloader-backend.onrender.com';
            const res = await axios.post(`${API_BASE}/api/update`);
            setMsg({ type: 'success', text: `Success: ${res.data.output}` });
        } catch (err) {
            setMsg({ type: 'danger', text: 'Update Failed. Check console.' });
            console.error(err);
        } finally {
            setUpdating(false);
        }
    };

    const pingServer = async () => {
        setMsg(null);
        const start = Date.now();
        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'https://neo-downloader-backend.onrender.com';
            await axios.get(`${API_BASE}/api/health`);
            const latency = Date.now() - start;
            setMsg({ type: 'success', text: `Server Online! Latency: ${latency}ms` });
        } catch (err) {
            setMsg({ type: 'danger', text: 'Server Unreachable (Offline)' });
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered contentClassName="glass-panel border-neon-blue bg-dark text-white">
            <Modal.Header closeButton closeVariant="white" className="border-secondary">
                <Modal.Title className="d-flex align-items-center gap-2">
                    <FaUserCircle className="text-neon-blue" /> User Profile
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {msg && <Alert variant={msg.type} onClose={() => setMsg(null)} dismissible className="small">{msg.text}</Alert>}
                <div className="text-center mb-4">
                    {user?.photoURL ? (
                        <Image src={user.photoURL} roundedCircle style={{ width: '100px', height: '100px', border: '3px solid #00d2ff' }} />
                    ) : (
                        <div className="rounded-circle bg-secondary d-flex align-items-center justify-content-center mx-auto" style={{ width: '100px', height: '100px', border: '3px solid #00d2ff' }}>
                            <span className="fs-1">{user?.email?.charAt(0).toUpperCase()}</span>
                        </div>
                    )}
                    <h4 className="mt-3 text-white">{user?.displayName || 'User'}</h4>
                    <p className="text-secondary">{user?.email}</p>
                </div>

                <div className="mb-4 text-center">
                    <div className="d-flex justify-content-center gap-2 mb-2">
                        <Button variant="outline-success" size="sm" onClick={pingServer}>
                            📡 Test Connection
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={updateServer} disabled={updating}>
                            {updating ? 'Updating...' : '⚡ Force Update yt-dlp'}
                        </Button>
                    </div>
                    <div className="text-muted small mt-1" style={{ fontSize: '0.75rem' }}>
                        Use "Update" if downloads start failing. Use "Test" to check backend status.
                    </div>
                </div>

                <h5 className="text-neon-green mb-3 border-bottom border-secondary pb-2"><FaHistory className="me-2" /> Download History</h5>
                <div className="history-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {history && history.length > 0 ? (
                        history.map((item, idx) => (
                            <div key={idx} className="d-flex align-items-center gap-3 p-2 mb-2 glass-panel border-0 bg-white bg-opacity-5">
                                <img src={item.thumbnail} alt="thumb" className="rounded" style={{ width: '60px', height: '34px', objectFit: 'cover' }} />
                                <div className="flex-grow-1 overflow-hidden">
                                    <div className="text-truncate small fw-bold">{item.title}</div>
                                    <div className="d-flex gap-2">
                                        <span className="badge bg-dark text-neon-blue position-static">{item.quality}</span>
                                        <span className="text-secondary small">{item.date}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-muted py-3">No downloads yet.</p>
                    )}
                </div>
            </Modal.Body>
            <Modal.Footer className="border-secondary">
                <Button variant="outline-light" onClick={onHide}>Close</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ProfileModal;
