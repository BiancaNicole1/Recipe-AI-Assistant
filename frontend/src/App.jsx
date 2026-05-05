import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import './App.css';

// Inițializare Supabase pe partea de frontend
const SUPABASE_URL = "https://ybdzqspxgkkqfokyetol.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_XmwMwg_0zL_KhPMkSpQgdQ_F5-u_Cvq";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Adresa backend-ului publicat pe Render
const BACKEND_URL = "https://recipe-ai-assistant-backend.onrender.com";

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [recipe, setRecipe] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 1. Verificăm dacă utilizatorul este deja logat (persistență la refresh)
  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    
    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 2. Funcție de înregistrare
  const handleSignUp = async (e) => {
    e.preventDefault();
    const { user, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      alert(error.message);
    } else {
      alert('Cont creat! Te rog să verifici emailul pentru confirmare sau să te loghezi.');
    }
  };

  // 3. Funcție de autentificare
  const handleLogin = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert(error.message);
    } else {
      setUser(data.user);
    }
  };

  // 4. Funcție de deconectare
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // 5. Generare Rețetă
  const generateRecipe = async () => {
    if (!ingredients) return alert('Introdu ingredientele!');
    setLoading(true);
    setMessage('');
    try {
      const arrayIngrediente = ingredients.split(',').map(i => i.trim());
      const response = await axios.post(`${BACKEND_URL}/api/generate-recipe`, {
        ingredients: arrayIngrediente
      });
      setRecipe(response.data.recipe);
      setTitle(response.data.title);
    } catch (err) {
      setMessage('Eroare la generarea rețetei.');
    } finally {
      setLoading(false);
    }
  };

  // 6. Salvare Rețetă în Supabase
  const saveRecipe = async () => {
    if (!user) return alert('Trebuie să fii logat pentru a salva rețeta!');
    try {
      const response = await axios.post(`${BACKEND_URL}/api/save-recipe`, {
        userId: user.id,
        title: title,
        ingredients: ingredients,
        recipeText: recipe
      });
      setMessage(response.data.message);
    } catch (err) {
      setMessage('Eroare la salvarea în baza de date.');
    }
  };

  // Dacă utilizatorul nu este logat, afișăm ecranul de autentificare
  if (!user) {
    return (
      <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '400px', margin: 'auto' }}>
        <h2>Autentificare Asistent Culinar</h2>
        <form style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            placeholder="Parolă" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          <button onClick={handleLogin} style={{ padding: '8px', background: '#28a745', color: '#fff', border: 'none', cursor: 'pointer' }}>
            Autentificare
          </button>
          <button onClick={handleSignUp} style={{ padding: '8px', background: '#007bff', color: '#fff', border: 'none', cursor: 'pointer' }}>
            Înregistrare
          </button>
        </form>
      </div>
    );
  }

  // Ecranul principal după logare
  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif' }}>
      <h1>🍽️ Asistent Culinar AI</h1>
      <p>Logat ca: {user.email}</p>
      <button onClick={handleLogout} style={{ padding: '5px 10px', background: '#dc3545', color: '#fff', border: 'none', cursor: 'pointer', marginBottom: '20px' }}>
        Deconectare
      </button>

      <div style={{ marginTop: '15px' }}>
        <label><b>Introdu ingredientele separate prin virgulă:</b></label><br />
        <input 
          type="text" 
          value={ingredients} 
          onChange={(e) => setIngredients(e.target.value)} 
          placeholder="ex: ouă, roșii, brânză, sare" 
          style={{ width: '400px', padding: '8px', marginTop: '5px' }} 
        /><br />

        <button 
          onClick={generateRecipe} 
          style={{ marginTop: '10px', padding: '10px 20px', background: '#ff9800', border: 'none', color: '#fff', cursor: 'pointer' }}
          disabled={loading}
        >
          {loading ? 'Se generează cu Gemini...' : 'Generează Rețeta'}
        </button>
      </div>

      {message && <p style={{ color: 'red' }}>{message}</p>}

      {recipe && (
        <div style={{ marginTop: '30px', border: '1px solid #ccc', padding: '20px', borderRadius: '5px', maxWidth: '600px' }}>
          <h2>{title}</h2>
          <div style={{ whiteSpace: 'pre-wrap' }}>{recipe}</div>
          <button 
            onClick={saveRecipe} 
            style={{ marginTop: '15px', padding: '8px 16px', background: '#007bff', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            Salvează rețeta în Supabase
          </button>
        </div>
      )}
    </div>
  );
}

export default App;