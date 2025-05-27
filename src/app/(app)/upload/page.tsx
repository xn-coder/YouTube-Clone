
'use client';

import { useState, type FormEvent, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud } from 'lucide-react';
// Attempting direct import from @firebase/firestore
import { Blob as FirestoreBlob, collection, addDoc, serverTimestamp } from '@firebase/firestore'; 
import { db } from '@/lib/firebase'; 
import { Progress } from '@/components/ui/progress';

// Firestore document size limit is 1 MiB.
// Base64 encoding adds ~33% overhead. So an actual file limit needs to be smaller.
// Let's set a practical limit of e.g., 900KB for the original file.
const MAX_FILE_SIZE_BYTES = 900 * 1024; // 900 KB

export default function UploadPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // Keep for visual, though it'll be quick

  if (authLoading) {
    return <div className="container mx-auto px-4 py-6 flex justify-center items-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-6 text-center">
        <h1 className="text-2xl font-bold mb-6 text-foreground">Upload Video</h1>
        <p className="text-muted-foreground mb-4">Please log in to upload videos.</p>
        <Button onClick={() => router.push('/login')}>Login</Button>
      </div>
    );
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (!file.type.startsWith('video/')) {
        toast({
          title: 'Invalid File Type',
          description: 'Please select a video file (e.g., MP4, MOV, WebM).',
          variant: 'destructive',
        });
        if (event.target) event.target.value = ''; 
        setVideoFile(null);
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast({
          title: 'File Too Large',
          description: `Video file size cannot exceed ${MAX_FILE_SIZE_BYTES / 1024} KB due to Firestore document limits. Please choose a smaller file.`,
          variant: 'destructive',
        });
        if (event.target) event.target.value = '';
        setVideoFile(null);
        return;
      }
      setVideoFile(file);
    } else {
      setVideoFile(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!videoFile || !title.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a video file and a title.',
        variant: 'destructive',
      });
      return;
    }

    if (videoFile.size > MAX_FILE_SIZE_BYTES) {
      toast({
        title: 'File Too Large',
        description: `Video file size cannot exceed ${MAX_FILE_SIZE_BYTES / 1024} KB. Please choose a smaller file.`,
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(50); // Simulate some progress as file reading is quick

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target?.result && e.target.result instanceof ArrayBuffer) {
          const arrayBuffer = e.target.result;
          const uint8Array = new Uint8Array(arrayBuffer);
          // Use Blob directly if imported without alias
          const videoDataBlob = FirestoreBlob.fromUint8Array(uint8Array);

          await addDoc(collection(db, 'userUploadedVideos'), {
            userId: user.uid,
            title,
            description,
            videoDataBlob, // Store the Blob object
            fileType: videoFile.type, // Store MIME type
            thumbnailUrl: 'https://placehold.co/320x180.png', // Placeholder
            fileName: videoFile.name,
            fileSize: videoFile.size,
            createdAt: serverTimestamp(),
            views: 0,
            likes: 0,
          });

          toast({
            title: 'Upload Successful!',
            description: `"${title}" has been processed and saved to Firestore.`,
          });
          setIsUploading(false);
          setUploadProgress(100);
          
          setTitle('');
          setDescription('');
          setVideoFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } else {
          throw new Error('Failed to read file data.');
        }
      };

      reader.onerror = (error) => {
        console.error('File reading error:', error);
        toast({
          title: 'File Read Error',
          description: 'Could not read the video file. Please try again.',
          variant: 'destructive',
        });
        setIsUploading(false);
        setUploadProgress(0);
      };

      reader.readAsArrayBuffer(videoFile);

    } catch (error: any) {
      console.error('Error preparing video for Firestore:', error);
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred during processing.',
        variant: 'destructive',
      });
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 max-w-2xl">
      <div className="text-center mb-10">
        <UploadCloud className="mx-auto h-16 w-16 text-primary mb-3" />
        <h1 className="text-3xl font-bold text-foreground">Upload Your Video</h1>
        <p className="text-muted-foreground mt-2">
          Share your content with the world! (Max file size: {MAX_FILE_SIZE_BYTES / 1024} KB due to Firestore limits)
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 sm:p-8 rounded-xl shadow-lg">
        <div>
          <Label htmlFor="videoFile" className="block text-sm font-medium text-foreground mb-1">Video File</Label>
          <div className="mt-1 flex justify-center items-center px-6 pt-5 pb-6 border-2 border-dashed border-border rounded-md hover:border-primary transition-colors">
            <div className="space-y-1 text-center">
              <UploadCloud className="mx-auto h-10 w-10 text-muted-foreground" />
              <div className="flex text-sm text-muted-foreground justify-center">
                <label
                  htmlFor="videoFile"
                  className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-ring"
                >
                  <span>Select a file</span>
                  <Input 
                    ref={fileInputRef}
                    id="videoFile" 
                    name="videoFile" 
                    type="file" 
                    className="sr-only" 
                    onChange={handleFileChange} 
                    accept="video/*" 
                    disabled={isUploading} 
                  />
                </label>
              </div>
              {videoFile && <p className="text-xs text-foreground mt-1">{videoFile.name} ({(videoFile.size / 1024).toFixed(2)} KB)</p>}
              {!videoFile && <p className="text-xs text-muted-foreground">MP4, MOV, WebM, etc. (Max {MAX_FILE_SIZE_BYTES / 1024} KB)</p>}
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">Title</Label>
          <Input
            id="title"
            name="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1"
            placeholder="My Awesome Video"
            required
            disabled={isUploading}
          />
        </div>

        <div>
          <Label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">Description</Label>
          <Textarea
            id="description"
            name="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1"
            placeholder="Tell viewers about your video (optional)"
            disabled={isUploading}
          />
        </div>
        
        {isUploading && (
          <div className="space-y-1">
            <Progress value={uploadProgress} className="w-full h-2.5" />
            <p className="text-xs text-muted-foreground text-center">
              {uploadProgress > 0 ? (uploadProgress < 100 ? `Processing... ${Math.round(uploadProgress)}%` : 'Finalizing...') : 'Starting...'}
            </p>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button type="submit" className="min-w-[150px] py-2.5 px-6" disabled={isUploading || !videoFile || !title.trim()}>
            {isUploading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UploadCloud className="mr-2 h-5 w-5" />}
            {isUploading ? 'Processing...' : 'Upload Video'}
          </Button>
        </div>
      </form>
    </div>
  );
}
