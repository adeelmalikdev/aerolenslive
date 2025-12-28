import parisImage from '@/assets/destination-paris.jpg';
import rioImage from '@/assets/destination-rio.jpg';
import londonImage from '@/assets/destination-london.jpg';
import tokyoImage from '@/assets/destination-tokyo.jpg';
import newyorkImage from '@/assets/destination-newyork.jpg';
import dubaiImage from '@/assets/destination-dubai.jpg';
import sydneyImage from '@/assets/destination-sydney.jpg';
import barcelonaImage from '@/assets/destination-barcelona.jpg';

export interface CityBlog {
  id: number;
  slug: string;
  city: string;
  country: string;
  heroImage: string;
  excerpt: string;
  readTime: string;
  tags: string[];
  content: {
    overview: string;
    topAttractions: { name: string; description: string }[];
    bestTimeToVisit: string;
    localCuisine: { dish: string; description: string }[];
    travelTips: string[];
  };
}

export const cityBlogs: CityBlog[] = [
  {
    id: 1,
    slug: 'paris-france',
    city: 'Paris',
    country: 'France',
    heroImage: parisImage,
    excerpt: 'Discover the City of Light, where romance meets art and every corner tells a story of elegance and history.',
    readTime: '8 min read',
    tags: ['Romance', 'Culture', 'Art'],
    content: {
      overview: "Paris, the capital of France, is one of the world's most iconic cities. Known as the City of Light, Paris captivates visitors with its stunning architecture, world-class museums, and romantic ambiance. From the majestic Eiffel Tower to the artistic treasures of the Louvre, Paris offers an unparalleled blend of history, culture, and sophistication. The city's charming neighborhoods, each with their own distinct character, invite exploration on foot, while its legendary cafés and restaurants promise unforgettable culinary experiences.",
      topAttractions: [
        { name: 'Eiffel Tower', description: 'The iconic iron lattice tower offering panoramic views of the city from its observation decks.' },
        { name: 'Louvre Museum', description: 'The world\'s largest art museum, home to the Mona Lisa and thousands of masterpieces.' },
        { name: 'Notre-Dame Cathedral', description: 'A masterpiece of Gothic architecture, currently under restoration after the 2019 fire.' },
        { name: 'Montmartre', description: 'A charming hilltop neighborhood known for its artistic history and the stunning Sacré-Cœur basilica.' },
        { name: 'Champs-Élysées', description: 'The famous avenue lined with luxury shops, cafés, and leading to the Arc de Triomphe.' }
      ],
      bestTimeToVisit: 'The best time to visit Paris is from April to June and September to November when the weather is mild and the crowds are smaller. Spring brings blooming gardens and outdoor café culture, while fall offers stunning foliage and cultural events. Summer can be hot and crowded, but offers long days for sightseeing.',
      localCuisine: [
        { dish: 'Croissants', description: 'Flaky, buttery pastries perfect for breakfast with café au lait.' },
        { dish: 'Coq au Vin', description: 'Classic French dish of chicken braised in red wine with mushrooms and onions.' },
        { dish: 'Crème Brûlée', description: 'Rich custard dessert topped with a layer of caramelized sugar.' },
        { dish: 'Escargots', description: 'Snails cooked in garlic herb butter, a traditional French delicacy.' }
      ],
      travelTips: [
        'Purchase a Paris Museum Pass for skip-the-line access to major attractions.',
        'Learn basic French phrases – locals appreciate the effort.',
        'The Metro is the most efficient way to get around the city.',
        'Book popular restaurants in advance, especially for dinner.',
        'Carry cash for smaller cafés and bakeries.'
      ]
    }
  },
  {
    id: 2,
    slug: 'rio-de-janeiro-brazil',
    city: 'Rio de Janeiro',
    country: 'Brazil',
    heroImage: rioImage,
    excerpt: 'Experience the vibrant energy of Rio, where stunning beaches meet lush mountains and samba rhythms fill the air.',
    readTime: '7 min read',
    tags: ['Beach', 'Adventure', 'Nightlife'],
    content: {
      overview: "Rio de Janeiro is a city that pulses with life, music, and natural beauty. Nestled between lush green mountains and the sparkling Atlantic Ocean, Rio offers some of the world's most spectacular urban landscapes. The iconic Christ the Redeemer statue watches over the city from Corcovado mountain, while Sugarloaf Mountain provides breathtaking panoramic views. From the legendary beaches of Copacabana and Ipanema to the colorful streets of Santa Teresa, Rio is a feast for the senses.",
      topAttractions: [
        { name: 'Christ the Redeemer', description: 'The iconic Art Deco statue of Jesus Christ atop Corcovado mountain, one of the New Seven Wonders of the World.' },
        { name: 'Sugarloaf Mountain', description: 'Take a cable car to the peak for stunning 360-degree views of the city and coastline.' },
        { name: 'Copacabana Beach', description: 'The world-famous beach known for its vibrant atmosphere and iconic wave-patterned promenade.' },
        { name: 'Ipanema Beach', description: 'A trendy beach neighborhood immortalized in the bossa nova song "The Girl from Ipanema."' },
        { name: 'Escadaria Selarón', description: 'A colorful mosaic staircase created by Chilean artist Jorge Selarón.' }
      ],
      bestTimeToVisit: 'The best time to visit Rio is from December to March for beach weather and Carnival celebrations in February or early March. For fewer crowds and lower prices, visit from April to June or August to October when the weather is still pleasant.',
      localCuisine: [
        { dish: 'Feijoada', description: 'Brazil\'s national dish – a hearty black bean stew with pork, served with rice and orange slices.' },
        { dish: 'Açaí Bowl', description: 'Frozen açaí berry topped with granola and fresh fruit, a refreshing beach snack.' },
        { dish: 'Pão de Queijo', description: 'Delicious cheese bread rolls made with tapioca flour.' },
        { dish: 'Caipirinha', description: 'Brazil\'s national cocktail made with cachaça, lime, and sugar.' }
      ],
      travelTips: [
        'Stay in Copacabana or Ipanema for beach access and safety.',
        'Use Uber or registered taxis rather than hailing cabs on the street.',
        'Book Christ the Redeemer tickets online to avoid long queues.',
        'Learn some basic Portuguese phrases – English is not widely spoken.',
        'Be mindful of belongings at the beach and in crowded areas.'
      ]
    }
  },
  {
    id: 3,
    slug: 'london-united-kingdom',
    city: 'London',
    country: 'United Kingdom',
    heroImage: londonImage,
    excerpt: 'Explore the historic charm of London, where centuries of royal heritage blend with cutting-edge modernity.',
    readTime: '9 min read',
    tags: ['History', 'Culture', 'Shopping'],
    content: {
      overview: "London, the capital of England and the United Kingdom, is a global city with a rich history spanning over 2,000 years. From the Tower of London to the Houses of Parliament, the city is a living museum of British heritage. Yet London is also fiercely contemporary, with world-class theater, diverse neighborhoods, innovative cuisine, and a vibrant arts scene. The River Thames winds through the heart of the city, connecting historic landmarks with modern architectural marvels.",
      topAttractions: [
        { name: 'Tower of London', description: 'A historic castle housing the Crown Jewels and centuries of royal history.' },
        { name: 'British Museum', description: 'One of the world\'s greatest museums, with free admission and millions of artifacts.' },
        { name: 'Buckingham Palace', description: 'The official residence of the British monarch, famous for the Changing of the Guard ceremony.' },
        { name: 'Big Ben & Parliament', description: 'The iconic clock tower and Gothic Revival palace on the Thames.' },
        { name: 'Tower Bridge', description: 'London\'s most famous bridge, with a glass walkway offering stunning views.' }
      ],
      bestTimeToVisit: 'The best time to visit London is from March to May and September to November. Spring brings blooming parks and mild weather, while fall offers cultural events and fewer tourists. Summer is peak season with long days but higher prices.',
      localCuisine: [
        { dish: 'Fish and Chips', description: 'The classic British dish of battered fish with thick-cut fries.' },
        { dish: 'Full English Breakfast', description: 'A hearty morning meal with eggs, bacon, sausages, beans, and toast.' },
        { dish: 'Afternoon Tea', description: 'A quintessentially British experience with tea, sandwiches, and pastries.' },
        { dish: 'Sunday Roast', description: 'Traditional roasted meat with vegetables and Yorkshire pudding.' }
      ],
      travelTips: [
        'Get an Oyster card or use contactless payment for the Tube and buses.',
        'Many world-class museums are free – take advantage of them.',
        'Book West End theater tickets in advance for popular shows.',
        'The weather is unpredictable – always carry an umbrella.',
        'Walk along the South Bank for stunning views and street entertainment.'
      ]
    }
  },
  {
    id: 4,
    slug: 'tokyo-japan',
    city: 'Tokyo',
    country: 'Japan',
    heroImage: tokyoImage,
    excerpt: 'Immerse yourself in Tokyo, where ancient temples coexist with neon-lit streets and cutting-edge technology.',
    readTime: '8 min read',
    tags: ['Technology', 'Culture', 'Food'],
    content: {
      overview: "Tokyo is a city of fascinating contrasts, where ultra-modern skyscrapers stand alongside ancient temples and traditional gardens. As Japan's capital and the world's most populous metropolitan area, Tokyo offers an endless array of experiences. From the serene beauty of cherry blossoms in spring to the electric energy of neighborhoods like Shibuya and Shinjuku, Tokyo captivates visitors with its unique blend of tradition and innovation. The city is also a culinary paradise, boasting more Michelin stars than any other city in the world.",
      topAttractions: [
        { name: 'Senso-ji Temple', description: 'Tokyo\'s oldest and most significant Buddhist temple, located in the historic Asakusa district.' },
        { name: 'Shibuya Crossing', description: 'The world\'s busiest pedestrian crossing, an icon of Tokyo\'s urban energy.' },
        { name: 'Meiji Shrine', description: 'A peaceful Shinto shrine surrounded by a serene forest in the heart of the city.' },
        { name: 'Tokyo Skytree', description: 'The world\'s tallest tower, offering panoramic views of the sprawling metropolis.' },
        { name: 'Tsukiji Outer Market', description: 'A foodie\'s paradise with fresh seafood, street food, and culinary supplies.' }
      ],
      bestTimeToVisit: 'The best time to visit Tokyo is from March to May for cherry blossom season, or September to November for pleasant autumn weather and fall foliage. Summer is hot and humid, while winter offers clear skies and fewer tourists.',
      localCuisine: [
        { dish: 'Sushi', description: 'Fresh, expertly crafted sushi ranging from conveyor belt to Michelin-starred omakase.' },
        { dish: 'Ramen', description: 'Rich, flavorful noodle soup in countless regional styles.' },
        { dish: 'Tempura', description: 'Lightly battered and fried seafood and vegetables.' },
        { dish: 'Yakitori', description: 'Grilled chicken skewers, perfect with a cold beer.' }
      ],
      travelTips: [
        'Get a Suica or Pasmo card for seamless train and subway travel.',
        'Learn basic Japanese phrases and bowing etiquette.',
        'Cash is still king in many places – carry yen.',
        'Download offline maps – not all stations have clear English signage.',
        'Visit convenience stores (konbini) for quality, affordable meals.'
      ]
    }
  },
  {
    id: 5,
    slug: 'new-york-usa',
    city: 'New York',
    country: 'USA',
    heroImage: newyorkImage,
    excerpt: 'Discover the city that never sleeps, where world-famous landmarks meet diverse neighborhoods and endless possibilities.',
    readTime: '8 min read',
    tags: ['Urban', 'Culture', 'Entertainment'],
    content: {
      overview: "New York City is the ultimate urban destination, a melting pot of cultures, cuisines, and experiences. From the towering skyscrapers of Manhattan to the artistic streets of Brooklyn, NYC offers something for everyone. The city that never sleeps is home to world-famous attractions like the Statue of Liberty, Central Park, and Broadway, alongside hidden gems waiting to be discovered in its diverse neighborhoods. Whether you're seeking art, food, fashion, or simply the electric energy of city life, New York delivers.",
      topAttractions: [
        { name: 'Statue of Liberty', description: 'The iconic symbol of freedom and democracy, best visited via ferry from Battery Park.' },
        { name: 'Central Park', description: 'An 843-acre oasis in the heart of Manhattan, perfect for walking, biking, or picnicking.' },
        { name: 'Times Square', description: 'The bright, bustling heart of NYC, famous for its neon lights and Broadway theaters.' },
        { name: 'Empire State Building', description: 'The Art Deco masterpiece offering stunning views from its observation decks.' },
        { name: 'Brooklyn Bridge', description: 'Walk across this iconic bridge for spectacular views of Manhattan and the harbor.' }
      ],
      bestTimeToVisit: 'The best time to visit New York is from April to June and September to November. Spring brings mild weather and blooming parks, while fall offers beautiful foliage and cultural events. Summer can be hot and crowded, while winter, though cold, offers magical holiday decorations.',
      localCuisine: [
        { dish: 'New York Pizza', description: 'Thin-crust, foldable slices available at pizzerias on nearly every corner.' },
        { dish: 'Bagels', description: 'Chewy, boiled bagels with cream cheese – a quintessential NYC breakfast.' },
        { dish: 'Pastrami Sandwich', description: 'Piled-high smoked meat on rye bread from legendary delis.' },
        { dish: 'Cheesecake', description: 'Rich, creamy New York-style cheesecake, a must-try dessert.' }
      ],
      travelTips: [
        'Get a MetroCard or use OMNY for subway and bus travel.',
        'Walk whenever possible – it\'s often faster than driving.',
        'Book Broadway shows in advance or try TKTS for discounted same-day tickets.',
        'Explore beyond Manhattan – Brooklyn, Queens, and the Bronx offer unique experiences.',
        'Tipping 18-20% is standard at restaurants.'
      ]
    }
  },
  {
    id: 6,
    slug: 'dubai-uae',
    city: 'Dubai',
    country: 'UAE',
    heroImage: dubaiImage,
    excerpt: 'Experience the future in Dubai, where record-breaking architecture meets luxury shopping and desert adventures.',
    readTime: '7 min read',
    tags: ['Luxury', 'Architecture', 'Shopping'],
    content: {
      overview: "Dubai is a city of superlatives – home to the world's tallest building, largest shopping mall, and most ambitious architectural projects. Rising from the desert in just a few decades, Dubai has transformed into a global hub of luxury, innovation, and entertainment. Beyond the glittering skyscrapers, visitors can explore traditional souks, experience desert safaris, and relax on pristine beaches. Dubai seamlessly blends Arabian heritage with futuristic vision, creating an experience unlike anywhere else on Earth.",
      topAttractions: [
        { name: 'Burj Khalifa', description: 'The world\'s tallest building at 828 meters, with observation decks offering stunning views.' },
        { name: 'Dubai Mall', description: 'One of the world\'s largest malls, featuring an aquarium, ice rink, and endless shopping.' },
        { name: 'Palm Jumeirah', description: 'The iconic palm-shaped artificial island with luxury hotels and beaches.' },
        { name: 'Dubai Creek', description: 'The historic heart of Dubai, where you can explore traditional souks by abra boat.' },
        { name: 'Desert Safari', description: 'Experience dune bashing, camel rides, and traditional Bedouin camps.' }
      ],
      bestTimeToVisit: 'The best time to visit Dubai is from November to March when temperatures are pleasant (20-30°C). Summer months (June to September) are extremely hot, with temperatures often exceeding 40°C, though indoor attractions and water parks provide relief.',
      localCuisine: [
        { dish: 'Shawarma', description: 'Seasoned meat wrapped in flatbread with garlic sauce and pickles.' },
        { dish: 'Hummus & Falafel', description: 'Middle Eastern staples found throughout the city.' },
        { dish: 'Al Harees', description: 'Traditional Emirati dish of wheat and meat, slow-cooked to perfection.' },
        { dish: 'Luqaimat', description: 'Sweet dumplings drizzled with date syrup, a popular local dessert.' }
      ],
      travelTips: [
        'Dress modestly, especially when visiting malls and cultural sites.',
        'The Dubai Metro is clean, efficient, and connects major attractions.',
        'Friday is the holy day – some attractions may have different hours.',
        'Alcohol is only served in licensed venues (hotels and some restaurants).',
        'Book Burj Khalifa tickets online in advance to secure your preferred time.'
      ]
    }
  },
  {
    id: 7,
    slug: 'sydney-australia',
    city: 'Sydney',
    country: 'Australia',
    heroImage: sydneyImage,
    excerpt: 'Fall in love with Sydney, where world-famous beaches meet stunning architecture and a laid-back lifestyle.',
    readTime: '7 min read',
    tags: ['Beach', 'Nature', 'Adventure'],
    content: {
      overview: "Sydney, Australia's largest city, is blessed with natural beauty and a vibrant cultural scene. The iconic Sydney Opera House and Harbour Bridge create one of the world's most recognizable skylines, while nearby beaches like Bondi and Manly offer world-class surf and sand. Sydney's neighborhoods each have their own personality, from the historic Rocks district to the trendy cafés of Surry Hills. The city's outdoor lifestyle, diverse food scene, and friendly locals make it an unforgettable destination.",
      topAttractions: [
        { name: 'Sydney Opera House', description: 'The UNESCO-listed architectural masterpiece hosting world-class performances.' },
        { name: 'Sydney Harbour Bridge', description: 'Walk across or climb to the top for panoramic harbor views.' },
        { name: 'Bondi Beach', description: 'Australia\'s most famous beach, perfect for surfing, swimming, or the coastal walk to Coogee.' },
        { name: 'Taronga Zoo', description: 'A zoo with stunning harbor views, home to native Australian wildlife.' },
        { name: 'The Rocks', description: 'Sydney\'s oldest neighborhood with cobblestone streets, markets, and historic pubs.' }
      ],
      bestTimeToVisit: 'The best time to visit Sydney is from September to November (spring) and March to May (autumn). Summer (December to February) is peak season with warm weather and holiday crowds. Winter (June to August) is mild and perfect for whale watching.',
      localCuisine: [
        { dish: 'Meat Pie', description: 'The classic Australian hand pie filled with minced meat and gravy.' },
        { dish: 'Fish and Chips', description: 'Fresh seafood enjoyed at harbourside fish markets and beach cafés.' },
        { dish: 'Flat White', description: 'Australia\'s signature coffee – silky steamed milk over espresso.' },
        { dish: 'Pavlova', description: 'A meringue dessert topped with fresh cream and seasonal fruits.' }
      ],
      travelTips: [
        'Get an Opal card for seamless travel on trains, buses, and ferries.',
        'Take a ferry to Manly Beach for stunning harbor views.',
        'Wear sunscreen – Australian sun is intense, even on cloudy days.',
        'Swim between the flags at beaches for lifeguard-patrolled areas.',
        'Explore beyond the city – the Blue Mountains are just two hours away.'
      ]
    }
  },
  {
    id: 8,
    slug: 'barcelona-spain',
    city: 'Barcelona',
    country: 'Spain',
    heroImage: barcelonaImage,
    excerpt: 'Explore Barcelona, where Gaudí\'s masterpieces rise above medieval streets and Mediterranean beaches await.',
    readTime: '8 min read',
    tags: ['Architecture', 'Beach', 'Food'],
    content: {
      overview: "Barcelona, the cosmopolitan capital of Catalonia, is a city that delights at every turn. The fantastical architecture of Antoni Gaudí, from the soaring Sagrada Família to the whimsical Park Güell, defines the city's skyline. Medieval Gothic quarters give way to vibrant modern neighborhoods, while the Mediterranean coastline offers beaches just minutes from the city center. Barcelona's food scene, from bustling markets to innovative restaurants, reflects the region's rich culinary traditions and creative spirit.",
      topAttractions: [
        { name: 'Sagrada Família', description: 'Gaudí\'s unfinished masterpiece, a breathtaking basilica under construction since 1882.' },
        { name: 'Park Güell', description: 'A whimsical public park showcasing Gaudí\'s colorful mosaic work and organic architecture.' },
        { name: 'La Rambla', description: 'The famous tree-lined pedestrian boulevard connecting Plaça Catalunya to the waterfront.' },
        { name: 'Gothic Quarter', description: 'A labyrinth of medieval streets, hidden plazas, and the stunning Barcelona Cathedral.' },
        { name: 'Casa Batlló', description: 'One of Gaudí\'s most imaginative buildings, with a façade resembling dragon scales.' }
      ],
      bestTimeToVisit: 'The best time to visit Barcelona is from April to June and September to October. These months offer pleasant weather and fewer crowds. Summer is peak season with beach weather but higher prices. Winter is mild and great for cultural attractions.',
      localCuisine: [
        { dish: 'Paella', description: 'The iconic Spanish rice dish, best enjoyed by the beach.' },
        { dish: 'Tapas', description: 'Small plates perfect for sharing – patatas bravas, jamón, and more.' },
        { dish: 'Pa amb Tomàquet', description: 'Simple but delicious – bread rubbed with tomato and olive oil.' },
        { dish: 'Crema Catalana', description: 'The Catalan version of crème brûlée, infused with citrus and cinnamon.' }
      ],
      travelTips: [
        'Book Sagrada Família tickets online weeks in advance.',
        'Beware of pickpockets on La Rambla and in crowded areas.',
        'Dinner is typically served late – 9pm or later.',
        'Learn a few Catalan phrases – locals appreciate it.',
        'The T-Casual card offers affordable travel on metro and buses.'
      ]
    }
  }
];
