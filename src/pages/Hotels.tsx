import { useState, useEffect } from 'react';
import { Footer } from '@/components/home/Footer';
import { HotelSearchForm } from '@/components/hotel/HotelSearchForm';
import { HotelResults } from '@/components/hotel/HotelResults';
import { HotelDetailsModal } from '@/components/hotel/HotelDetailsModal';
import { HotelStatusForm } from '@/components/hotel/HotelStatusForm';
import { useHotelSearch } from '@/hooks/useHotelSearch';
import { HotelOffer, HotelSearchParams } from '@/types/hotel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, ClipboardCheck } from 'lucide-react';

export default function Hotels() {
  const { hotels, loading, error, searchHotels } = useHotelSearch();
  const [selectedHotel, setSelectedHotel] = useState<HotelOffer | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    document.title = 'Hotel Booking - Find & Book Hotels Worldwide | SkyWings';
  }, []);

  const handleSearch = (params: HotelSearchParams) => {
    setHasSearched(true);
    searchHotels(params);
  };

  return (
    <>
      <main className="min-h-screen bg-background pt-20">
        {/* Hero section */}
        <section className="bg-gradient-to-br from-primary/10 to-primary/5 py-12">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
                Find Your Perfect Stay
              </h1>
              <p className="text-muted-foreground">
                Search and compare hotels from around the world
              </p>
            </div>
            
            <Tabs defaultValue="search" className="w-full">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
                <TabsTrigger value="search" className="gap-2">
                  <Search className="h-4 w-4" />
                  Book
                </TabsTrigger>
                <TabsTrigger value="status" className="gap-2">
                  <ClipboardCheck className="h-4 w-4" />
                  Status
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="search">
                <HotelSearchForm onSearch={handleSearch} loading={loading} />
              </TabsContent>
              
              <TabsContent value="status">
                <div className="max-w-2xl mx-auto bg-card rounded-xl shadow-lg p-6">
                  <HotelStatusForm />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Results section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <HotelResults 
              hotels={hotels}
              loading={loading}
              error={error}
              onSelectHotel={setSelectedHotel}
              hasSearched={hasSearched}
            />
          </div>
        </section>

        <Footer />
      </main>

      <HotelDetailsModal 
        hotel={selectedHotel}
        open={!!selectedHotel}
        onClose={() => setSelectedHotel(null)}
      />
    </>
  );
}
