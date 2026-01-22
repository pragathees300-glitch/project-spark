import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useChatReassignmentLogs } from '@/hooks/useChatReassignmentLogs';
import { format } from 'date-fns';
import { FileText, ArrowRight, Bot } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const getTriggerBadgeVariant = (reason: string | null) => {
  switch (reason) {
    case 'user_left':
    case 'page_close':
    case 'tab_hidden':
      return 'secondary';
    case 'inactivity_timeout':
      return 'outline';
    case 'user_reconnected':
    case 'reconnect_after_leave':
      return 'default';
    case 'agent_went_offline':
    case 'agent_became_available':
      return 'secondary';
    case 'manual_reassign':
      return 'default';
    default:
      return 'outline';
  }
};

const formatTriggerReason = (reason: string | null) => {
  if (!reason) return 'Unknown';
  return reason
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

export const ChatReassignmentLogs = () => {
  const { logs, isLoading } = useChatReassignmentLogs(100);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle>Reassignment Logs</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <CardTitle>Reassignment Logs</CardTitle>
        </div>
        <CardDescription>
          Audit trail of all chat reassignment events
        </CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No reassignment logs yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Agent Change</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(log.created_at), 'MMM d, HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {log.session_id?.slice(0, 8) || 'N/A'}...
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Bot className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {log.from_agent_profile?.name || 'None'}
                          </span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {log.to_agent_profile?.name || 'Unassigned'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTriggerBadgeVariant(log.reason)}>
                        {formatTriggerReason(log.reason)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
