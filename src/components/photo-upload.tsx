'use client';

import { useState, useRef } from 'react';
import { Image as ImageIcon, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  value: string | null;
  onChange: (key: string | null) => void;
}

export function PhotoUpload({ value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/ev/records/photo', { method: 'POST', body: form });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? 'Upload failed');
        return;
      }
      const json = (await res.json()) as { key: string };
      onChange(json.key);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      {value ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
          <div className="flex items-center gap-2 truncate">
            <ImageIcon className="h-4 w-4 text-primary" />
            <span className="truncate font-mono text-xs">{value.split('/').pop()}</span>
          </div>
          <button
            type="button"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => onChange(null)}
            aria-label="Remove photo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
            </>
          ) : (
            <>
              <ImageIcon className="h-4 w-4" /> Attach slip photo
            </>
          )}
        </Button>
      )}
      {error && <div className="mt-1 text-xs text-destructive">{error}</div>}
    </div>
  );
}
