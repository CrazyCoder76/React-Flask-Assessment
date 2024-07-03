import React, { useState } from "react";
import { 
  TextField, 
  Button, 
  Typography, 
  Container, 
  Box, 
  Paper,
  Snackbar,
  Alert
} from "@mui/material";
import APIService from "../services/APIService";

function Login() {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isError, setIsError] = useState<boolean>(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await APIService.request("/login", "POST", { username, password });
      setMessage("Login successful");

      setIsError(false);
    } catch (error) {
      setMessage("An error occurred. Please try again.");
      setIsError(true);
    }
  };

  return (
    <Container maxWidth="xs">
      <Paper elevation={3} sx={{ mt: 8, p: 4 }}>
        <Typography component="h1" variant="h5" align="center" gutterBottom>
          Login
        </Typography>
        <Box component="form" onSubmit={handleLogin} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Login
          </Button>
        </Box>
      </Paper>
      <Snackbar 
        open={!!message} 
        autoHideDuration={6000} 
        onClose={() => setMessage("")}
      >
        <Alert 
          onClose={() => setMessage("")} 
          severity={isError ? "error" : "success"} 
          sx={{ width: '100%' }}
        >
          {message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Login;