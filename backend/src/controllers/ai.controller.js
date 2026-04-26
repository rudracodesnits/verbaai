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
    try {
      const { text } = req.body;
      const endpoint = 'summarize';

      // Check cache first
      const cached = await CacheService.get(endpoint, text);
      if (cached) {
        // Log usage (fire and forget)
        UsageService.log({
          userId: req.apiUser.id,
          apiKeyId: req.apiKeyRecord.id,
          endpoint,
          tokensUsed: 0,
          cached: true,
        });

        return res.json({
          success: true,
          data: cached,
          cached: true,
        });
      }

      // Call AI service
      const result = await AIService.summarize(text);

      // Cache the result (fire and forget)
      CacheService.set(endpoint, text, { summary: result.summary });

      // Log usage (fire and forget)
      UsageService.log({
        userId: req.apiUser.id,
        apiKeyId: req.apiKeyRecord.id,
        endpoint,
        tokensUsed: result.tokensUsed,
        cached: false,
      });

      res.json({
        success: true,
        data: {
          summary: result.summary,
        },
        cached: false,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/sentiment
   */
  async sentiment(req, res, next) {
    try {
      const { text } = req.body;
      const endpoint = 'sentiment';

      const cached = await CacheService.get(endpoint, text);
      if (cached) {
        UsageService.log({
          userId: req.apiUser.id,
          apiKeyId: req.apiKeyRecord.id,
          endpoint,
          tokensUsed: 0,
          cached: true,
        });

        return res.json({
          success: true,
          data: cached,
          cached: true,
        });
      }

      const result = await AIService.sentiment(text);

      CacheService.set(endpoint, text, {
        sentiment: result.sentiment,
        score: result.score,
      });

      UsageService.log({
        userId: req.apiUser.id,
        apiKeyId: req.apiKeyRecord.id,
        endpoint,
        tokensUsed: result.tokensUsed,
        cached: false,
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
      next(error);
    }
  },

  /**
   * POST /api/toxicity
   */
  async toxicity(req, res, next) {
    try {
      const { text } = req.body;
      const endpoint = 'toxicity';

      const cached = await CacheService.get(endpoint, text);
      if (cached) {
        UsageService.log({
          userId: req.apiUser.id,
          apiKeyId: req.apiKeyRecord.id,
          endpoint,
          tokensUsed: 0,
          cached: true,
        });

        return res.json({
          success: true,
          data: cached,
          cached: true,
        });
      }

      const result = await AIService.toxicity(text);

      CacheService.set(endpoint, text, {
        toxic: result.toxic,
        confidence: result.confidence,
      });

      UsageService.log({
        userId: req.apiUser.id,
        apiKeyId: req.apiKeyRecord.id,
        endpoint,
        tokensUsed: result.tokensUsed,
        cached: false,
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
      next(error);
    }
  },

  /**
   * POST /api/keywords
   */
  async keywords(req, res, next) {
    try {
      const { text } = req.body;
      const endpoint = 'keywords';

      const cached = await CacheService.get(endpoint, text);
      if (cached) {
        UsageService.log({
          userId: req.apiUser.id,
          apiKeyId: req.apiKeyRecord.id,
          endpoint,
          tokensUsed: 0,
          cached: true,
        });

        return res.json({
          success: true,
          data: cached,
          cached: true,
        });
      }

      const result = await AIService.keywords(text);

      CacheService.set(endpoint, text, {
        keywords: result.keywords,
      });

      UsageService.log({
        userId: req.apiUser.id,
        apiKeyId: req.apiKeyRecord.id,
        endpoint,
        tokensUsed: result.tokensUsed,
        cached: false,
      });

      res.json({
        success: true,
        data: {
          keywords: result.keywords,
        },
        cached: false,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = AIController;
