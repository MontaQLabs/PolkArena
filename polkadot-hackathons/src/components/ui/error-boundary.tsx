import { AlertCircle, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Button } from "./button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { useState, useEffect } from "react";

interface ErrorDisplayProps {
  error: Error | null;
  onRetry?: () => void;
  showRetry?: boolean;
  title?: string;
  isStale?: boolean;
}

export function ErrorDisplay({ 
  error, 
  onRetry, 
  showRetry = true, 
  title = "Something went wrong",
  isStale = false 
}: ErrorDisplayProps) {
  if (!error) return null;

  const isNetworkError = error.message.includes('Failed to fetch') || 
                        error.message.includes('Service Unavailable') ||
                        error.message.includes('temporarily unavailable');

  const isStaleDataError = error.message.includes('cached data') || isStale;

  // For stale data, show a less intrusive warning
  if (isStaleDataError) {
    return (
      <div className="flex items-center gap-2 p-3 mb-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
        <Wifi className="h-4 w-4" />
        <span className="text-sm">
          Showing cached data - some information may be outdated
        </span>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="ml-auto h-7 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        )}
      </div>
    );
  }

  // For network errors, show helpful message
  if (isNetworkError) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-red-800">
            <WifiOff className="h-5 w-5" />
            Connection Problem
          </CardTitle>
          <CardDescription className="text-red-700">
            Unable to connect to the server. This might be due to:
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="text-sm text-red-700 space-y-1 mb-4">
            <li>• Temporary server maintenance</li>
            <li>• Your internet connection</li>
            <li>• High server load</li>
          </ul>
          {showRetry && onRetry && (
            <Button
              variant="outline"
              onClick={onRetry}
              className="w-full border-red-300 text-red-800 hover:bg-red-100"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // For other errors, show generic error
  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-red-800">
          <AlertCircle className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription className="text-red-700">
          {error.message}
        </CardDescription>
      </CardHeader>
      {showRetry && onRetry && (
        <CardContent className="pt-0">
          <Button
            variant="outline"
            onClick={onRetry}
            className="w-full border-red-300 text-red-800 hover:bg-red-100"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

// Loading state with timeout message
interface LoadingWithTimeoutProps {
  isLoading: boolean;
  timeout?: number;
  message?: string;
}

export function LoadingWithTimeout({ 
  isLoading, 
  timeout = 10000, 
  message = "This is taking longer than usual..." 
}: LoadingWithTimeoutProps) {
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setShowTimeout(false);
      return;
    }

    const timer = setTimeout(() => {
      setShowTimeout(true);
    }, timeout);

    return () => clearTimeout(timer);
  }, [isLoading, timeout]);

  if (!isLoading) return null;

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-crucible-orange"></div>
      <p className="text-sm text-muted-foreground">Loading...</p>
      {showTimeout && (
        <p className="text-xs text-yellow-600 text-center max-w-md">
          {message}
        </p>
      )}
    </div>
  );
} 