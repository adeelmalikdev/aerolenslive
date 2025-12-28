import { Link } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';
import { cityBlogs } from '@/data/cityBlogs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Footer } from '@/components/home/Footer';

export default function Blogs() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-secondary/30 py-16 sm:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Travel Guides
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover inspiring travel stories, local tips, and everything you need to plan your next adventure.
          </p>
        </div>
      </div>

      {/* Blog Grid */}
      <div className="container mx-auto px-4 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {cityBlogs.map((blog) => (
            <Link key={blog.id} to={`/blogs/${blog.slug}`}>
              <Card className="group overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 h-full">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={blog.heroImage}
                    alt={`${blog.city}, ${blog.country}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex gap-1">
                    {blog.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs bg-primary/80 text-primary-foreground">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg text-primary mb-1">
                    {blog.city}, {blog.country}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {blog.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {blog.readTime}
                    </span>
                    <span className="flex items-center gap-1 text-primary text-sm group-hover:gap-2 transition-all">
                      Read more
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
