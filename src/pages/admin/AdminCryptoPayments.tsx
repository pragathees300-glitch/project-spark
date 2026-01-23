import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MoreHorizontal,
  ExternalLink,
  Copy,
  Check,
  Wallet,
  Loader2,
  Eye
} from 'lucide-react';
import { useCryptoPayments, CryptoPayment } from '@/hooks/useCryptoPayments';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const AdminCryptoPayments: React.FC = () => {
  const { toast } = useToast();
  const { 
    payments, 
    isLoading, 
    paymentCounts, 
    updatePaymentStatus,
    isUpdatingStatus 
  } = useCryptoPayments();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedPayment, setSelectedPayment] = useState<CryptoPayment | null>(null);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [proofDialogOpen, setProofDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.transaction_hash?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.user_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = activeTab === 'all' || payment.status === activeTab;
    
    return matchesSearch && matchesTab;
  });

  const handleCopyHash = async (hash: string) => {
    await navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    toast({ title: 'Copied!', description: 'Transaction hash copied to clipboard.' });
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleVerify = async () => {
    if (!selectedPayment) return;
    await updatePaymentStatus({
      paymentId: selectedPayment.id,
      status: 'confirmed',
      adminNotes: adminNotes || undefined,
    });
    setVerifyDialogOpen(false);
    setSelectedPayment(null);
    setAdminNotes('');
  };

  const handleReject = async () => {
    if (!selectedPayment) return;
    await updatePaymentStatus({
      paymentId: selectedPayment.id,
      status: 'rejected',
      adminNotes: adminNotes || undefined,
    });
    setRejectDialogOpen(false);
    setSelectedPayment(null);
    setAdminNotes('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30"><Clock className="w-3 h-3" />Pending</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30"><CheckCircle2 className="w-3 h-3" />Confirmed</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="gap-1 text-red-600 border-red-300 bg-red-50 dark:bg-red-950/30"><XCircle className="w-3 h-3" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-9 w-64" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Crypto Payments</h1>
          <p className="text-muted-foreground mt-1">
            View and verify pending crypto payments from users.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-600">Pending</p>
                  <p className="text-3xl font-bold text-amber-700">{paymentCounts.pending}</p>
                </div>
                <Clock className="w-10 h-10 text-amber-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-600">Confirmed</p>
                  <p className="text-3xl font-bold text-emerald-700">{paymentCounts.confirmed}</p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-emerald-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Rejected</p>
                  <p className="text-3xl font-bold text-red-700">{paymentCounts.rejected}</p>
                </div>
                <XCircle className="w-10 h-10 text-red-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payments Table */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Payment Submissions
              </CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search payments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4 flex-wrap">
                <TabsTrigger value="pending" className="gap-1">
                  Pending
                  {paymentCounts.pending > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5">{paymentCounts.pending}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-0">
                {filteredPayments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No {activeTab === 'all' ? '' : activeTab} payments found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Proof</TableHead>
                          <TableHead>Tx Hash</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPayments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{payment.user_name || 'Unknown'}</span>
                                <span className="text-xs text-muted-foreground">{payment.user_email}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold text-primary">
                                ${payment.amount.toFixed(2)}
                              </span>
                            </TableCell>
                            <TableCell>
                              {payment.proof_url ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 gap-1 text-xs"
                                  onClick={() => {
                                    setSelectedPayment(payment);
                                    setProofDialogOpen(true);
                                  }}
                                >
                                  <Eye className="w-3 h-3" />
                                  View
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground">No proof</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {payment.transaction_hash ? (
                                <div className="flex items-center gap-1">
                                  <span className="font-mono text-xs truncate max-w-[100px]">
                                    {payment.transaction_hash.slice(0, 8)}...
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => handleCopyHash(payment.transaction_hash!)}
                                  >
                                    {copiedHash === payment.transaction_hash ? (
                                      <Check className="w-3 h-3 text-emerald-500" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>{getStatusBadge(payment.status)}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-xs">
                                  {formatDistanceToNow(new Date(payment.created_at), { addSuffix: true })}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(payment.created_at), 'MMM d, yyyy')}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {payment.status === 'pending' && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      className="text-emerald-600"
                                      onClick={() => {
                                        setSelectedPayment(payment);
                                        setVerifyDialogOpen(true);
                                      }}
                                    >
                                      <CheckCircle2 className="w-4 h-4 mr-2" />
                                      Confirm Payment
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() => {
                                        setSelectedPayment(payment);
                                        setRejectDialogOpen(true);
                                      }}
                                    >
                                      <XCircle className="w-4 h-4 mr-2" />
                                      Reject Payment
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Verify Dialog */}
        <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                <p className="text-sm text-emerald-800 dark:text-emerald-200">
                  Confirming this payment will credit the user's wallet with ${selectedPayment?.amount.toFixed(2)}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Admin Notes (optional)</label>
                <Textarea
                  placeholder="Add notes about this verification..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setVerifyDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleVerify}
                disabled={isUpdatingStatus}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isUpdatingStatus ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Confirm Payment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-800 dark:text-red-200">
                  Are you sure you want to reject this payment of ${selectedPayment?.amount.toFixed(2)}?
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Rejection Reason (optional)</label>
                <Textarea
                  placeholder="Reason for rejection..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                disabled={isUpdatingStatus}
                variant="destructive"
              >
                {isUpdatingStatus ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Reject Payment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Proof Dialog */}
        <Dialog open={proofDialogOpen} onOpenChange={setProofDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Payment Proof</DialogTitle>
            </DialogHeader>
            {selectedPayment?.proof_url && (
              <div className="space-y-4">
                <img
                  src={selectedPayment.proof_url}
                  alt="Payment proof"
                  className="w-full rounded-lg border"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => window.open(selectedPayment.proof_url!, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Full Size
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminCryptoPayments;
