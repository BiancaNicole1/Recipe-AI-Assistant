import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('generate');
  const [ingredients, setIngredients] = useState('');
  const [recipe, setRecipe] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const URL_GENERATE = 'https://recipe-ai-assistant-backend.onrender.com/api/generate-recipe';
  const URL_SAVE = 'https://recipe-ai-assistant-backend.onrender.com/api/save-recipe';

  const handleGenerate = async () => {
    if (!ingredients.trim()) {
      setError('Te rog să introduci cel puțin un ingredient.');
      return;
    }

    setLoading(true);
    setError('');
    setRecipe('');
    setSaveMessage('');

    try {
      const ingredientsArray = ingredients.split(',').map(item => item.trim());

      const response = await fetch(URL_GENERATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: ingredientsArray })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'A apărut o eroare la comunicarea cu serverul.');
      }

      setRecipe(data.recipe);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage('');
    try {
      const response = await fetch(URL_SAVE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user-demo-123', // Până implementezi autentificarea reală
          title: 'Rețetă Generată AI',
          ingredients: ingredients.split(',').map(i => i.trim()),
          recipeText: recipe
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      setSaveMessage('✅ Rețeta a fost salvată cu succes în Supabase!');
    } catch (err) {
      setSaveMessage('❌ Eroare la salvare: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const fetchSavedRecipes = async () => {
  setLoadingSaved(true);
  try {
    const response = await fetch('https://recipe-ai-assistant-backend.onrender.com/api/get-recipes');
    const data = await response.json();
    if (response.ok) {
      setSavedRecipes(data);
    }
  } catch (err) {
    console.error("Eroare la încărcare:", err);
  } finally {
    setLoadingSaved(false);
  }
};

const handleLogout = () => {
    const confirmare = window.confirm("Ești sigur(ă) că vrei să te deconectezi?");
    if (confirmare) {
      setIngredients('');
      setRecipe('');
      setSaveMessage('');
      setError('');
      setActiveTab('generate');
      alert("Te-ai deconectat cu succes!");
    }
  };

  return (
    <div className="app-wrapper">
      <div className="main-container">
        
        {/* HEADER */}
        <header className="top-header">
          <div className="header-info">
            <h1>🍽️ Asistent Culinar AI</h1>
            <p>Utilizator: <span className="user-email">biancanicole20003@gmail.com</span></p>
          </div>
          <button className="btn-logout" onClick={handleLogout}>Deconectare</button>
        </header>

        {/* TABS */}
        <div className="tabs-container">
          <button 
            className={`tab-btn ${activeTab === 'generate' ? 'active' : ''}`}
            onClick={() => setActiveTab('generate')}
          >
            Generare Rețetă
          </button>
          <button 
            className={`tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
            onClick={() => {
    setActiveTab('saved');
    fetchSavedRecipes(); // Încărcăm datele când dăm click pe tab
  }}
>
  Rețete Salvate 💾
          </button>
        </div>

        {/* CONTENT AREA */}
        {activeTab === 'generate' && (
          <div className="content-area animate-fade-in">
            
            {/* INPUT SECTION */}
            <div className="glass-card">
              <h2>Ce vrei să gătești azi?</h2>
              <p className="subtitle">Ingrediente disponibile (separate prin virgulă):</p>
              
              <input
                type="text"
                className="pro-input"
                placeholder="ex: ouă, roșii, paste, busuioc"
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              />
              
              <button 
                className="btn-generate" 
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? '⏳ AI-ul creează magia...' : '✨ Generează Rețeta'}
              </button>
            </div>

            {/* ERROR ALERT */}
            {error && (
              <div className="alert-box error">
                <p><strong>Eroare:</strong> {error}</p>
              </div>
            )}

            {/* RESULTS SECTION */}
            {recipe && (
              <div className="glass-card results-card animate-slide-up">
                <div className="results-header">
                  <h2>Rețetă Generată</h2>
                  <button className="btn-save" onClick={handleSave} disabled={saving}>
                    {saving ? 'Se salvează...' : '💾 Salvează Rețeta'}
                  </button>
                </div>
                
                {saveMessage && (
                  <div className={`alert-box mini ${saveMessage.includes('❌') ? 'error' : 'success'}`}>
                    {saveMessage}
                  </div>
                )}

                <div className="markdown-container">
                  <ReactMarkdown>{recipe}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'saved' && (
  <div className="saved-recipes-container animate-fade-in">
    {loadingSaved ? (
      <div className="glass-card" style={{ textAlign: 'center' }}>
        <p>⏳ Se încarcă bunătățile tale din baza de date...</p>
      </div>
    ) : savedRecipes.length > 0 ? (
      savedRecipes.map((item) => (
        <div key={item.id} className="glass-card saved-item">
          <div className="saved-item-header">
            <h3>{item.title || 'Rețetă AI'}</h3>
            <span className="date-tag">{new Date(item.created_at).toLocaleDateString()}</span>
          </div>
          <p className="ingredients-tag"><strong>Ingrediente:</strong> {Array.isArray(item.ingredients) ? item.ingredients.join(', ') : item.ingredients}</p>
          <div className="markdown-container mini">
            <ReactMarkdown>{item.recipe_text}</ReactMarkdown>
          </div>
        </div>
      ))
    ) : (
      <div className="glass-card" style={{ textAlign: 'center' }}>
        <p>Nu ai nicio rețetă salvată încă. Generează una și apasă pe butonul de salvare! 👩‍🍳</p>
      </div>
    )}
  </div>
)}

      </div>
    </div>
  );
}