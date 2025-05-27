
'use client';

import { useState, type FormEvent, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL, type FirebaseStorageError } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Progress } from '@/components/ui/progress';

export default function UploadPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
      // File size limit for Firebase Storage is typically very large (terabytes), 
      // so a client-side limit here is more about user experience for reasonable uploads.
      // You can adjust this as needed. For example, 100MB:
      const MAX_DEMO_SIZE_BYTES = 100 * 1024 * 1024; 
      if (file.size > MAX_DEMO_SIZE_BYTES) {
        toast({
          title: 'File Too Large',
          description: `For this demo, video file size cannot exceed ${MAX_DEMO_SIZE_BYTES / (1024 * 1024)} MB.`,
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

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create a unique file name for storage
      const videoFileName = `${Date.now()}-${videoFile.name}`;
      const videoStoragePath = `videos/${user.uid}/${videoFileName}`;
      const sRef = storageRef(storage, videoStoragePath);

      const uploadTask = uploadBytesResumable(sRef, videoFile);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error: FirebaseStorageError) => { // Explicitly type the error
          console.error('Upload error:', error);
          let errorMessage = 'Video upload failed. Please try again.';
          if (error.code === 'storage/unauthorized') {
            errorMessage = "Upload failed: You don't have permission. Please check Firebase Storage security rules.";
             toast({
              title: 'Upload Permission Denied',
              description: "Ensure Firebase Storage rules allow uploads to 'videos/{userId}/'.",
              variant: 'destructive',
              duration: 10000,
            });
          } else if (error.code === 'storage/canceled') {
            errorMessage = 'Upload canceled.';
          }
          toast({
            title: 'Upload Error',
            description: error.message || errorMessage,
            variant: 'destructive',
          });
          setIsUploading(false);
          setUploadProgress(0);
          if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Reset file input
          }
          setVideoFile(null);
        },
        async () => {
          // Upload completed successfully, now get the download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          await addDoc(collection(db, 'userUploadedVideos'), {
            userId: user.uid,
            title,
            description,
            videoUrl: downloadURL,
            videoStoragePath: videoStoragePath,
            thumbnailUrl: 'https://placehold.co/320x180.png', // Placeholder thumbnail
            fileName: videoFile.name,
            fileSize: videoFile.size,
            createdAt: serverTimestamp(),
            views: 0,
            likes: 0,
          });

          toast({
            title: 'Upload Successful!',
            description: `"${title}" has been uploaded.`,
          });
          setIsUploading(false);
          setUploadProgress(100); // Visually show completion
          
          // Reset form
          setTitle('');
          setDescription('');
          setVideoFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          // Give a slight delay before resetting progress to 0 so user sees 100%
          setTimeout(() => setUploadProgress(0), 1000); 
        }
      );
    } catch (error: any) {
      console.error('Error initiating video upload:', error);
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred during upload preparation.',
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
          Share your content with the world!
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
              {videoFile && <p className="text-xs text-foreground mt-1">{videoFile.name} ({(videoFile.size / (1024*1024)).toFixed(2)} MB)</p>}
              {!videoFile && <p className="text-xs text-muted-foreground">MP4, MOV, WebM, etc.</p>}
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
              {uploadProgress > 0 ? (uploadProgress < 100 ? `Uploading... ${Math.round(uploadProgress)}%` : 'Finalizing...') : (videoFile ? 'Starting upload...' : 'Processing...')}
            </p>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button type="submit" className="min-w-[150px] py-2.5 px-6" disabled={isUploading || !videoFile || !title.trim()}>
            {isUploading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UploadCloud className="mr-2 h-5 w-5" />}
            {isUploading ? 'Uploading...' : 'Upload Video'}
          </Button>
        </div>
      </form>
    </div>
  );
}
