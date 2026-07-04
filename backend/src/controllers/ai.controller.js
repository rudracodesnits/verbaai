const AIService = require('../services/ai.service');
const CacheService = require('../services/cache.service');
const UsageService = require('../services/usage.service');

/**
 * AI controller — handles request/response for NLP endpoints.
 * Implements cache-first pattern: check cache → call AI → store in cache.
 * Usage is logged asynchronously.
 */
const AIController = {
  /**
   * POST /api/summarize
   */
  async summarize(req, res, next) {
    const startTime = Date.now();
    const endpoint = 'summarize';
    try {
      const { text, temperature, maxTokens } = req.body;
      const options = { temperature, maxTokens };

      // Check cache first
      const cached = await CacheService.get(endpoint, text, options);
      if (cached) {
        // Log usage (fire and forget)
        UsageService.log({
          userId: req.apiUser.id,
          apiKeyId: req.apiKeyRecord.id,
          endpoint,
          tokensUsed: 0,
          cached: true,
          latency: Date.now() - startTime,
          error: false,
          statusCode: 200,
          inputText: text,
          outputText: JSON.stringify(cached),
        });

        return res.json({
          success: true,
          data: cached,
          cached: true,
        });
      }

      // Call AI service
      const result = await AIService.summarize(text, options);

      // Cache the result (fire and forget)
      CacheService.set(endpoint, text, { summary: result.summary }, options);

      // Log usage (fire and forget)
      UsageService.log({
        userId: req.apiUser.id,
        apiKeyId: req.apiKeyRecord.id,
        endpoint,
        tokensUsed: result.tokensUsed,
        cached: false,
        latency: Date.now() - startTime,
        error: false,
        statusCode: 200,
        inputText: text,
        outputText: JSON.stringify({ summary: result.summary }),
      });

      res.json({
        success: true,
        data: {
          summary: result.summary,
        },
        cached: false,
      });
    } catch (error) {
      const latency = Date.now() - startTime;
      UsageService.log({
        userId: req.apiUser.id,
        apiKeyId: req.apiKeyRecord.id,
        endpoint,
        tokensUsed: 0,
        cached: false,
        latency,
        error: true,
        statusCode: error.status || error.statusCode || 500,
        inputText: req.body.text,
        outputText: error.message || 'Unknown error',
      });
      next(error);
    }
  },

  /**
   * POST /api/sentiment
   */
  async sentiment(req, res, next) {
    const startTime = Date.now();
    const endpoint = 'sentiment';
    try {
      const { text, temperature, maxTokens } = req.body;
      const options = { temperature, maxTokens };

      const cached = await CacheService.get(endpoint, text, options);
      if (cached) {
        UsageService.log({
          userId: req.apiUser.id,
          apiKeyId: req.apiKeyRecord.id,
          endpoint,
          tokensUsed: 0,
          cached: true,
          latency: Date.now() - startTime,
          error: false,
          statusCode: 200,
          inputText: text,
          outputText: JSON.stringify(cached),
        });

        return res.json({
          success: true,
          data: cached,
          cached: true,
        });
      }

      const result = await AIService.sentiment(text, options);

      CacheService.set(endpoint, text, {
        sentiment: result.sentiment,
        score: result.score,
      }, options);

      UsageService.log({
        userId: req.apiUser.id,
        apiKeyId: req.apiKeyRecord.id,
        endpoint,
        tokensUsed: result.tokensUsed,
        cached: false,
        latency: Date.now() - startTime,
        error: false,
        statusCode: 200,
        inputText: text,
        outputText: JSON.stringify({ sentiment: result.sentiment, score: result.score }),
      });

      res.json({
        success: true,
        data: {
          sentiment: result.sentiment,
          score: result.score,
        },
        cached: false,
      });
    } catch (error) {
      const latency = Date.now() - startTime;
      UsageService.log({
        userId: req.apiUser.id,
        apiKeyId: req.apiKeyRecord.id,
        endpoint,
        tokensUsed: 0,
        cached: false,
        latency,
        error: true,
        statusCode: error.status || error.statusCode || 500,
        inputText: req.body.text,
        outputText: error.message || 'Unknown error',
      });
      next(error);
    }
  },

  /**
   * POST /api/toxicity
   */
  async toxicity(req, res, next) {
    const startTime = Date.now();
    const endpoint = 'toxicity';
    try {
      const { text, temperature, maxTokens } = req.body;
      const options = { temperature, maxTokens };

      const cached = await CacheService.get(endpoint, text, options);
      if (cached) {
        UsageService.log({
          userId: req.apiUser.id,
          apiKeyId: req.apiKeyRecord.id,
          endpoint,
          tokensUsed: 0,
          cached: true,
          latency: Date.now() - startTime,
          error: false,
          statusCode: 200,
          inputText: text,
          outputText: JSON.stringify(cached),
        });

        return res.json({
          success: true,
          data: cached,
          cached: true,
         });
      }

      const result = await AIService.toxicity(text, options);

      CacheService.set(endpoint, text, {
        toxic: result.toxic,
        confidence: result.confidence,
      }, options);

      UsageService.log({
        userId: req.apiUser.id,
        apiKeyId: req.apiKeyRecord.id,
        endpoint,
        tokensUsed: result.tokensUsed,
        cached: false,
        latency: Date.now() - startTime,
        error: false,
        statusCode: 200,
        inputText: text,
        outputText: JSON.stringify({ toxic: result.toxic, confidence: result.confidence }),
      });

      res.json({
        success: true,
        data: {
          toxic: result.toxic,
          confidence: result.confidence,
        },
        cached: false,
      });
    } catch (error) {
      const latency = Date.now() - startTime;
      UsageService.log({
        userId: req.apiUser.id,
        apiKeyId: req.apiKeyRecord.id,
        endpoint,
        tokensUsed: 0,
        cached: false,
        latency,
        error: true,
        statusCode: error.status || error.statusCode || 500,
        inputText: req.body.text,
        outputText: error.message || 'Unknown error',
      });
      next(error);
    }
  },

  /**
   * POST /api/keywords
   */
  async keywords(req, res, next) {
    const startTime = Date.now();
    const endpoint = 'keywords';
    try {
      const { text, temperature, maxTokens } = req.body;
      const options = { temperature, maxTokens };

      const cached = await CacheService.get(endpoint, text, options);
      if (cached) {
        UsageService.log({
          userId: req.apiUser.id,
          apiKeyId: req.apiKeyRecord.id,
          endpoint,
          tokensUsed: 0,
          cached: true,
          latency: Date.now() - startTime,
          error: false,
          statusCode: 200,
          inputText: text,
          outputText: JSON.stringify(cached),
        });

        return res.json({
          success: true,
          data: cached,
          cached: true,
        });
      }

      const result = await AIService.keywords(text, options);

      CacheService.set(endpoint, text, {
        keywords: result.keywords,
      }, options);

      UsageService.log({
        userId: req.apiUser.id,
        apiKeyId: req.apiKeyRecord.id,
        endpoint,
        tokensUsed: result.tokensUsed,
        cached: false,
        latency: Date.now() - startTime,
        error: false,
        statusCode: 200,
        inputText: text,
        outputText: JSON.stringify({ keywords: result.keywords }),
      });

      res.json({
        success: true,
        data: {
          keywords: result.keywords,
        },
        cached: false,
      });
    } catch (error) {
      const latency = Date.now() - startTime;
      UsageService.log({
        userId: req.apiUser.id,
        apiKeyId: req.apiKeyRecord.id,
        endpoint,
        tokensUsed: 0,
        cached: false,
        latency,
        error: true,
        statusCode: error.status || error.statusCode || 500,
        inputText: req.body.text,
        outputText: error.message || 'Unknown error',
      });
      next(error);
    }
  },

  /**
   * POST /api/chat
   */
  async chat(req, res, next) {
    const startTime = Date.now();
    const endpoint = 'chat';
    try {
      const { context, messages, temperature, maxTokens } = req.body;
      const options = { temperature, maxTokens };

      // We won't cache chat responses since they depend on the conversation history
      const result = await AIService.chat(context, messages, options);

      UsageService.log({
        userId: req.apiUser.id,
        apiKeyId: req.apiKeyRecord.id,
        endpoint,
        tokensUsed: result.tokensUsed,
        cached: false,
        latency: Date.now() - startTime,
        error: false,
        statusCode: 200,
        inputText: JSON.stringify({ context, messages }),
        outputText: JSON.stringify({ reply: result.reply }),
      });

      res.json({
        success: true,
        data: {
          reply: result.reply,
        },
        cached: false,
      });
    } catch (error) {
      const latency = Date.now() - startTime;
      UsageService.log({
        userId: req.apiUser.id,
        apiKeyId: req.apiKeyRecord.id,
        endpoint,
        tokensUsed: 0,
        cached: false,
        latency,
        error: true,
        statusCode: error.status || error.statusCode || 500,
        inputText: JSON.stringify({ context: req.body.context, messages: req.body.messages }),
        outputText: error.message || 'Unknown error',
      });
      next(error);
    }
  },
};

module.exports = AIController;
