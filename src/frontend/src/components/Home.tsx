import React, { useState, useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";
import { 
  Typography, 
  Box, 
  Container, 
  Button, 
  CircularProgress 
} from "@mui/material";
import APIService from "../services/APIService";
import AudioRecorder from "./AudioRecorder";

function Home() {
  const [username, setUsername] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("ACCESS_TOKEN");
      if(token == undefined) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {

        const data = await APIService.request("/user", "GET", undefined, true);
        
        setLoading(false);
        setUsername(data.username);
      } catch (error) {

        console.error("Error fetching user:", error);
      }

      setLoading(false);
    };

    fetchUser();
  }, []);

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome
        </Typography>
        
        {loading ? (
          <CircularProgress />
        ) : username ? (
          <AudioRecorder />
        ) : (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              Please log in or register to continue.
            </Typography>
            <Button 
              component={RouterLink} 
              to="/login" 
              variant="contained" 
              sx={{ mr: 2 }}
            >
              Login
            </Button>
            <Button 
              component={RouterLink} 
              to="/register" 
              variant="outlined"
            >
              Register
            </Button>
          </Box>
        )}
      </Box>
    </Container>
  );
}

export default Home;