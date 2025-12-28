import { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useContactForm, ContactFormData } from '@/hooks/useContactForm';

export function ContactSection() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const { submitContact, loading } = useContactForm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await submitContact(formData);
    if (success) {
      setFormData({ name: '', email: '', subject: '', message: '' });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <section id="contact" className="py-16 lg:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Contact Us
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Info */}
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Email Us</h3>
                <p className="text-muted-foreground">support@skyway.com</p>
                <p className="text-muted-foreground">bookings@skyway.com</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <Phone className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Call Us</h3>
                <p className="text-muted-foreground">+1 (800) SKY-WAYS</p>
                <p className="text-muted-foreground">Available 24/7</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Visit Us</h3>
                <p className="text-muted-foreground">123 Aviation Boulevard</p>
                <p className="text-muted-foreground">New York, NY 10001</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <form onSubmit={handleSubmit} className="space-y-6 bg-card p-8 rounded-xl shadow-sm border">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Your Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                name="subject"
                placeholder="How can we help?"
                value={formData.subject}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                name="message"
                placeholder="Tell us more about your inquiry..."
                rows={5}
                value={formData.message}
                onChange={handleChange}
                required
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Sending...' : 'Send Message'}
              <Send className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
