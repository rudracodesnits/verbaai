const { Router } = require('express');
const AuthController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  registerSchema,
  loginSchema,
  createApiKeySchema,
  verifyOtpSchema,
  resendOtpSchema,
} = require('../validators/auth.validators');

const router = Router();

// ─── Public Routes ──────────────────────────────────

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: SecurePass123!
 *               name:
 *                 type: string
 *                 example: John Doe
 *     responses:
 *       201:
 *         description: User created successfully
 *       409:
 *         description: Email already registered
 */
router.post('/register', validate(registerSchema), AuthController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login and receive JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: SecurePass123!
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', validate(loginSchema), AuthController.login);

/**
 * @swagger
 * /auth/google:
 *   post:
 *     tags: [Auth]
 *     summary: Login or Register via Google OAuth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idToken]
 *             properties:
 *               idToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid Google token
 */
router.post('/google', AuthController.googleLogin);

/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Verify email address using OTP code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               code:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *     responses:
 *       200:
 *         description: Verification successful, returns token
 *       401:
 *         description: Invalid or expired OTP code
 */
router.post('/verify-otp', validate(verifyOtpSchema), AuthController.verifyOtp);

/**
 * @swagger
 * /auth/resend-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Resend verification OTP code to an email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: OTP code resent successfully
 *       404:
 *         description: User not found
 */
router.post('/resend-otp', validate(resendOtpSchema), AuthController.resendOtp);

// ─── Protected Routes (JWT required) ────────────────

/**
 * @swagger
 * /auth/keys:
 *   post:
 *     tags: [Auth]
 *     summary: Generate a new API key
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: My Production Key
 *     responses:
 *       201:
 *         description: API key created (shown only once)
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/keys',
  authMiddleware,
  validate(createApiKeySchema),
  AuthController.createApiKey
);

/**
 * @swagger
 * /auth/keys:
 *   get:
 *     tags: [Auth]
 *     summary: List all API keys (prefix only)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of API keys
 *       401:
 *         description: Unauthorized
 */
router.get('/keys', authMiddleware, AuthController.listApiKeys);

/**
 * @swagger
 * /auth/keys/{id}:
 *   delete:
 *     tags: [Auth]
 *     summary: Revoke an API key
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: API key ID
 *     responses:
 *       200:
 *         description: Key revoked
 *       404:
 *         description: Key not found
 */
router.delete('/keys/:id', authMiddleware, AuthController.revokeApiKey);

/**
 * @swagger
 * /auth/usage:
 *   get:
 *     tags: [Auth]
 *     summary: View usage statistics
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Usage statistics
 *       401:
 *         description: Unauthorized
 */
router.get('/usage', authMiddleware, AuthController.getUsage);
router.get('/me', authMiddleware, AuthController.getMe);

// Logs & Billing routes
router.get('/logs', authMiddleware, AuthController.getLogs);
router.post('/create-checkout', authMiddleware, AuthController.createCheckoutSession);
router.post('/mock-upgrade', authMiddleware, AuthController.verifyMockCheckout);
router.post('/stripe-webhook', AuthController.handleStripeWebhook);

module.exports = router;
