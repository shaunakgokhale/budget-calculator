// script.js
console.log("JavaScript is linked correctly!");

// Function to format number as currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2
  }).format(amount);
};

// Function to add product from URL
const addProductFromUrl = async () => {
  const urlInput = document.getElementById('productUrl');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const url = urlInput.value.trim();
  
  if (!url) {
    alert('Please enter a product URL');
    return;
  }
  
  try {
    loadingIndicator.classList.remove('hidden');
    urlInput.disabled = true;
    
    const response = await fetch('/api/expenses/from-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || errorData.error || 'Failed to add product');
    }
    
    // Clear the input and reload the list
    urlInput.value = '';
    await loadExpenses();
  } catch (error) {
    console.error('Error adding product:', error);
    alert(`Failed to add product: ${error.message}`);
  } finally {
    loadingIndicator.classList.add('hidden');
    urlInput.disabled = false;
  }
};

// Function to delete an expense
const deleteExpense = async (id) => {
  try {
    const response = await fetch(`/api/expenses/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete expense');
    }
    
    // Reload the expenses after successful deletion
    await loadExpenses();
  } catch (error) {
    console.error('Error deleting expense:', error);
    alert('Failed to delete expense. Please try again.');
  }
};

// Function to create an expense list item
const createExpenseItem = (expense, index) => {
  const urlHtml = expense.url 
    ? `<a href="${expense.url}" target="_blank" class="text-blue-500 hover:underline ml-2">
         <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" viewBox="0 0 20 20" fill="currentColor">
           <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
           <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
         </svg>
       </a>`
    : '';

  return `
    <div class="flex items-center border-b border-gray-100 pb-2 group">
      <span class="w-8 text-gray-400">${index + 1}.</span>
      <span class="flex-grow text-gray-800">
        ${expense.title}
        ${urlHtml}
      </span>
      <span class="text-gray-600 mr-4">${formatCurrency(expense.amount)}</span>
      <button
        onclick="deleteExpense(${expense.id})"
        class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-500 hover:text-red-700"
        title="Delete expense"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
  `;
};

// Function to update the total
const updateTotal = (expenses) => {
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const formattedTotal = formatCurrency(total);
  document.getElementById('totalExpenses').textContent = formattedTotal;
  document.getElementById('totalExpenses2').textContent = formattedTotal;
};

// Function to load and display expenses
const loadExpenses = async () => {
  try {
    const response = await fetch('/api/expenses');
    const data = await response.json();
    
    // Get the container element
    const expenseList = document.getElementById('expenseList');
    
    // Create and insert the expense items
    expenseList.innerHTML = data.expenses
      .map((expense, index) => createExpenseItem(expense, index))
      .join('');
    
    // Update the total
    updateTotal(data.expenses);
  } catch (error) {
    console.error('Error loading expenses:', error);
    document.getElementById('expenseList').innerHTML = 
      '<p class="text-red-500">Error loading expenses. Please try again later.</p>';
  }
};

// Load expenses when the page loads
document.addEventListener('DOMContentLoaded', loadExpenses);