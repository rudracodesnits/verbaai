const { Router } = require('express');
const AIController = require('../controllers/ai.controller');
const apiKeyMiddleware = require('../middlewares/apiKey.middleware');
const rateLimiterMiddleware = require('../middlewares/rateLimiter.middleware');
const validate = require('../middlewares/validate.middleware');
const { textInputSchema } = require('../validators/ai.validators');

const router = Router();

// All /api routes require API key auth + rate limiting
router.use(apiKeyMiddleware);
router.use(rateLimiterMiddleware);

/**
 * @swagger
 * /api/summarize:
 *   post:
 *     tags: [AI]
 *     summary: Summarize text
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text:
 *                 type: string
 *                 maxLength: 10000
 *                 example: "Artificial intelligence (AI) is intelligence demonstrated by machines..."
 *     responses:
 *       200:
 *         description: Summary generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: string
 *                 cached:
 *                   type: boolean
 *       401:
 *         description: Invalid API key
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/summarize', validate(textInputSchema), AIController.summarize);

/**
 * @swagger
 * /api/sentiment:
 *   post:
 *     tags: [AI]
 *     summary: Analyze text sentiment
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text:
 *                 type: string
 *                 maxLength: 10000
 *                 example: "I absolutely love this product! It's amazing."
 *     responses:
 *       200:
 *         description: Sentiment analysis result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     sentiment:
 *                       type: string
 *                       enum: [positive, negative, neutral]
 *                     score:
 *                       type: number
 *                       minimum: -1
 *                       maximum: 1
 *                 cached:
 *                   type: boolean
 *       401:
 *         description: Invalid API key
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/sentiment', validate(textInputSchema), AIController.sentiment);

/**
 * @swagger
 * /api/toxicity:
 *   post:
 *     tags: [AI]
 *     summary: Detect text toxicity
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text:
 *                 type: string
 *                 maxLength: 10000
 *                 example: "This is a perfectly normal and respectful comment."
 *     responses:
 *       200:
 *         description: Toxicity detection result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     toxic:
 *                       type: boolean
 *                     confidence:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 1
 *                 cached:
 *                   type: boolean
 *       401:
 *         description: Invalid API key
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/toxicity', validate(textInputSchema), AIController.toxicity);

/**
 * @swagger
 * /api/keywords:
 *   post:
 *     tags: [AI]
 *     summary: Extract keywords from text
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text:
 *                 type: string
 *                 maxLength: 10000
 *                 example: "Machine learning is a subset of artificial intelligence that focuses on building systems..."
 *     responses:
 *       200:
 *         description: Extracted keywords
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     keywords:
 *                       type: array
 *                       items:
 *                         type: string
 *                 cached:
 *                   type: boolean
 *       401:
 *         description: Invalid API key
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/keywords', validate(textInputSchema), AIController.keywords);

/**
 * @swagger
 * /api/chat:
 *   post:
 *     tags: [AI]
 *     summary: Chat about selected text
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [context, messages]
 *             properties:
 *               context:
 *                 type: string
 *                 maxLength: 10000
 *                 example: "Selected text from the page."
 *               messages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, assistant, system]
 *                     content:
 *                       type: string
 *     responses:
 *       200:
 *         description: Chat response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     reply:
 *                       type: string
 *                 cached:
 *                   type: boolean
 *       401:
 *         description: Invalid API key
 *       429:
 *         description: Rate limit exceeded
 */
const { chatInputSchema } = require('../validators/ai.validators');
router.post('/chat', validate(chatInputSchema), AIController.chat);

module.exports = router;
