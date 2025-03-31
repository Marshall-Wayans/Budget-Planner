let balance = 0;
let transactions = [];

window.onload = function () {
    fetchTransactions();
};

// Fetch transactions from the server
async function fetchTransactions() {
    try {
        const response = await fetch('http://localhost:3000/transactions');
        const data = await response.json();
        transactions = data;
        updateBalance();
        renderTransactions();
    } catch (error) {
        console.error('Error fetching transactions:', error);
    }
}

// Add a transaction and update the server
async function addTransaction() {
    const description = document.getElementById("description").value;
    const amount = parseFloat(document.getElementById("amount").value);
    const category = document.getElementById("category").value;

    if (!description || isNaN(amount) || amount <= 0) {
        alert("Please enter valid details");
        return;
    }

    // Create the transaction object
    const transaction = { description, amount, category };

    try {
        // Send the transaction to the server
        const response = await fetch('http://localhost:3000/transactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(transaction)
        });
        const newTransaction = await response.json();
        transactions.push(newTransaction);
        balance += category === "income" ? amount : -amount;
        updateBalance();
        renderTransactions();
    } catch (error) {
        console.error('Error adding transaction:', error);
    }

    document.getElementById("description").value = "";
    document.getElementById("amount").value = "";
}

// Remove a transaction and update the server
async function removeTransaction(element, id, amount, category) {
    try {
        // Delete the transaction from the server
        await fetch(`http://localhost:3000/transactions/${id}`, {
            method: 'DELETE'
        });
        transactions = transactions.filter((transaction) => transaction.id !== id);
        balance -= category === "income" ? amount : -amount;
        updateBalance();
        element.parentElement.remove();
    } catch (error) {
        console.error('Error removing transaction:', error);
    }
}

// Update the balance on the UI
function updateBalance() {
    document.getElementById("balance").innerText = balance.toFixed(2);
}

// Render transactions in the UI
function renderTransactions() {
    const transactionList = document.getElementById("transactions");
    transactionList.innerHTML = '';

    transactions.forEach(transaction => {
        const transactionItem = document.createElement("li");
        transactionItem.classList.add(transaction.category);
        transactionItem.innerHTML = `${transaction.description} - $${transaction.amount.toFixed(2)} 
            <button class='delete-btn' onclick='removeTransaction(this, ${transaction.id}, ${transaction.amount}, "${transaction.category}")'>X</button>`;
        transactionList.appendChild(transactionItem);
    });
}