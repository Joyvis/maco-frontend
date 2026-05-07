import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ShopStaff } from '@/types/shop';

interface StaffCardProps {
  staff: ShopStaff;
}

export function StaffCard({ staff }: StaffCardProps) {
  const initial = staff.name.charAt(0).toUpperCase();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        <Avatar className="size-12">
          <AvatarImage src={staff.photo_url} alt={staff.name} />
          <AvatarFallback>{initial}</AvatarFallback>
        </Avatar>
        <h3 className="font-semibold">{staff.name}</h3>
      </CardHeader>
      <CardContent>
        {staff.qualified_services.length === 0 ? (
          <p className="text-muted-foreground text-sm">Sem especialidades</p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {staff.qualified_services.map((s) => (
              <Badge key={s.id} variant="outline" className="text-xs">
                {s.name}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
