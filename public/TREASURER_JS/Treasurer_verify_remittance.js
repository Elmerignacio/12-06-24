function openPopup() {
    // Show the popup form
    document.getElementById("popupForm").style.display = "flex";

    // Automatically update collected amount when popup is opened
    updateCollectedAmount();
}

function closePopup() {
    document.getElementById("popupForm").style.display = "none";
}

document.getElementById('receiveLink').addEventListener('mouseover', function() {
    document.getElementById('receiveDropdown').classList.add('show');
});

document.getElementById('receiveLink').addEventListener('mouseout', function() {
    document.getElementById('receiveDropdown').classList.remove('show');
});

document.getElementById('receiveDropdown').addEventListener('mouseover', function() {
    this.classList.add('show');
});

document.getElementById('receiveDropdown').addEventListener('mouseout', function() {
    this.classList.remove('show');
});

document.getElementById('remittanceLink').addEventListener('mouseover', function() {
    document.getElementById('remittanceDropdown').classList.add('show');
});

document.getElementById('remittanceLink').addEventListener('mouseout', function() {
    document.getElementById('remittanceDropdown').classList.remove('show');
});

document.getElementById('remittanceDropdown').addEventListener('mouseover', function() {
    this.classList.add('show');
});

document.getElementById('remittanceDropdown').addEventListener('mouseout', function() {
    this.classList.remove('show');
});

function setupDropdown(linkId, dropdownId) {
    const linkElement = document.getElementById(linkId);
    const dropdownElement = document.getElementById(dropdownId);

    linkElement.addEventListener('mouseover', function () {
        dropdownElement.classList.add('show');
    });

    linkElement.addEventListener('mouseout', function () {
        dropdownElement.classList.remove('show');
    });

    dropdownElement.addEventListener('mouseover', function () {
        this.classList.add('show');
    });

    dropdownElement.addEventListener('mouseout', function () {
        this.classList.remove('show');
    });
}

setupDropdown('reportLink', 'reportDropdown');
setupDropdown('userLink', 'userDropdown');

window.addEventListener('load', function() {
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => {
        if (currentPath.includes(link.getAttribute('href'))) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});

window.onload = function() {
    const currentPage = window.location.href;  
    const receiveLink = document.getElementById('receiveLink');

    if (currentPage.includes("Treasurer_BSIT_3A_remittance") || currentPage.includes("Treasurer_BSIT_3B_remittance")) {
        receiveLink.classList.add('active');
    }
}

function toggleDropdown(id) {
    var dropdown = document.getElementById(id);
    dropdown.classList.toggle("show");
}

window.onload = function() {
    // Function to calculate and update the total collected amount
    function updateCollectedAmount() {
        let totalAmount = 0;    
        // Loop through each input with the 'amount-input' class
        document.querySelectorAll('.amount-input').forEach(function(input) {
            const denomination = parseFloat(input.getAttribute('data-denomination'));
            const amount = parseFloat(input.value) || 0; // Default to 0 if empty or NaN
            totalAmount += amount * denomination;  // Multiply by denomination
        });

        // Update the displayed amount
        document.getElementById('totalAmount').textContent = totalAmount.toFixed(2);
        document.getElementById('collectedAmount').textContent = totalAmount.toFixed(2);
        document.getElementById('collectedAmountInput').value = totalAmount.toFixed(2);  // Set the hidden input value
    }

    // Call the function once to populate initial values
    updateCollectedAmount();

    // Set up event listeners for all input fields to update the total amount when changed
    document.querySelectorAll('.amount-input').forEach(function(input) {
        input.addEventListener('input', updateCollectedAmount);
    });
};


function updateTotal() {
    var total = 0;
    document.querySelectorAll('.amount-input').forEach(function(input) {
        total += parseFloat(input.value || 0) * parseFloat(input.getAttribute('data-denomination'));
    });

    document.getElementById('totalAmount').textContent = total.toFixed(2);

    var collectedAmount = parseFloat(document.querySelector('input[name="collectedAmount"]').value);
    if (total === collectedAmount) {
        document.getElementById('submitBtn').disabled = false;
    } else {
        document.getElementById('submitBtn').disabled = true;
    }
}
function calculateTotal() {
var amountInputs = document.querySelectorAll('.amount-input');
var totalAmount = 0;

amountInputs.forEach(function(input) {
var denomination = parseFloat(input.getAttribute('data-denomination'));
var amount = parseInt(input.value) || 0; 
totalAmount += denomination * amount;
});

document.getElementById('totalAmount').textContent = totalAmount.toFixed(2);

}

document.querySelectorAll('.amount-input').forEach(function(input) {
input.addEventListener('input', calculateTotal);
});

function toggleDropdown(id) {
const dropdown = document.getElementById(id);
dropdown.classList.toggle("show");
}

function openPopup() {
document.getElementById("popupForm").style.display = "flex";
}

function closePopup() {
document.getElementById("popupForm").style.display = "none";
}

