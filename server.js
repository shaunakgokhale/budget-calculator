const express = require('express');
const fs = require('fs').promises;
const OpenAI = require('openai');

const app = express();
const PORT = 3000;

// Initialize OpenAI with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Middleware
app.use(express.json());
app.use(express.static('.'));

// Handle favicon.ico requests
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Get all expenses
app.get('/api/expenses', async (req, res) => {
  try {
    const data = await fs.readFile('data.json', 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading expenses:', error);
    res.status(500).json({ error: 'Error reading expenses' });
  }
});

// Add expense from URL using GPT-4
app.post('/api/expenses/from-url', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Your task is to extract key product details from e-commerce websites, including ikea.com/nl, bol.com, coolblue.nl, and leenbakker.nl.\n\nRequirements:\n\nParse the product title and price accurately from the provided URL.\nEnsure the correct price currency (€ or $) is extracted directly from the product page.\nThe extracted data should be formatted into the following JSON schema {\"title\": \"Product Name\", \"amount\": 299.99}"
        },
        {
          role: "user",
          content: url
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0
    });

    const productInfo = JSON.parse(completion.choices[0].message.content);
    
    if (!productInfo.title || productInfo.amount === undefined) {
      throw new Error('Could not extract product information');
    }

    // Read existing data
    const data = JSON.parse(await fs.readFile('data.json', 'utf8'));
    
    // Create new expense
    const newExpense = {
      id: Date.now(),
      title: productInfo.title,
      amount: productInfo.amount,
      url: url,
      date: new Date().toISOString()
    };

    // Add to expenses and save
    data.expenses.push(newExpense);
    await fs.writeFile('data.json', JSON.stringify(data, null, 2));
    
    res.json(newExpense);
  } catch (error) {
    console.error('Error processing URL:', error);
    res.status(500).json({ 
      error: 'Error processing URL',
      details: error.message
    });
  }
});

// Add a new expense manually
app.post('/api/expenses', async (req, res) => {
  try {
    const { title, amount } = req.body;
    
    if (!title || !amount) {
      return res.status(400).json({ error: 'Title and amount are required' });
    }

    const data = JSON.parse(await fs.readFile('data.json', 'utf8'));
    
    const newExpense = {
      id: Date.now(),
      title,
      amount: parseFloat(amount),
      date: new Date().toISOString()
    };

    data.expenses.push(newExpense);
    await fs.writeFile('data.json', JSON.stringify(data, null, 2));
    res.json(newExpense);
  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(500).json({ error: 'Error adding expense' });
  }
});

// Delete an expense
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = JSON.parse(await fs.readFile('data.json', 'utf8'));
    data.expenses = data.expenses.filter(expense => expense.id !== id);
    await fs.writeFile('data.json', JSON.stringify(data, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Error deleting expense' });
  }
});

app.listen(PORT, () => {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('Warning: OPENAI_API_KEY environment variable is not set');
  }
  console.log(`Server is running on port ${PORT}`);
}); 