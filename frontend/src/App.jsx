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
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [activeTab, setActiveTab] = useState('generate'); // 'generate' sau 'saved'

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchSavedRecipes(currentUser.id);
      }
    };
    
    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchSavedRecipes(currentUser.id);
      } else {
        setSavedRecipes([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchSavedRecipes = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', userId);
        
      if (error) throw error;
      setSavedRecipes(data || []);
    } catch (err) {
      console.error("Eroare la preluarea rețetelor:", err);
    }
  };

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
      fetchSavedRecipes(data.user.id);
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
      // Reîmprospătare rețete salvate
      fetchSavedRecipes(user.id);
    } catch (err) {
      setMessage('Eroare la salvarea în baza de date.');
    }
  };

  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>🍽️ Asistent Culinar AI</h2>
          <p className="subtitle">Autentifică-te pentru a începe</p>
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
            <button onClick={e => { e.preventDefault(); constSignUp(e); }} className="btn btn-signup">
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

      {/* Tab-uri de navigare */}
      <div className="tabs">
        <button 
          className={`tab-btn ${activeTab === 'generate' ? 'active' : ''}`}
          onClick={() => setActiveTab('generate')}
        >
          Generare Rețetă
        </button>
        <button 
          className={`tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => setActiveTab('saved')}
        >
          Rețete Salvate 💾
        </button>
      </div>

      {/* Secțiunea de Generare */}
      {activeTab === 'generate' && (
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
      )}

      {/* Secțiunea de Rețete Salvate */}
      {activeTab === 'saved' && (
        <div className="saved-recipes-container">
          <h2>Rețetele tale salvate</h2>
          {savedRecipes.length === 0 ? (
            <p className="empty-state">Nu ai salvat nicio rețetă momentan.</p>
          ) : (
            <div className="saved-list">
              {savedRecipes.map((receta, index) => (
                <div key={index} className="card recipe-card">
                  <h3>{receta.title || "Rețetă salvată"}</h3>
                  <p><b>Ingrediente:</b> {receta.ingredients}</p>
                  <div className="receta-text-preview">
                    <pre>{receta.recipe_text || receta.recipeText}</pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <footer className="footer">
        <p>Proiect Cloud Computing - Asistent Culinar AI</p>
      </footer>
    </div>
  );
}

export default App;