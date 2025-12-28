import { useState } from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const testimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'Frequent Traveler',
    content: 'SkyFinder made booking my family vacation so easy. Found an amazing deal on flights to Europe and the whole process was seamless from start to finish.',
  },
  {
    id: 2,
    name: 'Michael Chen',
    role: 'Business Traveler',
    content: 'As someone who travels weekly for work, I rely on SkyFinder to find the best last-minute deals. The real-time pricing has saved me thousands.',
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    role: 'Adventure Seeker',
    content: 'I love how SkyFinder shows me flexible date options. I discovered that flying two days earlier saved me $400 on my trip to Japan!',
  },
];

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const current = testimonials[currentIndex];

  return (
    <section className="py-10 sm:py-16 lg:py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2 text-center">
            What Our Travelers Say
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground text-center mb-6 sm:mb-12">
            Join thousands of satisfied travelers
          </p>

          <Card className="relative">
            <CardContent className="p-5 sm:p-8 lg:p-12">
              <Quote className="h-8 w-8 sm:h-10 sm:w-10 text-primary/20 mb-3 sm:mb-4" />
              <p className="text-base sm:text-lg lg:text-xl text-foreground mb-4 sm:mb-6 italic">
                "{current.content}"
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{current.name}</p>
                  <p className="text-sm text-muted-foreground">{current.role}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={prevTestimonial}
                    className="rounded-full"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={nextTestimonial}
                    className="rounded-full"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dots indicator */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === currentIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}