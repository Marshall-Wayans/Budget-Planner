let balance = 0;

function addTransaction() {
    const description = document.getElementById("description").value;
    const amount = parseFloat(document.getElementById("amount").value);
    const category = document.getElementById("category").value; 
    
    if (!description || isNaN(amount) || amount <= 0) {
        alert("Please enter valid details");
        return;
    }
    
    const transactionList = document.getElementById("transactions");
    const transactionItem = document.createElement("li");
    transactionItem.classList.add(category);
    transactionItem.innerHTML = `${description} - $${amount.toFixed(2)} <button class='delete-btn' onclick='removeTransaction(this, ${amount}, "${category}")'>X</button>`;
    transactionList.appendChild(transactionItem);
    
    balance += category === "income" ? amount : -amount;
    document.getElementById("balance").innerText = balance.toFixed(2);
    
    document.getElementById("description").value = "";
    document.getElementById("amount").value = "";
}

function removeTransaction(element, amount, category) {
    balance -= category === "income" ? amount : -amount;
    document.getElementById("balance").innerText = balance.toFixed(2);
    element.parentElement.remove();
}
        