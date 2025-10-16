import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Navigation from '@/components/Navigation';
import { Check, Sparkles, Zap, ArrowRight } from 'lucide-react';

const Pricing = () => {
  const navigate = useNavigate();

  const plans = [
    {
      name: 'Starter',
      price: '$15',
      period: '/month',
      description: 'Perfect for testing the waters and planning your first campaigns',
      features: [
        '90 posts per month',
        '200 AI regeneration credits',
        'Unlimited campaigns',
        'Brand Hub (one-time setup)',
        'AI-powered content strategy',
        'Ready-to-use captions & hooks',
        'Visual shot lists',
        'Calendar view',
        'Export shot lists to TXT',
        'Email support'
      ],
      cta: 'Start with Starter',
      popular: false,
      gradient: 'border-border'
    },
    {
      name: 'Growth',
      price: '$29',
      period: '/month',
      description: 'For serious creators who want to scale their content game',
      features: [
        '200 posts per month',
        '500 AI regeneration credits',
        'Unlimited campaigns',
        'Brand Hub (one-time setup)',
        'AI-powered content strategy',
        'Ready-to-use captions & hooks',
        'Visual shot lists',
        'Calendar view',
        'Export shot lists to TXT',
        'Priority email support'
      ],
      cta: 'Go with Growth',
      popular: true,
      gradient: 'border-primary shadow-glow'
    }
  ];

  const faqs = [
    {
      question: 'What counts as a "post"?',
      answer: 'Each individual social media post you create counts as 1 post—whether it\'s an image, carousel, Reel, or Story. When you create a campaign, AI generates multiple posts (10-50 depending on your tier), and each counts toward your monthly limit.'
    },
    {
      question: 'What are AI regeneration credits?',
      answer: 'If you\'re not happy with a caption, hook, or visual concept, you can use an AI credit to regenerate it with specific feedback. Each regeneration uses 1 credit. Creating new campaigns does NOT consume credits—only refinements do.'
    },
    {
      question: 'Can I upgrade or downgrade anytime?',
      answer: 'Yes! You can upgrade immediately and we\'ll prorate the difference. If you downgrade, the change takes effect at the start of your next billing cycle. Your content and campaigns remain intact either way.'
    },
    {
      question: 'What happens if I hit my post limit?',
      answer: 'You\'ll see a notification when you\'re close to your limit. If you hit it, you can either upgrade to the Growth plan immediately or wait until your next billing cycle. You can still edit and export existing posts.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Simple,{' '}
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              Transparent Pricing
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-4">
            Choose the plan that fits your content goals. No hidden fees, cancel anytime.
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 pb-20">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative ${plan.gradient} ${plan.popular ? 'md:scale-105' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-gradient-primary text-primary-foreground text-sm font-semibold px-4 py-1 rounded-full shadow-lg flex items-center gap-1">
                    <Sparkles className="w-4 h-4" />
                    Most Popular
                  </div>
                </div>
              )}

              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                <div className="mb-4">
                  <span className="text-5xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <CardDescription className="text-base">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className={`w-full ${
                    plan.popular
                      ? 'bg-gradient-primary hover:opacity-90 shadow-lg'
                      : ''
                  }`}
                  variant={plan.popular ? 'default' : 'outline'}
                  size="lg"
                  onClick={() => navigate('/auth')}
                >
                  {plan.cta}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* What's an AI Credit? */}
        <div className="max-w-3xl mx-auto mt-16 p-8 rounded-2xl bg-accent/10 border border-border">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">What's an AI Credit?</h3>
              <p className="text-muted-foreground leading-relaxed">
                AI credits let you refine individual posts after they're generated. Not happy with a caption? Use 1 credit to regenerate it with specific feedback like "make it more playful" or "focus on the sustainability angle." Campaign creation is unlimited—credits are only for perfecting posts.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="container mx-auto px-4 py-20 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Pricing FAQs</h2>
          <div className="space-y-8">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-border pb-6 last:border-0">
                <h3 className="text-lg font-semibold mb-3">{faq.question}</h3>
                <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-primary rounded-3xl p-12 shadow-glow text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Start planning better content today
            </h2>
            <p className="text-primary-foreground/90 text-lg mb-8 max-w-2xl mx-auto">
              Pick a plan, set up your brand voice in 5 minutes, and generate your first 30-day content calendar.
            </p>
            <Button
              size="lg"
              onClick={() => navigate('/auth')}
              className="bg-background text-foreground hover:bg-background/90 text-lg px-8 shadow-lg"
            >
              Get Started Now
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

export default Pricing;
