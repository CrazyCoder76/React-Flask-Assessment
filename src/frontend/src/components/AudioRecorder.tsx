import React from 'react';
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

function AudioRecorder() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('ACCESS_TOKEN');
        navigate('/login');
    };

    return (
    <Container maxWidth="sm">
        <Card sx={{ mt: 4 }}>
            <CardContent>
                <Box display="flex" flexDirection="column" alignItems="center">
                    <Avatar sx={{ width: 80, height: 80, mb: 2 }}>
                    </Avatar>
                    <Typography variant="h6" gutterBottom>
                        Username
                    </Typography>
                    <Typography variant="body1" sx={{ my: 3, textAlign: 'center' }}>
                        "My motto goes here!"
                    </Typography>
                    <Box display="flex" justifyContent="space-between" width="100%" mt={2}>
                        <Button variant="contained" color="success">
                            Record (New) Motto
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