const logger = require('../utils/logger');

/**
 * Mock AI Provider — Returns realistic NLP responses using simple heuristics.
 * Zero cost, no external API calls. Perfect for development and demos.
 *
 * This implements the same interface as the OpenAI provider,
 * demonstrating the provider-swap architecture.
 */
const MockAIProvider = {
  /**
   * Mock model call — analyzes text with simple heuristics.
   * Returns JSON string matching the expected format for each endpoint.
   *
   * @param {string} systemPrompt - Used to detect which endpoint is calling
   * @param {string} text - The user's input text
   * @returns {Promise<{ content: string, tokensUsed: number }>}
   */
  async callModel(systemPrompt, text) {
    // Simulate a small delay (50-200ms) to feel realistic
    await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 150));

    const promptLower = systemPrompt.toLowerCase();
    let result;

    if (promptLower.includes('summarize')) {
      result = this._summarize(text);
    } else if (promptLower.includes('sentiment')) {
      result = this._sentiment(text);
    } else if (promptLower.includes('toxic')) {
      result = this._toxicity(text);
    } else if (promptLower.includes('keyword')) {
      result = this._keywords(text);
    } else if (promptLower.includes('chat') || promptLower.includes('context')) {
      result = this._chat(text, systemPrompt);
    } else {
      result = { error: 'Unknown task' };
    }

    const content = JSON.stringify(result);
    // Estimate tokens: ~4 chars per token (rough approximation)
    const tokensUsed = Math.ceil((text.length + content.length) / 4);

    logger.debug(`Mock AI provider responded (${tokensUsed} est. tokens)`);

    return { content, tokensUsed };
  },

  /**
   * Generate a summary by extracting the first 1-2 sentences.
   */
  _summarize(text) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const summaryLength = Math.min(2, sentences.length);
    const summary = sentences
      .slice(0, summaryLength)
      .join(' ')
      .trim();

    return {
      summary:
        sentences.length > 2
          ? summary + ' [Summary of ' + sentences.length + ' sentences]'
          : summary,
    };
  },

  /**
   * Simple sentiment analysis based on keyword matching.
   */
  _sentiment(text) {
    const lower = text.toLowerCase();

    const positiveWords = [
      'love', 'great', 'amazing', 'wonderful', 'excellent', 'fantastic',
      'good', 'happy', 'best', 'awesome', 'incredible', 'beautiful',
      'perfect', 'brilliant', 'enjoy', 'thank', 'appreciate', 'glad',
      'excited', 'superb', 'outstanding', 'delightful', 'pleased',
    ];
    const negativeWords = [
      'hate', 'terrible', 'awful', 'horrible', 'bad', 'worst',
      'disgusting', 'ugly', 'angry', 'sad', 'disappointing', 'poor',
      'annoying', 'frustrating', 'useless', 'stupid', 'boring',
      'dreadful', 'pathetic', 'miserable', 'sucks', 'fail',
    ];

    let posCount = 0;
    let negCount = 0;

    for (const word of positiveWords) {
      if (lower.includes(word)) posCount++;
    }
    for (const word of negativeWords) {
      if (lower.includes(word)) negCount++;
    }

    const total = posCount + negCount || 1;
    let sentiment, score;

    if (posCount > negCount) {
      sentiment = 'positive';
      score = Math.min(0.95, 0.5 + (posCount / total) * 0.5);
    } else if (negCount > posCount) {
      sentiment = 'negative';
      score = Math.max(-0.95, -0.5 - (negCount / total) * 0.5);
    } else {
      sentiment = 'neutral';
      score = 0;
    }

    return {
      sentiment,
      score: Math.round(score * 100) / 100,
    };
  },

  /**
   * Simple toxicity detection based on offensive keyword matching.
   */
  _toxicity(text) {
    const lower = text.toLowerCase();

    const toxicPatterns = [
      'hate', 'kill', 'die', 'stupid', 'idiot', 'shut up',
      'damn', 'hell', 'sucks', 'loser', 'dumb', 'trash',
      'disgusting', 'pathetic', 'worthless', 'ugly',
    ];

    let matches = 0;
    for (const pattern of toxicPatterns) {
      if (lower.includes(pattern)) matches++;
    }

    const toxic = matches >= 2;
    const confidence = matches === 0
      ? 0.95
      : matches === 1
        ? 0.6
        : Math.min(0.98, 0.7 + matches * 0.05);

    return {
      toxic,
      confidence: Math.round(confidence * 100) / 100,
    };
  },

  /**
   * Extract keywords by finding the most significant words.
   */
  _keywords(text) {
    const stopWords = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
      'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'could', 'should', 'may', 'might', 'can', 'shall',
      'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
      'as', 'into', 'through', 'during', 'before', 'after', 'above',
      'below', 'between', 'and', 'but', 'or', 'nor', 'not', 'so',
      'yet', 'both', 'either', 'neither', 'each', 'every', 'all',
      'any', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
      'only', 'own', 'same', 'than', 'too', 'very', 'just', 'because',
      'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them',
      'their', 'he', 'she', 'him', 'her', 'his', 'we', 'us', 'our',
      'you', 'your', 'i', 'me', 'my', 'which', 'who', 'whom', 'what',
      'where', 'when', 'how', 'about', 'also', 'then', 'there', 'here',
      'up', 'out', 'if', 'while', 'over', 'under', 'again', 'further',
      'once', 'uses', 'used', 'using', 'based', 'many', 'much', 'well',
    ]);

    // Tokenize and count word frequency
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));

    const freq = {};
    for (const word of words) {
      freq[word] = (freq[word] || 0) + 1;
    }

    // Sort by frequency, take top 5-8
    const keywords = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, Math.min(8, Math.max(3, Object.keys(freq).length)))
      .map(([word]) => word);

    return { keywords };
  },

  /**
   * Simple chat response based on input text and context.
   */
  _chat(text, systemPrompt) {
    const lower = text.toLowerCase();
    
    if (lower.includes('summarize')) {
      let contextText = "";
      const match = systemPrompt.match(/context:\n\n"([\s\S]*?)"\n\nAnswer/);
      if (match && match[1]) {
        contextText = match[1];
      }
      
      if (contextText && contextText !== "VerbaAI General Assistant Chat Session") {
        const sentences = contextText.match(/[^.!?]+[.!?]+/g) || [contextText];
        const summaryLength = Math.min(2, sentences.length);
        const summary = sentences.slice(0, summaryLength).join(' ').trim();
        return { reply: "Here is a brief summary: " + summary };
      } else {
        return { reply: "There is no specific text context to summarize. Please provide some text in the context box!" };
      }
    } else if (lower.includes('tone') || lower.includes('sentiment')) {
      return { reply: "Based on the provided context, the tone appears to be informative and narrative, with a slightly dramatic undertone." };
    } else if (lower.includes('spell') || lower.includes('grammar') || lower.includes('proofread') || lower.includes('errors')) {
      return { reply: "I have reviewed the text and found no major spelling or grammatical errors. It is well-written." };
    } else if (lower.includes('mean') || lower.includes('explain')) {
      return { reply: "Based on the selected text, this usually means that the author is conveying a key concept. It's important to read the surrounding context to fully understand its implications." };
    } else if (lower.includes('why')) {
      return { reply: "The text suggests this is because of underlying factors mentioned earlier in the document. Would you like me to elaborate on a specific part?" };
    } else if (lower.includes('example')) {
      return { reply: "For example, if you consider a similar scenario, the same principles apply. This helps illustrate the point made in the text." };
    } else {
      return { reply: "I understand you're asking about the selected text. It seems to highlight a specific detail. What else would you like to know?" };
    }
  },
};

module.exports = MockAIProvider;
