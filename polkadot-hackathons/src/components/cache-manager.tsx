"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Trash2, Database } from "lucide-react";
import { cacheUtils } from "@/lib/cache";

export function CacheManager() {
  const [isClearing, setIsClearing] = useState(false);
  const [lastCleared, setLastCleared] = useState<Date | null>(null);

  const clearAllCache = async () => {
    setIsClearing(true);
    try {
      cacheUtils.invalidateAllEvents();
      setLastCleared(new Date());
    } catch {
      // Error already logged by cache utility
    } finally {
      setIsClearing(false);
    }
  };

  const getCacheStats = () => {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith('sui_events_'));
      return {
        totalKeys: cacheKeys.length,
        cacheSize: cacheKeys.reduce((size, key) => {
          const item = localStorage.getItem(key);
          return size + (item ? new Blob([item]).size : 0);
        }, 0)
      };
    } catch {
      return { totalKeys: 0, cacheSize: 0 };
    }
  };

  const stats = getCacheStats();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Cache Manager
        </CardTitle>
        <CardDescription>
          Manage cached data for better performance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Cached Items:</span>
          <Badge variant="outline">{stats.totalKeys}</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Cache Size:</span>
          <Badge variant="outline">
            {(stats.cacheSize / 1024).toFixed(1)} KB
          </Badge>
        </div>
        
        {lastCleared && (
          <div className="text-xs text-muted-foreground">
            Last cleared: {lastCleared.toLocaleTimeString()}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={clearAllCache}
            disabled={isClearing}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            {isClearing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Clear Cache
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 