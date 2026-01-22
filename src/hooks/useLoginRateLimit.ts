import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getClientIPInfo } from '@/hooks/useIPLogger';

interface RateLimitResult {
  blocked: boolean;
  remaining_attempts: number;
  retry_after_seconds: number;
  reason: string | null;
}

export const useLoginRateLimit = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitResult | null>(null);

  const checkRateLimit = useCallback(async (email: string): Promise<RateLimitResult> => {
    setIsChecking(true);
    try {
      const ipInfo = await getClientIPInfo();
      const ipAddress = ipInfo?.ip || null;

      // Check recent failed attempts from login_attempts table
      const windowMinutes = 15;
      const maxAttempts = 5;
      const lockoutMinutes = 30;
      
      const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
      
      const { data: attempts, error } = await supabase
        .from('login_attempts')
        .select('created_at')
        .eq('email', email)
        .eq('success', false)
        .gte('created_at', windowStart);

      if (error) {
        console.error('Rate limit check error:', error);
        // If check fails, allow the attempt (fail open for UX)
        return {
          blocked: false,
          remaining_attempts: maxAttempts,
          retry_after_seconds: 0,
          reason: null,
        };
      }

      const failedCount = attempts?.length || 0;
      const isBlocked = failedCount >= maxAttempts;
      
      let retryAfterSeconds = 0;
      if (isBlocked && attempts && attempts.length > 0) {
        const lastAttempt = new Date(attempts[0].created_at);
        const unblockTime = new Date(lastAttempt.getTime() + lockoutMinutes * 60 * 1000);
        retryAfterSeconds = Math.max(0, Math.ceil((unblockTime.getTime() - Date.now()) / 1000));
      }

      const result: RateLimitResult = {
        blocked: isBlocked && retryAfterSeconds > 0,
        remaining_attempts: Math.max(0, maxAttempts - failedCount),
        retry_after_seconds: retryAfterSeconds,
        reason: isBlocked ? 'Too many failed login attempts' : null,
      };
      
      setRateLimitInfo(result);
      return result;
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return {
        blocked: false,
        remaining_attempts: 5,
        retry_after_seconds: 0,
        reason: null,
      };
    } finally {
      setIsChecking(false);
    }
  }, []);

  const recordAttempt = useCallback(async (email: string, wasSuccessful: boolean): Promise<void> => {
    try {
      const ipInfo = await getClientIPInfo();
      const ipAddress = ipInfo?.ip || null;

      await supabase
        .from('login_attempts')
        .insert({
          email,
          ip_address: ipAddress,
          success: wasSuccessful,
          user_agent: navigator.userAgent,
          failure_reason: wasSuccessful ? null : 'Invalid credentials',
        });
    } catch (error) {
      console.error('Failed to record login attempt:', error);
    }
  }, []);

  const formatRetryTime = (seconds: number): string => {
    if (seconds <= 0) return '';
    const minutes = Math.ceil(seconds / 60);
    if (minutes === 1) return '1 minute';
    return `${minutes} minutes`;
  };

  const clearRateLimitInfo = useCallback(() => {
    setRateLimitInfo(null);
  }, []);

  return {
    checkRateLimit,
    recordAttempt,
    isChecking,
    rateLimitInfo,
    formatRetryTime,
    clearRateLimitInfo,
  };
};
