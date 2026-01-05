import React from 'react';
import { Modal, Button, Image } from 'react-bootstrap';
import { FaHistory, FaDownload, FaUserCircle } from 'react-icons/fa';

const ProfileModal = ({ show, onHide, user, history }) => {
    return (
        <Modal show={show} onHide={onHide} centered contentClassName="glass-panel border-neon-blue bg-dark text-white">
            <Modal.Header closeButton closeVariant="white" className="border-secondary">
                <Modal.Title className="d-flex align-items-center gap-2">
                    <FaUserCircle className="text-neon-blue" /> User Profile
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
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
