import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import Navigation from '@/components/Navigation';
import { ArrowRight, MessageCircle } from 'lucide-react';

const FAQ = () => {
  const navigate = useNavigate();

  const faqSections = [
    {
      category: 'Getting Started',
      questions: [
        {
          q: 'How does Content Planner work?',
          a: 'Sign up, complete a 5-minute brand voice setup in your Brand Hub, then create a campaign by describing what you\'re promoting and your goals. AI generates 10-50 strategic posts with captions, hooks, and a shot list. Review, edit if needed, and export your shot list to start batch-creating content.'
        },
        {
          q: 'Do I need design or marketing experience?',
          a: 'Not at all! Content Planner is built for busy business owners who don\'t have time to become social media experts. The AI handles strategy, captions, and even tells you exactly what photos and videos to shoot. If you can use a smartphone camera, you can use Content Planner.'
        },
        {
          q: 'What\'s the Brand Hub and why do I need it?',
          a: 'The Brand Hub is a one-time setup where you teach the AI your brand voice. You describe your business, products, target customer, and brand vibe (warm, playful, professional, etc.). This ensures every post sounds like you—not generic AI content.'
        },
        {
          q: 'How long does it take to plan 30 days of content?',
          a: 'About one focused afternoon: 5 minutes for Brand Hub setup, 10 minutes to create your first campaign, 30-45 seconds for AI to generate posts, and 30-60 minutes to review and customize. Then you\'re ready to batch-shoot all your content in one session.'
        },
        {
          q: 'Can I edit the AI-generated content?',
          a: 'Absolutely! Every caption, hook, and visual concept is fully editable. You can manually tweak anything or use AI regeneration credits to refine posts with specific feedback like "make it more casual" or "add a sustainability angle."'
        }
      ]
    },
    {
      category: 'Content Planning',
      questions: [
        {
          q: 'What\'s a "campaign" and how many should I create?',
          a: 'A campaign is a content plan tied to a specific promotion, product launch, or time period (2-90 days). You might create one campaign per product launch, seasonal promotion, or major event. Most users create 1-3 campaigns per month depending on their business activity.'
        },
        {
          q: 'Does AI post content to my social accounts automatically?',
          a: 'No, and that\'s intentional. Content Planner is a planning and creation tool, not a scheduler. We generate the strategy, captions, and shot list so you can batch-create content. You\'ll still manually post to your platforms or use your preferred scheduler. This keeps your accounts safe and gives you full control.'
        },
        {
          q: 'What platforms does Content Planner support?',
          a: 'We optimize content for Instagram, Facebook, TikTok, Pinterest, and LinkedIn. You can select 1-3 platforms per campaign, and AI tailors captions and visual concepts accordingly. For example, TikTok posts get trend-focused hooks while LinkedIn posts are more professional.'
        },
        {
          q: 'What\'s the difference between post types?',
          a: 'We generate four types: Images (single photo posts), Carousels (multi-slide posts), Reels (short videos), and Stories (temporary 24-hour content). Each includes appropriate captions, and Reels/Stories get attention-grabbing hooks. The mix depends on your campaign goals and platforms.'
        },
        {
          q: 'What if I need more posts than AI generated for my campaign?',
          a: 'Currently, campaigns generate 10-50 posts depending on your plan and campaign length. If you need more, you can create multiple shorter campaigns or upgrade to the Growth plan for higher limits. We\'re also exploring custom post creation in future updates based on user feedback.'
        }
      ]
    },
    {
      category: 'Pricing & Billing',
      questions: [
        {
          q: 'What\'s the difference between Starter and Growth plans?',
          a: 'Starter ($15/mo) gives you 90 posts/month and 200 AI regeneration credits—great for testing or smaller businesses. Growth ($29/mo) offers 200 posts/month and 500 credits for serious content creators scaling their presence. Both include unlimited campaigns and all features.'
        },
        {
          q: 'Do unused posts and credits roll over?',
          a: 'No, posts and AI credits reset monthly on your billing date. However, all your created campaigns, posts, and shot lists remain in your account forever. You can always revisit and reuse old content plans even if you\'ve used your monthly limit.'
        },
        {
          q: 'Can I cancel anytime?',
          a: 'Yes! Cancel anytime from your account settings (powered by Stripe Customer Portal). You\'ll keep access until the end of your current billing period. Your content and campaigns remain accessible even after cancellation.'
        },
        {
          q: 'Is there a free trial?',
          a: 'We don\'t offer free trials, but the Starter plan at $15/mo is risk-free with monthly billing. You can test the entire workflow—Brand Hub, campaign creation, AI generation, shot lists—and cancel before your next billing date if it\'s not right for you.'
        }
      ]
    },
    {
      category: 'Technical',
      questions: [
        {
          q: 'What AI models power Content Planner?',
          a: 'We use OpenAI GPT-5 for content generation (posts, captions, hooks) and Anthropic Claude Sonnet 4.5 for shot list creation. Both are fine-tuned with social media best practices and trained on thousands of high-performing posts across industries.'
        },
        {
          q: 'Is my data secure?',
          a: 'Yes. We use Supabase for authentication and data storage with enterprise-grade encryption. Your brand information, campaigns, and posts are protected by Row-Level Security policies—you can only access your own data. We never share or sell your content.'
        },
        {
          q: 'Can I export my content?',
          a: 'Yes! Shot lists can be exported to TXT files for offline reference during shooting. We\'re exploring CSV and PDF exports for posts based on user feedback. All your content is also accessible via the calendar view for easy copy-pasting to your scheduler.'
        },
        {
          q: 'What browsers and devices are supported?',
          a: 'Content Planner works on all modern browsers (Chrome, Safari, Firefox, Edge) and is fully mobile-responsive. You can plan on desktop and review/edit on your phone. The calendar and shot list views adapt beautifully to small screens.'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Frequently Asked{' '}
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              Questions
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-4">
            Everything you need to know about planning 30 days of content in one afternoon.
          </p>
        </div>
      </div>

      {/* FAQ Sections */}
      <div className="container mx-auto px-4 pb-20">
        <div className="max-w-3xl mx-auto space-y-12">
          {faqSections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <h2 className="text-2xl font-bold mb-6 text-primary">
                {section.category}
              </h2>
              <Accordion type="single" collapsible className="space-y-4">
                {section.questions.map((item, itemIndex) => (
                  <AccordionItem
                    key={itemIndex}
                    value={`${sectionIndex}-${itemIndex}`}
                    className="border border-border rounded-lg px-6 bg-background/50"
                  >
                    <AccordionTrigger className="text-left hover:no-underline py-4">
                      <span className="font-semibold">{item.q}</span>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-4 leading-relaxed">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      </div>

      {/* Still Have Questions CTA */}
      <div className="container mx-auto px-4 py-20 border-t border-border">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="w-8 h-8 text-accent" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Still have questions?</h2>
          <p className="text-muted-foreground text-lg mb-8">
            Can't find the answer you're looking for? We're here to help. Get started and use the in-app feedback widget to reach us directly.
          </p>
          <Button
            size="lg"
            onClick={() => navigate('/auth')}
            className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-lg text-lg px-8"
          >
            Get Started Now
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-primary rounded-3xl p-12 shadow-glow text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to stop scrambling for content?
            </h2>
            <p className="text-primary-foreground/90 text-lg mb-8 max-w-2xl mx-auto">
              Set up your brand voice in 5 minutes and generate your first strategic content calendar.
            </p>
            <Button
              size="lg"
              onClick={() => navigate('/auth')}
              className="bg-background text-foreground hover:bg-background/90 text-lg px-8 shadow-lg"
            >
              Start Planning Today
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

export default FAQ;
