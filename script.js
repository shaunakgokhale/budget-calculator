// script.js
console.log("JavaScript is linked correctly!");

// Keep track of selected expense and summary card visibility
let selectedExpense = null;
let isSummaryCardVisible = true;

// Load the list item template
let listItemTemplate = '';

fetch('components/list-item.html')
  .then(response => response.text())
  .then(html => {
    listItemTemplate = html;
  })
  .catch(error => console.error('Error loading list item template:', error));

// Function to format number as currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2
  }).format(amount);
};

// Function to toggle summary card visibility
const toggleSummaryCard = (show) => {
  const summaryContainer = document.getElementById('summaryCardContainer');
  const expenseListContainer = document.getElementById('expenseListContainer');
  
  if (show === undefined) {
    show = !isSummaryCardVisible;
  }
  
  isSummaryCardVisible = show;
  
  if (show) {
    summaryContainer.classList.remove('hidden');
    expenseListContainer.classList.remove('md:col-span-3');
    expenseListContainer.classList.add('md:col-span-2');
  } else {
    summaryContainer.classList.add('hidden');
    expenseListContainer.classList.remove('md:col-span-2');
    expenseListContainer.classList.add('md:col-span-3');
  }
};

// Function to update the summary card
const updateSummaryCard = (expense) => {
  const detailsDiv = document.getElementById('selectedItemDetails');
  const noSelectionDiv = document.getElementById('noSelectionMessage');
  const titleElement = document.getElementById('selectedTitle');
  const priceElement = document.getElementById('selectedPrice');
  const openUrlBtn = document.getElementById('openUrlBtn');

  if (expense) {
    titleElement.textContent = expense.title;
    priceElement.textContent = formatCurrency(expense.amount);
    openUrlBtn.style.display = expense.url ? 'flex' : 'none';
    detailsDiv.classList.remove('hidden');
    noSelectionDiv.classList.add('hidden');
    selectedExpense = expense;
    toggleSummaryCard(true);
  } else {
    detailsDiv.classList.add('hidden');
    noSelectionDiv.classList.remove('hidden');
    selectedExpense = null;
  }
};

// Function to handle item selection
const selectExpense = (expense) => {
  // Remove selection from all items
  document.querySelectorAll('.expense-item').forEach(item => {
    item.classList.remove('bg-blue-50', 'shadow-sm');
  });
  
  // Add selection to clicked item
  const itemElement = document.querySelector(`[data-expense-id="${expense.id}"]`);
  if (itemElement) {
    itemElement.classList.add('bg-blue-50', 'shadow-sm');
  }
  
  updateSummaryCard(expense);
};

// Function to open selected URL
const openSelectedUrl = () => {
  if (selectedExpense && selectedExpense.url) {
    window.open(selectedExpense.url, '_blank');
  }
};

// Function to delete selected expense
const deleteSelectedExpense = async () => {
  if (selectedExpense) {
    await deleteExpense(selectedExpense.id);
    updateSummaryCard(null);
  }
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
  // Replace template variables with actual values
  return listItemTemplate
    .replace('${expense.id}', expense.id)
    .replace('${index + 1}', index + 1)
    .replace('${expense.title}', expense.title)
    .replace('${formatCurrency(expense.amount)}', formatCurrency(expense.amount))
    .replace('selectExpense(expense)', `selectExpense(${JSON.stringify(expense).replace(/"/g, '&quot;')})`);
};

// Function to update the total
const updateTotal = (expenses) => {
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const formattedTotal = formatCurrency(total);
  document.getElementById('totalExpenses').textContent = formattedTotal;
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

    // If there was a selected expense, try to reselect it
    if (selectedExpense) {
      const expense = data.expenses.find(e => e.id === selectedExpense.id);
      if (expense) {
        selectExpense(expense);
      } else {
        updateSummaryCard(null);
      }
    }
  } catch (error) {
    console.error('Error loading expenses:', error);
    document.getElementById('expenseList').innerHTML = 
      '<p class="text-red-500">Error loading expenses. Please try again later.</p>';
  }
};

// Load expenses when the page loads
document.addEventListener('DOMContentLoaded', loadExpenses);