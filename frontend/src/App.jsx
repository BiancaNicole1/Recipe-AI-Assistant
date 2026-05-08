import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import './App.css';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [activeTab, setActiveTab] = useState('generate');
  const [ingredients, setIngredients] = useState('');
  const [recipe, setRecipe] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const API_BASE = 'https://recipe-ai-assistant-backend.onrender.com/api';

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginEmail.trim() === '' || loginPassword.trim() === '') {
      alert("Te rog introdu un email și o parolă!");
      return;
    }
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    if (window.confirm("Vrei să părăsești asistentul culinar?")) {
      setIsLoggedIn(false);
      setLoginEmail('');
      setLoginPassword('');
      setRecipe('');
      setIngredients('');
      setActiveTab('generate');
    }
  };

  const handleGenerate = async () => {
    if (!ingredients.trim()) {
      setError('Te rog să introduci câteva ingrediente (ex: ouă, făină, lapte).');
      return;
    }
    setLoading(true);
    setError('');
    setRecipe('');
    setSaveMessage('');

    try {
      const ingredientsArray = ingredients.split(',').map(item => item.trim());
      const response = await fetch(`${API_BASE}/generate-recipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: ingredientsArray })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Eroare la server.');
      setRecipe(data.recipe);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!recipe) return;
    setSaving(true);
    setSaveMessage('');

    try {
      const response = await fetch(`${API_BASE}/save-recipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: loginEmail,
          title: 'Rețetă Delicioasă AI',
          ingredients: ingredients.split(',').map(i => i.trim()),
          recipeText: recipe
        })
      });

      if (!response.ok) throw new Error('Nu am putut salva rețeta.');
      setSaveMessage('Rețeta a fost adăugată în colecția ta!');
    } catch (err) {
      setSaveMessage('Eroare: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const fetchSavedRecipes = async () => {
    setLoadingSaved(true);
    try {
      const response = await fetch(`${API_BASE}/get-recipes`);
      const data = await response.json();
      if (response.ok) setSavedRecipes(data);
    } catch (err) {
      console.error("Eroare la încărcare:", err);
    } finally {
      setLoadingSaved(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Sigur vrei să ștergi această rețetă din jurnalul tău?")) return;
    try {
      const response = await fetch(`${API_BASE}/delete-recipe/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error("Eroare la ștergere.");
      setSavedRecipes(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="login-container animate-fade-in">
        <div className="login-card">
          <h2>Gourmet AI</h2>
          <p>Bun venit! Conectează-te pentru a continua.</p>
          
          <form className="login-form" onSubmit={handleLogin}>
            <input 
              type="email" 
              className="login-input" 
              placeholder="Adresa de Email" 
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
            />
            <input 
              type="password" 
              className="login-input" 
              placeholder="Parola" 
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
            />
            <button type="submit" className="btn-login">Conectare</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      <div className="main-container">
        
        <header className="top-header animate-fade-in">
          <div className="header-info">
            <h1>Gourmet AI</h1>
            <p>Bucătar personal: <span className="user-email">{loginEmail}</span></p>
          </div>
          <button className="btn-logout" onClick={handleLogout}>Deconectare</button>
        </header>

        <nav className="tabs-container">
          <button 
            className={`tab-btn ${activeTab === 'generate' ? 'active' : ''}`}
            onClick={() => setActiveTab('generate')}
          >
            Creează Rețetă
          </button>
          <button 
            className={`tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('saved');
              fetchSavedRecipes();
            }}
          >
            Jurnalul Meu
          </button>
        </nav>

        <main className="content-area">
          
          {activeTab === 'generate' && (
            <section className="animate-slide-up">
              <div className="glass-card">
                <h2>Inspiră-te astăzi</h2>
                <p className="subtitle">Introdu ingredientele pe care le ai în frigider:</p>
                
                <input
                  type="text"
                  className="pro-input"
                  placeholder="ex: pui, smântână, ciuperci..."
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                />
                
                <button 
                  className="btn-generate" 
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  {loading ? 'Se prepară ideea...' : 'Generează Rețeta'}
                </button>
              </div>

              {error && <div className="alert-box error mini" style={{marginTop: '1rem'}}>{error}</div>}

              {recipe && (
                <div className="glass-card results-card animate-slide-up" style={{marginTop: '2rem'}}>
                  <div className="results-header">
                    <h2>Propunerea Chef-ului AI</h2>
                    <button className="btn-save" onClick={handleSave} disabled={saving}>
                      {saving ? 'Se salvează...' : 'Salvează'}
                    </button>
                  </div>
                  
                  {saveMessage && (
                    <div className={`alert-box mini ${saveMessage.includes('Eroare') ? 'error' : 'success'}`}>
                      {saveMessage}
                    </div>
                  )}

                  <div className="markdown-container">
                    <ReactMarkdown>{recipe}</ReactMarkdown>
                  </div>
                </div>
              )}
            </section>
          )}

          {activeTab === 'saved' && (
            <section className="saved-recipes-container animate-fade-in">
              <h2 style={{textAlign: 'center', color: '#e11d48', marginBottom: '1rem'}}>Rețetele Tale Favorite</h2>
              
              {loadingSaved ? (
                <div className="glass-card" style={{textAlign: 'center'}}>
                  <p>Răsfoim jurnalul tău... imediat!</p>
                </div>
              ) : savedRecipes.length > 0 ? (
                savedRecipes.map((item) => (
                  <div key={item.id} className="glass-card saved-item animate-slide-up">
                    <div className="saved-item-header">
                      <h3>{item.title || 'Deliciu AI'}</h3>
                      <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                        <span className="date-tag">{new Date(item.created_at).toLocaleDateString()}</span>
                        <button className="btn-delete" onClick={() => handleDelete(item.id)}>Șterge</button>
                      </div>
                    </div>
                    <div className="ingredients-tag">
                      {Array.isArray(item.ingredients) ? item.ingredients.join(', ') : item.ingredients}
                    </div>
                    <div className="markdown-container mini">
                      <ReactMarkdown>{item.recipe_text}</ReactMarkdown>
                    </div>
                  </div>
                ))
              ) : (
                <div className="glass-card" style={{textAlign: 'center'}}>
                  <p>Jurnalul tău este gol. Începe să creezi rețete noi!</p>
                </div>
              )}
            </section>
          )}
        </main>

      </div>
    </div>
  );
}