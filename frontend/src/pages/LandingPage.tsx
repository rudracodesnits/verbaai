import React from 'react';
import { FileText, MessageSquare, ShieldAlert, KeyRound, ArrowRight, Code2 } from 'lucide-react';
import { FeatureCard } from '../components/FeatureCard';

interface LandingPageProps {
  onNavigateToPlayground: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToPlayground }) => {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center py-20 px-4 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] -z-10"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-[128px] -z-10"></div>
        
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-sm text-blue-400 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            v1.0 is now live
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
            The Ultimate <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              Text Analysis API
            </span>
          </h1>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Integrate powerful NLP capabilities into your applications in minutes. 
            Summarize content, detect sentiment, filter toxicity, and extract keywords with a single API call.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={onNavigateToPlayground}
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)]"
            >
              <Code2 className="w-5 h-5" />
              Try API Playground
            </button>
            <a 
              href="#"
              className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors border border-slate-700"
            >
              View Documentation
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-900/50 border-t border-slate-800">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Core Capabilities</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Everything you need to understand and process text efficiently.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard 
              title="Summarization" 
              description="Condense long articles and documents into concise, readable summaries without losing context."
              icon={<FileText className="w-6 h-6" />}
            />
            <FeatureCard 
              title="Sentiment Analysis" 
              description="Determine the emotional tone of text. Automatically classify text as positive, negative, or neutral."
              icon={<MessageSquare className="w-6 h-6" />}
            />
            <FeatureCard 
              title="Toxicity Detection" 
              description="Keep your platform safe by identifying harmful, offensive, or inappropriate content automatically."
              icon={<ShieldAlert className="w-6 h-6" />}
            />
            <FeatureCard 
              title="Keyword Extraction" 
              description="Identify the most important terms and phrases from any block of text for better search and categorization."
              icon={<KeyRound className="w-6 h-6" />}
            />
          </div>
        </div>
      </section>
    </div>
  );
};
