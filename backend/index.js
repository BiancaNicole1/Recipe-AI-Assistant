import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SUPABASE_URL = "https://ybdzqspxgkkqfokyetol.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_XmwMwg_0zL_KhPMkSpQgdQ_F5-u_Cvq";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

app.get('/api/test', (req, res) => {
  res.json({ message: "Backend-ul funcționează!" });
});

app.post('/api/generate-recipe', async (req, res) => {
  const { ingredients } = req.body;
  
  if (!ingredients || ingredients.length === 0) {
    return res.status(400).json({ error: "Te rog să introduci cel puțin un ingredient." });
  }

  try {
    const prompt = `Creeaza o reteta simpla și delicioasa folosind doar urmatoarele ingrediente: ${ingredients.join(', ')}. Include un titlu, ingredientele necesare și pașii de preparare.`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    res.json({ 
      title: "Rețetă Generată", 
      recipe: responseText 
    });
    
  } catch (error) {
    console.error("Eroare la generarea rețetei:", error.message);
    
    if (error.message.includes("503") || error.message.includes("high demand") || error.message.includes("500")) {
      return res.status(503).json({ 
        error: "Serverele Google sunt suprasolicitate momentan. ⏳ Fiind un cont gratuit, mai apar întârzieri. Te rog să încerci din nou în câteva minute!" 
      });
    }

    res.status(500).json({ error: "Eroare la server: " + error.message });
  }
});

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

app.get('/api/get-recipes', async (req, res) => {
  const userId = req.query.userId;

  try {
    let query = supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Eroare server" });
  }
});

app.delete('/api/delete-recipe/:id', async (req, res) => {
  const recipeId = req.params.id; 
  
  try {
    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', recipeId); 

    if (error) throw error;

    res.json({ message: "Reteta a fost stearsa cu succes!" });
  } catch (error) {
    console.error("Eroare la stergerea retetei:", error);
    res.status(500).json({ error: "Eroare la stergerea din baza de date." });
  }
});

app.listen(PORT, () => {
  console.log(`Serverul rulează pe http://localhost:${PORT}`);
});