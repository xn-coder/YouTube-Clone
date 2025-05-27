
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud } from 'lucide-react';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, firebaseApp } from '@/lib/firebase'; // Use firebaseApp for storage
import { Progress } from '@/components/ui/progress';

const storage = getStorage(firebaseApp);

export default function UploadPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

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
      // Basic video type check (can be expanded)
      if (file.type.startsWith('video/')) {
        setVideoFile(file);
      } else {
        toast({
          title: 'Invalid File Type',
          description: 'Please select a video file (e.g., MP4, MOV, WebM).',
          variant: 'destructive',
        });
        event.target.value = ''; // Clear the input
        setVideoFile(null);
      }
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
      // Sanitize filename slightly, or use a UUID for more robustness
      const cleanFileName = videoFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const videoFileName = `${user.uid}_${Date.now()}_${cleanFileName}`;
      const storageRef = ref(storage, `videos/${user.uid}/${videoFileName}`);
      const uploadTask = uploadBytesResumable(storageRef, videoFile);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload failed:', error);
          toast({
            title: 'Upload Failed',
            description: error.message || 'Could not upload video. Please try again.',
            variant: 'destructive',
          });
          setIsUploading(false);
        },
        async () => {
          // Upload completed successfully, now get the download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          // Save metadata to Firestore
          await addDoc(collection(db, 'userUploadedVideos'), { // Changed collection name
            userId: user.uid,
            title,
            description,
            videoUrl: downloadURL, 
            videoStoragePath: storageRef.fullPath,
            thumbnailUrl: '', // Placeholder - thumbnail generation is complex
            fileName: videoFile.name,
            fileType: videoFile.type,
            fileSize: videoFile.size,
            createdAt: serverTimestamp(),
            views: 0,
            likes: 0,
            // duration would ideally be extracted, but requires client/server processing
          });

          toast({
            title: 'Upload Successful!',
            description: `"${title}" has been uploaded.`,
          });
          setIsUploading(false);
          setUploadProgress(100); // Ensure progress bar shows complete
          
          // Reset form or redirect
          setTitle('');
          setDescription('');
          setVideoFile(null);
          // Consider removing the file from the input visually if possible or redirecting.
          // For now, just clearing state. The input field itself doesn't reset easily without full form reset.
          if (event.target instanceof HTMLFormElement) {
            event.target.reset(); 
          }
          
          // router.push('/'); // Or to a "my videos" page
        }
      );
    } catch (error: any) {
      console.error('Error during upload process:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred during upload.',
        variant: 'destructive',
      });
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 max-w-2xl">
      <div className="text-center mb-10">
        <UploadCloud className="mx-auto h-16 w-16 text-primary mb-3" />
        <h1 className="text-3xl font-bold text-foreground">Upload Your Video</h1>
        <p className="text-muted-foreground mt-2">Share your content with the world (or just this app!).</p>
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
                  <Input id="videoFile" name="videoFile" type="file" className="sr-only" onChange={handleFileChange} accept="video/*" disabled={isUploading} />
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
            <p className="text-xs text-muted-foreground text-center">{Math.round(uploadProgress)}% uploaded</p>
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
