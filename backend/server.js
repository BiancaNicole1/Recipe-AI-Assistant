import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. Inițializăm serviciile cu noile tale chei
const GEMINI_API_KEY = "AIzaSyA-fnBd8KRDJnG7D1M8G-4_porpSYlH1fw";
const SUPABASE_URL = "https://ybdzqspxgkkqfokyetol.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_XmwMwg_0zL_KhPMkSpQgdQ_F5-u_Cvq";

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Endpoint de test
app.get('/api/test', (req, res) => {
  res.json({ message: "Backend-ul funcționează!" });
});

// 2. Endpoint pentru generarea rețetei cu Gemini
app.post('/api/generate-recipe', async (req, res) => {
  const { ingredients } = req.body;
  
  if (!ingredients || ingredients.length === 0) {
    return res.status(400).json({ error: "Te rog să introduci cel puțin un ingredient." });
  }

  try {
    const prompt = `Creează o rețetă simplă și delicioasă folosind doar următoarele ingrediente: ${ingredients.join(', ')}. Include un titlu, ingredientele necesare (poți adăuga sare, piper sau ulei dacă e cazul) și pașii de preparare.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    res.json({ 
      title: "Rețetă Generată", 
      recipe: response.text 
    });
  } catch (error) {
    console.error("Eroare la generarea rețetei:", error);
    res.status(500).json({ error: "A apărut o eroare la server." });
  }
});

// 3. Endpoint pentru salvarea unei rețete în Supabase
app.post('/api/save-recipe', async (req, res) => {
  const { userId, title, ingredients, recipeText } = req.body;

  try {
    const { data, error } = await supabase
      .from('recipes')
      .insert([
        { user_id: userId, title, ingredients, recipe_text: recipeText }
      ]);

    if (error) throw error;

    res.json({ message: "Rețeta a fost salvată cu succes!", data });
  } catch (error) {
    console.error("Eroare la salvarea în Supabase:", error);
    res.status(500).json({ error: "Eroare la salvarea în baza de date." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serverul rulează pe http://localhost:${PORT}`);
});