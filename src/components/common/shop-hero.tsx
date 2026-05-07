import { MapPin, Star } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ShopHeroProps {
  name: string;
  logoUrl?: string;
  city?: string;
  rating?: number;
}

export function ShopHero({ name, logoUrl, city, rating }: ShopHeroProps) {
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center sm:flex-row sm:items-start sm:text-left">
      <Avatar className="size-20 sm:size-24">
        <AvatarImage src={logoUrl} alt={name} />
        <AvatarFallback className="text-2xl font-semibold">
          {initial}
        </AvatarFallback>
      </Avatar>
      <div className="space-y-1">
        <h1 className="text-2xl font-bold sm:text-3xl">{name}</h1>
        {city && (
          <p className="text-muted-foreground flex items-center justify-center gap-1 sm:justify-start">
            <MapPin className="size-4" />
            {city}
          </p>
        )}
        {rating !== undefined && (
          <p className="flex items-center justify-center gap-1 text-sm font-medium sm:justify-start">
            <Star className="size-4 fill-yellow-400 text-yellow-400" />
            {rating.toFixed(1)}
          </p>
        )}
      </div>
    </div>
  );
}
