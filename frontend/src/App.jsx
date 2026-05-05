import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import './App.css'; // Asigură-te că importul către CSS este corect

function App() {
  const [ingredients, setIngredients] = useState('');
  const [recipe, setRecipe] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Înlocuiește cu adresa ta de pe Render
  const URL_BACKEND = 'https://recipe-ai-assistant-backend.onrender.com/api/generate-recipe';

  const handleGenerate = async () => {
    if (!ingredients.trim()) {
      setError('Te rog să introduci cel puțin un ingredient.');
      return;
    }

    setLoading(true);
    setError('');
    setRecipe('');

    try {
      // Transformăm textul într-un array, separat prin virgulă
      const ingredientsArray = ingredients.split(',').map(item => item.trim());

      const response = await fetch(URL_BACKEND, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: ingredientsArray })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'A apărut o eroare la server.');
      }

      setRecipe(data.recipe);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="content-wrapper">
        
        {/* Secțiunea de Input */}
        <div className="card">
          <h2>Ce vrei să gătești azi?</h2>
          <p style={{ marginBottom: '1rem', color: '#94a3b8' }}>
            Ingrediente disponibile (separate prin virgulă):
          </p>
          
          <input
            type="text"
            className="input-field"
            placeholder="ex: ouă, roșii, brânză, lapte"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
          />
          
          <button 
            className="btn-primary" 
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? 'Bucătarul AI gătește... 👨‍🍳' : 'Generează Rețeta ✨'}
          </button>
        </div>

        {/* Mesaj de Eroare */}
        {error && (
          <div style={{ padding: '1rem', backgroundColor: '#7f1d1d', color: '#fca5a5', borderRadius: '8px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* Secțiunea Rezultatului */}
        {recipe && (
          <div className="card">
            <h2>Rețeta Ta</h2>
            <div className="recipe-content">
              {/* Aici ReactMarkdown face magia și transformă steluțele în design */}
              <ReactMarkdown>{recipe}</ReactMarkdown>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;