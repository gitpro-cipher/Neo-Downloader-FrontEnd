import React, { useState } from 'react';
import { Modal, Button, Form, Tab, Tabs, Alert } from 'react-bootstrap';
import { FaGoogle, FaEnvelope, FaLock, FaUser } from 'react-icons/fa';
import { auth, googleProvider } from '../firebase'; // Import from local firebase config
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

const AuthModal = ({ show, onHide, setUser }) => {
    const [key, setKey] = useState('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Mock Credentials
    const MOCK_EMAIL = 'admin@admin.com';
    const MOCK_PASS = 'admin123';

    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // MOCK BACKDOOR for Testing
            if (email === MOCK_EMAIL && password === MOCK_PASS) {
                // Simulate network delay
                await new Promise(r => setTimeout(r, 1000));
                setUser({ email: MOCK_EMAIL, uid: 'mock-admin-uid' });
                onHide();
                return;
            }

            if (key === 'login') {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                setUser(userCredential.user);
                onHide();
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                setUser(userCredential.user);
                onHide();
            }
        } catch (err) {
            console.error(err);
            // If Firebase fails (likely due to missing config), show specific error or generic
            if (err.code === 'auth/api-key-not-valid' || err.code === 'auth/internal-error') {
                setError('Firebase Config Missing or Invalid. Try using admin@admin.com / admin123 for testing.');
            } else {
                setError(err.message || 'Authentication failed');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        try {
            const result = await signInWithPopup(auth, googleProvider);
            setUser(result.user);
            onHide();
        } catch (err) {
            console.error(err);
            setError('Google Sign In failed. (Requires valid Firebase Config)');
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered contentClassName="glass-panel border-0 text-white icon-text-white p-2">
            <Modal.Header closeButton closeVariant="white" className="border-0">
                <Modal.Title className="fw-bold">
                    Welcome to NeoDownloader
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Tabs
                    id="auth-tabs"
                    activeKey={key}
                    onSelect={(k) => { setKey(k); setError(''); }}
                    className="mb-4 custom-tabs"
                    justify
                >
                    <Tab eventKey="login" title="Login">
                        {/* Login Form content */}
                    </Tab>
                    <Tab eventKey="register" title="Sign Up">
                        {/* Register Form content */}
                    </Tab>
                </Tabs>

                {error && <Alert variant="danger" className="bg-danger bg-opacity-25 text-white border-0">{error}</Alert>}

                <Form onSubmit={handleAuth}>
                    <Form.Group className="mb-3">
                        <div className="input-group">
                            <span className="input-group-text glass-input border-end-0 text-white" style={{ width: '45px' }}><FaEnvelope /></span>
                            <Form.Control
                                type="email"
                                placeholder="Email address"
                                className="glass-input border-start-0 ps-2"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </Form.Group>

                    <Form.Group className="mb-4">
                        <div className="input-group">
                            <span className="input-group-text glass-input border-end-0 text-white" style={{ width: '45px' }}><FaLock /></span>
                            <Form.Control
                                type="password"
                                placeholder="Password"
                                className="glass-input border-start-0 ps-2"
                                value={email === MOCK_EMAIL && !password ? MOCK_PASS : password} // Hint: Don't actually do this in prod, just keeping logic simple
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </Form.Group>

                    <Button type="submit" className="w-100 glass-btn mb-3" disabled={loading}>
                        {loading ? 'Processing...' : (key === 'login' ? 'Login' : 'Create Account')}
                    </Button>
                </Form>

                <div className="d-flex align-items-center mb-3">
                    <hr className="flex-grow-1 border-secondary" />
                    <span className="px-3 text-white-50 small">OR</span>
                    <hr className="flex-grow-1 border-secondary" />
                </div>

                <Button variant="light" className="w-100 d-flex align-items-center justify-content-center gap-2" onClick={handleGoogleSignIn}>
                    <FaGoogle className="text-danger" /> Continue with Google
                </Button>

            </Modal.Body>
        </Modal>
    );
};

export default AuthModal;
