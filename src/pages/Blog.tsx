import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin } from 'lucide-react';
import { cityBlogs } from '@/data/cityBlogs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Footer } from '@/components/home/Footer';

export default function Blog() {
  const { slug } = useParams<{ slug: string }>();
  const blog = cityBlogs.find((b) => b.slug === slug);

  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Blog not found</h1>
          <Link to="/blogs" className="text-primary hover:underline">
            ← Back to all blogs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-[50vh] min-h-[400px]">
        <img
          src={blog.heroImage}
          alt={`${blog.city}, ${blog.country}`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-12">
          <div className="container mx-auto">
            <Link
              to="/blogs"
              className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Travel Guides
            </Link>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-foreground mb-2">
              {blog.city}, {blog.country}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-primary-foreground/80">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {blog.readTime}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {blog.country}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {blog.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="bg-primary/80 text-primary-foreground">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Overview */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Overview</h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              {blog.content.overview}
            </p>
          </section>

          <Separator className="my-8" />

          {/* Top Attractions */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Top Attractions</h2>
            <div className="grid gap-4">
              {blog.content.topAttractions.map((attraction, index) => (
                <Card key={index} className="border-border/50">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg text-primary mb-2">
                      {index + 1}. {attraction.name}
                    </h3>
                    <p className="text-muted-foreground">{attraction.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <Separator className="my-8" />

          {/* Best Time to Visit */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Best Time to Visit</h2>
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <p className="text-muted-foreground leading-relaxed">
                  {blog.content.bestTimeToVisit}
                </p>
              </CardContent>
            </Card>
          </section>

          <Separator className="my-8" />

          {/* Local Cuisine */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Local Cuisine</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {blog.content.localCuisine.map((item, index) => (
                <Card key={index} className="border-border/50">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-primary mb-1">{item.dish}</h3>
                    <p className="text-muted-foreground text-sm">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <Separator className="my-8" />

          {/* Travel Tips */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Travel Tips</h2>
            <Card className="border-border/50">
              <CardContent className="p-6">
                <ul className="space-y-3">
                  {blog.content.travelTips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center font-medium">
                        {index + 1}
                      </span>
                      <span className="text-muted-foreground">{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Related Destinations */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-6">Explore More Destinations</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cityBlogs
                .filter((b) => b.slug !== slug)
                .slice(0, 3)
                .map((relatedBlog) => (
                  <Link key={relatedBlog.id} to={`/blogs/${relatedBlog.slug}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
                      <div className="relative h-32">
                        <img
                          src={relatedBlog.heroImage}
                          alt={relatedBlog.city}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                      </div>
                      <CardContent className="p-3">
                        <h3 className="font-semibold text-foreground">
                          {relatedBlog.city}, {relatedBlog.country}
                        </h3>
                        <p className="text-xs text-muted-foreground">{relatedBlog.readTime}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}
