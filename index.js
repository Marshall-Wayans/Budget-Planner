let balance = 0;
let transactions = [];

window.onload = function () {
    fetchTransactions();
};

async function fetchTransactions() {
    try {
        const response = await fetch('http://localhost:4003/transactions');
        const data = await response.json();
        transactions = data;

        // Calculate balance based on fetched transactions
        balance = transactions.reduce((acc, transaction) => {
            return acc + (transaction.category === "income" ? transaction.amount : -transaction.amount);
        }, 0);

        updateBalance();
        renderTransactions();
    } catch (error) {
        console.error('Error fetching transactions:', error);
    }
}

async function addTransaction() {
    const description = document.getElementById("description").value;
    const amount = parseFloat(document.getElementById("amount").value);
    const category = document.getElementById("category").value;

    if (!description || isNaN(amount) || amount <= 0) {
        alert("Please enter valid details");
        return;
    }

    const transaction = { description, amount, category };

    try {
        const response = await fetch('http://localhost:4003/transactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(transaction)
        });
        const newTransaction = await response.json();
        transactions.push(newTransaction);

        // Update balance when adding a new transaction
        balance += category === "income" ? amount : -amount;

        updateBalance();
        renderTransactions();
    } catch (error) {
        console.error('Error adding transaction:', error);
    }

    // Clear input fields after adding a transaction
    document.getElementById("description").value = "";
    document.getElementById("amount").value = "";
}

async function removeTransaction(element, id, amount, category) {
    try {
        await fetch(`http://localhost:4003/transactions/${id}`, {
            method: 'DELETE'
        });
        transactions = transactions.filter((transaction) => transaction.id !== id);

        // Adjust balance when removing a transaction
        balance -= category === "income" ? amount : -amount;

        updateBalance();
        element.parentElement.remove();
    } catch (error) {
        console.error('Error removing transaction:', error);
    }
}

function updateBalance() {
    document.getElementById("balance").innerText = balance.toFixed(2);
}

function renderTransactions() {
    const transactionList = document.getElementById("transactions");
    transactionList.innerHTML = '';

    transactions.forEach(transaction => {
        const transactionItem = document.createElement("li");
        transactionItem.classList.add(transaction.category);
        transactionItem.innerHTML = `${transaction.description} - $${transaction.amount.toFixed(2)} 
            <button class='delete-btn' onclick='removeTransaction(this, "${transaction.id}", ${transaction.amount}, "${transaction.category}")'>X</button>`;
        transactionList.appendChild(transactionItem);
    });
}

function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');

    if (currentTheme === 'dark') {
        document.body.setAttribute('data-theme', 'light');
        document.getElementById("theme-toggle").textContent = 'Switch to Dark Mode';
    } else {
        document.body.setAttribute('data-theme', 'dark');
        document.getElementById("theme-toggle").textContent = 'Switch to Light Mode';
    }
}

if (localStorage.getItem('theme') === 'dark') {
    document.body.setAttribute('data-theme', 'dark');
    document.getElementById("theme-toggle").textContent = 'Switch to Light Mode';
} else {
    document.body.setAttribute('data-theme', 'light');
    document.getElementById("theme-toggle").textContent = 'Switch to Dark Mode';
}

document.getElementById("theme-toggle").addEventListener('click', () => {
    const currentTheme = document.body.getAttribute('data-theme');
    localStorage.setItem('theme', currentTheme);
});