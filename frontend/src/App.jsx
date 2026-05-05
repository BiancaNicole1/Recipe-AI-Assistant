import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import './App.css';

const SUPABASE_URL = "https://ybdzqspxgkkqfokyetol.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_XmwMwg_0zL_KhPMkSpQgdQ_F5-u_Cvq";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

  const handleSignUp = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      alert(error.message);
    } else {
      alert('Cont creat! Te rog să verifici emailul pentru confirmare sau să te loghezi.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert(error.message);
    } else {
      setUser(data.user);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const generateRecipe = async () => {
    if (!ingredients) return alert('Introdu ingredientele!');
    setLoading(true);
    setMessage('');
    setRecipe('');
    try {
      const arrayIngrediente = ingredients.split(',').map(i => i.trim());
      const response = await axios.post(`${BACKEND_URL}/api/generate-recipe`, {
        ingredients: arrayIngrediente
      });
      setRecipe(response.data.recipe);
      setTitle(response.data.title);
    } catch (err) {
      setMessage('Eroare la generarea rețetei. Asigură-te că backend-ul este activ pe Render.');
    } finally {
      setLoading(false);
    }
  };

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

  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Autentificare Asistent Culinar</h2>
          <p className="subtitle">Introdu datele pentru a continua</p>
          <form className="auth-form">
            <div className="input-group">
              <label>Email</label>
              <input 
                type="email" 
                placeholder="exemplu@email.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="input-group">
              <label>Parolă</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
            <button onClick={handleLogin} className="btn btn-login">
              Autentificare
            </button>
            <button onClick={handleSignUp} className="btn btn-signup">
              Înregistrare
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="main-container">
      <header className="header">
        <div className="logo-section">
          <h1>🍽️ Asistent Culinar AI</h1>
          <p className="user-badge">Utilizator: <b>{user.email}</b></p>
        </div>
        <button onClick={handleLogout} className="btn btn-logout">
          Deconectare
        </button>
      </header>

      <div className="content-grid">
        <div className="card input-section">
          <h2>Ce vrei să gătești azi?</h2>
          <label>Ingrediente disponibile (separate prin virgulă):</label>
          <input 
            type="text" 
            value={ingredients} 
            onChange={(e) => setIngredients(e.target.value)} 
            placeholder="ex: ouă, roșii, brânză, sare" 
            className="styled-input" 
          />
          <button 
            onClick={generateRecipe} 
            className="btn btn-generate"
            disabled={loading}
          >
            {loading ? 'Se generează rețeta...' : 'Generează Rețeta'}
          </button>
        </div>

        {message && <p className="error-message">{message}</p>}

        {recipe && (
          <div className="card recipe-section">
            <h2>{title}</h2>
            <div className="recipe-content">
              <pre>{recipe}</pre>
            </div>
            <button 
              onClick={saveRecipe} 
              className="btn btn-save"
            >
              Salvează rețeta în Supabase
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;