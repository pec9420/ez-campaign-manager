import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import { Sparkles, Calendar, Zap, CheckCircle2 } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-primary mb-8 shadow-glow">
            <Sparkles className="w-10 h-10 text-primary-foreground" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Plan 30 Days of Content in{' '}
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              One Afternoon
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Stop scrambling for content ideas. Get strategic post plans with AI-powered captions and shot lists—so you can batch-create everything and build real momentum.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              size="lg"
              onClick={() => navigate('/select-user')}
              className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-lg text-lg px-8"
            >
              Get Started Free
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/select-user')}
              className="text-lg px-8"
            >
              View Demo
            </Button>
          </div>

          {/* Social Proof */}
          <p className="text-sm text-muted-foreground">
            Trusted by 1,000+ small business owners who hate scrambling for content
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything you need to stop posting randomly
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Strategic Planning</h3>
              <p className="text-muted-foreground">
                AI generates a complete 30-day content calendar based on your business goals and audience
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Ready-to-Use Captions</h3>
              <p className="text-muted-foreground">
                Every post includes hooks, captions, and CTAs written in your brand voice
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Visual Shot Lists</h3>
              <p className="text-muted-foreground">
                Know exactly what photos to take so you can batch-shoot everything in one session
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center bg-gradient-primary rounded-3xl p-12 shadow-glow">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to stop scrambling?
          </h2>
          <p className="text-primary-foreground/90 text-lg mb-8">
            Join small business owners who plan once and post consistently
          </p>
          <Button
            size="lg"
            onClick={() => navigate('/select-user')}
            className="bg-background text-foreground hover:bg-background/90 text-lg px-8 shadow-lg"
          >
            Start Planning Now
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 Content Planner. Built for busy business owners who deserve better.
            </p>
            <div className="flex gap-6">
              <button
                onClick={() => navigate('/features')}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Features
              </button>
              <button
                onClick={() => navigate('/pricing')}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Pricing
              </button>
              <button
                onClick={() => navigate('/faq')}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                FAQ
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
