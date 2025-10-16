import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import {
  Brain,
  Calendar,
  Sparkles,
  Camera,
  MessageSquare,
  Layers,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

const Features = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Brain,
      title: 'AI Content Strategy',
      description: 'Stop posting randomly. Our AI analyzes your business and creates a strategic content arc—awareness, consideration, and conversion posts perfectly balanced for your goals.',
      benefits: [
        'Strategic post distribution across your campaign',
        'Content ramps up naturally before important dates',
        'Mix of educational, promotional, and engagement posts',
        'Trained on thousands of high-performing social posts'
      ],
      gradient: 'bg-gradient-primary'
    },
    {
      icon: Sparkles,
      title: 'Brand Hub Setup',
      description: 'Teach the AI your brand voice once, and it applies everywhere. No more repeating yourself or getting generic content that sounds like everyone else.',
      benefits: [
        'One-time 5-minute setup captures your unique voice',
        'Define your products, audience, and brand vibe',
        'AI learns your tone and style preferences',
        'Consistent brand voice across all campaigns'
      ],
      gradient: 'bg-accent/10'
    },
    {
      icon: Calendar,
      title: 'Smart Calendar View',
      description: 'See your entire content plan at a glance. Posts are strategically distributed—not every day gets a post. Quality over mindless consistency.',
      benefits: [
        'Visual month grid shows all scheduled posts',
        'Important dates highlighted prominently',
        'Click any post to view and edit details',
        'Mobile-responsive for planning on the go'
      ],
      gradient: 'bg-primary/10'
    },
    {
      icon: MessageSquare,
      title: 'Ready-to-Use Captions',
      description: 'Every post includes hooks (for Reels/Stories), captions, and CTAs written in your brand voice. Just copy, paste, and post—or customize to your heart\'s content.',
      benefits: [
        'Attention-grabbing hooks for video content',
        'Full captions (up to 500 characters)',
        'Natural CTAs that drive action',
        'Regenerate any caption with AI if you want changes'
      ],
      gradient: 'bg-success/10'
    },
    {
      icon: Camera,
      title: 'Visual Shot Lists',
      description: 'Know exactly what to shoot. AI generates a reusable checklist of photos and videos needed—organized by theme, priority, and batch shooting sessions.',
      benefits: [
        '8-15 shot ideas per campaign',
        'Checkbox tracking as you shoot',
        'Props, locations, and setup guidance',
        'Export to TXT for offline reference'
      ],
      gradient: 'bg-accent/10'
    },
    {
      icon: Layers,
      title: 'AI Refinement Credits',
      description: 'Not happy with a caption or visual concept? Use AI credits to regenerate individual posts with specific feedback. Perfect is just one click away.',
      benefits: [
        'Regenerate captions, hooks, or visual concepts',
        'Provide feedback for better results',
        'Starter: 200 credits/month',
        'Growth: 500 credits/month'
      ],
      gradient: 'bg-primary/10'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Everything You Need to{' '}
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              Stop Posting Randomly
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            From brand voice setup to batch shooting checklists—every feature is designed to help you plan 30 days of strategic content in one focused afternoon.
          </p>
          <Button
            size="lg"
            onClick={() => navigate('/auth')}
            className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-lg text-lg px-8"
          >
            Get Started Free
          </Button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-24">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`flex flex-col ${
                index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
              } gap-8 md:gap-12 items-center`}
            >
              {/* Icon & Title */}
              <div className="flex-1 text-center md:text-left">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${feature.gradient} mb-6`}>
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-3xl font-bold mb-4">{feature.title}</h2>
                <p className="text-lg text-muted-foreground mb-6">
                  {feature.description}
                </p>
                <ul className="space-y-3">
                  {feature.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Visual Placeholder */}
              <div className="flex-1 w-full">
                <div className="aspect-video rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-border/50 flex items-center justify-center">
                  <feature.icon className="w-16 h-16 text-muted-foreground/30" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-primary rounded-3xl p-12 shadow-glow text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to plan smarter, not harder?
            </h2>
            <p className="text-primary-foreground/90 text-lg mb-8 max-w-2xl mx-auto">
              Join small business owners who spend one afternoon planning—and the rest of the month creating and posting with confidence.
            </p>
            <Button
              size="lg"
              onClick={() => navigate('/auth')}
              className="bg-background text-foreground hover:bg-background/90 text-lg px-8 shadow-lg"
            >
              Start Planning Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Content Planner. Built for busy business owners who deserve better.</p>
        </div>
      </footer>
    </div>
  );
};

export default Features;
