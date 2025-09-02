'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, LoaderCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { processVoiceExpense } from '@/lib/actions-python';
import { useStore } from '@/lib/store';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type RecordingState = 'idle' | 'recording' | 'transcribing' | 'success' | 'error';

export function VoiceRecorder() {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [transcribedText, setTranscribedText] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();
  const { setAddExpenseSheetOpen, getCategoryByName, addCategory } = useStore();

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  const resetState = () => {
    setRecordingState('idle');
    setTranscribedText('');
    setIsDialogOpen(false);
    audioChunksRef.current = [];
  };

  const handleStartRecording = async () => {
    try {
      // Check if MediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API not supported');
      }

      // Check if we're in a secure context (HTTPS or localhost)
      if (!window.isSecureContext) {
        throw new Error('Secure context required');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = handleProcessRecording;
      mediaRecorderRef.current.start();
      setRecordingState('recording');
      setIsDialogOpen(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      toast({
        variant: 'destructive',
        title: 'Microphone Error',
        description: err instanceof Error && err.message === 'MediaDevices API not supported' 
          ? 'Your browser does not support microphone access. Please use a modern browser.'
          : err instanceof Error && err.message === 'Secure context required'
          ? 'Microphone access requires HTTPS. Please use a secure connection.'
          : 'Could not access the microphone. Please check your permissions and ensure you\'re using HTTPS.',
      });
      setRecordingState('error');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleProcessRecording = async () => {
    setRecordingState('transcribing');
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64Audio = reader.result as string;
      const result = await processVoiceExpense(base64Audio);

      if (result.error || !result.parsedExpense) {
        toast({ variant: 'destructive', title: 'Error', description: result.error || 'Could not understand the expense.' });
        setRecordingState('error');
        setTimeout(() => resetState(), 2000);
        return;
      }
      
      setTranscribedText(result.transcription!);
      setRecordingState('success');

      setTimeout(() => {
        const parsedExpense = result.parsedExpense!;
        const categoryName = parsedExpense.categoryName?.trim();

        // Only auto-create category if we have a valid name
        let category = categoryName ? getCategoryByName(categoryName) : undefined;
        if (!category && categoryName) {
          category = addCategory({ name: categoryName, color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6,'0')}` });
          toast({ title: 'New Category Created', description: `Category "${category.name}" was automatically created.` });
        }

        // Open the sheet with prefilled data only; do not auto-save
        setAddExpenseSheetOpen(true, {
          amount: parsedExpense.amount,
          categoryId: category?.id || '',
          date: parsedExpense.date,
        });
        resetState();
      }, 1500);
    };

    mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
  };

  const iconClass = "h-16 w-16";
  
  const getIcon = () => {
    switch (recordingState) {
        case 'recording': return <Mic className={cn(iconClass, "text-red-500")} />;
        case 'transcribing': return <LoaderCircle className={cn(iconClass, "animate-spin")} />;
        case 'success': return <Check className={cn(iconClass, "text-green-500")} />;
        case 'error': return <MicOff className={cn(iconClass, "text-red-500")} />;
        default: return <Mic className={iconClass} />;
    }
  }

  const getDescription = () => {
    switch (recordingState) {
        case 'recording': return "Listening... Tap the icon to finish.";
        case 'transcribing': return "Thinking...";
        case 'success': return "Success! Creating your expense...";
        case 'error': return "Sorry, I didn't catch that. Please try again.";
        default: return "Tap the icon and say your expense.";
    }
  }

  // Don't render anything until we're on the client side
  if (!isClient) {
    return null;
  }

  return (
    <>
      <Button 
        size="icon" 
        className="rounded-full h-14 w-14 shadow-lg md:hidden" 
        onClick={handleStartRecording} 
        disabled={recordingState !== 'idle'}
      >
        <Mic className="h-6 w-6" />
        <span className="sr-only">Record Expense</span>
      </Button>
      <div className="hidden md:block">
        <Button 
            onClick={handleStartRecording} 
            disabled={recordingState !== 'idle'}
        >
            <Mic className="mr-2 h-4 w-4" />
            Add with Voice
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && resetState()}>
        <DialogContent onPointerDownOutside={(e) => e.preventDefault()} className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Voice Expense Entry</DialogTitle>
                <DialogDescription className="pt-2">{getDescription()}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center gap-4 p-8">
                <button
                    onClick={handleStopRecording}
                    disabled={recordingState !== 'recording'}
                    className="p-4 rounded-full bg-card hover:bg-muted transition-colors disabled:opacity-50"
                >
                    {getIcon()}
                </button>
                {recordingState === 'success' && (
                    <p className="text-center text-lg font-medium">"{transcribedText}"</p>
                )}
            </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
