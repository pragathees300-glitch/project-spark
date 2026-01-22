import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Medal, Award, Crown, IndianRupee } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTopDropshippers } from '@/hooks/useTopDropshippers';

const rankIcons: Record<number, React.ReactNode> = {
  1: <Crown className="w-5 h-5 text-yellow-500" />,
  2: <Medal className="w-5 h-5 text-slate-400" />,
  3: <Medal className="w-5 h-5 text-amber-600" />,
};

export const AdminManagedLeaderboard: React.FC = () => {
  const { user } = useAuth();
  const { topDropshippers, isLoading } = useTopDropshippers();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (topDropshippers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Top Dropshippers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Award className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Leaderboard coming soon!</p>
            <p className="text-xs">Check back later to see top performers.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Top Dropshippers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {topDropshippers.map((entry, index) => {
          const rankPosition = entry.sort_order ?? entry.rank ?? index + 1;
          return (
            <div
              key={entry.id}
              className="flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-muted/50"
            >
              <div className="w-8 flex justify-center">
                {rankIcons[rankPosition] || (
                  <span className="text-sm font-medium text-muted-foreground">
                    #{rankPosition}
                  </span>
                )}
              </div>

              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-muted">
                  {entry.display_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {entry.display_name}
                </p>
                {(entry.earnings ?? 0) > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <IndianRupee className="w-3 h-3" />
                    {(entry.earnings ?? 0).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
