import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  Container,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import APIService from '../services/APIService';
  
function AudioRecorder() {
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [userId, setUserId] = useState('');
    const [motto, setMotto] = useState('');
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [recordingTime, setRecordingTime] = useState<number>(0);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [transcriptionStatus, setTranscriptionStatus] = useState<string>('');
  
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<number | null>(null);
    
    const fetchUser = async () => {
        try {
            const data = await APIService.request("/user", "GET", undefined, true);

            setUsername(data.username);
            setMotto(data.motto);
            setUserId(data.id);
        } catch (error) {

            console.error("Error fetching user:", error);
        }
    };
  
    const startRecording = useCallback(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        
        mediaRecorderRef.current.ondataavailable = (event: BlobEvent) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
  
        mediaRecorderRef.current.onstop = handleStop;
  
        mediaRecorderRef.current.start();
        setIsRecording(true);
  
        timerRef.current = window.setInterval(() => {
          setRecordingTime((prevTime) => {
            if (prevTime >= 15) {
              stopRecording();
              return 15;
            }
            return prevTime + 1;
          });
        }, 1000);
      } catch (err) {
        console.error('Error accessing microphone:', err);
      }
    }, []);
  
    const stopRecording = useCallback(() => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        setIsRecording(false);
      }
    }, [isRecording]);
  
    const handleStop = useCallback(async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      audioChunksRef.current = [];
  
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('userId', userId);
  
      setIsUploading(true);
      try {
        const response = await APIService.request('/upload', 'POST', formData, true, { 'Content-Type': 'multipart/form-data' });
        console.log('Upload successful:', response.data);
        setTranscriptionStatus('Transcription in progress...');
        checkTranscriptionStatus(response.data.taskId);

      } catch (err) {
        console.error('Error uploading audio:', err);
        setIsUploading(false);
      }
    }, [userId]);
    
  const checkTranscriptionStatus = useCallback(async (taskId: string) => {
    try {
      const response = await APIService.request(`/transcription_status/${taskId}`, 'GET', undefined, true);

      if (response.data.status === 'completed') {
        setTranscriptionStatus('Transcription completed!');
        fetchUser();
        setIsUploading(false);
      } else if (response.data.status === 'in_progress') {
        setTimeout(() => checkTranscriptionStatus(taskId), 2000);
      } else {
        setTranscriptionStatus('Transcription failed.');
        setIsUploading(false);
      }
    } catch (err) {
      console.error('Error checking transcription status:', err);
      setIsUploading(false);
    }
  }, []);

    const handleLogout = () => {
        localStorage.removeItem('ACCESS_TOKEN');
        navigate('/login');
    };
    
    useEffect(() => {
        fetchUser();
    }, []);


    return (
    <Container maxWidth="sm">
        <Card sx={{ mt: 4 }}>
            <CardContent>
                <Box display="flex" flexDirection="column" alignItems="center">
                    <Avatar sx={{ width: 80, height: 80, mb: 2 }}>
                    </Avatar>
                    <Typography variant="h6" gutterBottom>
                        {username}
                    </Typography>
                    <Typography variant="body1" sx={{ my: 3, textAlign: 'center' }}>
                        { isUploading ?
                            <div>
                                <p>Uploading...</p>
                                <p>{transcriptionStatus}</p>
                            </div>
                            : <div>{motto}</div>
                        }
                    </Typography>
                    <Box display="flex" justifyContent="space-between" width="100%" mt={2}>
                        <Button variant="contained" color="success" onClick={isRecording ? stopRecording : startRecording} disabled={isUploading}>
                            {isRecording ? `${recordingTime}s Stop Recording` : 'Start Recording'}
                        </Button>
                        <Button variant="contained" color="error" onClick={handleLogout}>
                            Logout
                        </Button>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    </Container>
  );
}

export default AudioRecorder;