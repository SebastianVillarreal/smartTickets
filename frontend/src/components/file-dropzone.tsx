import { useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from './ui/button';

type Props = {
  files: File[];
  setFiles: (files: File[]) => void;
  label?: string;
};

export function FileDropzone({ files, setFiles, label = 'Adjuntar imágenes' }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const filtered = Array.from(incoming).filter((f) => ['image/png', 'image/jpeg', 'image/webp'].includes(f.type));
    setFiles([...files, ...filtered].slice(0, 10));
  };

  return (
    <div className="space-y-3">
      <div
        className="rounded-xl border border-dashed border-border bg-secondary/40 p-4 text-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          addFiles(e.dataTransfer.files);
        }}
      >
        <Upload className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">PNG/JPG/WEBP, máx 5MB, hasta 10 archivos</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
        <Button type="button" size="sm" variant="outline" className="mt-3" onClick={() => inputRef.current?.click()}>
          Seleccionar imágenes
        </Button>
      </div>
      {files.length > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {files.map((file, idx) => (
            <div key={`${file.name}-${idx}`} className="relative overflow-hidden rounded-lg border border-border bg-white">
              <img src={URL.createObjectURL(file)} alt={file.name} className="h-24 w-full object-cover" />
              <button
                type="button"
                className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white"
                onClick={() => setFiles(files.filter((_, i) => i !== idx))}
              >
                <X className="h-3 w-3" />
              </button>
              <div className="truncate p-2 text-xs">{file.name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
