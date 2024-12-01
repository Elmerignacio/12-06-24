
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


function toggleDropdown(dropdownId) {
    const dropdownElement = document.getElementById(dropdownId);

    dropdownElement.classList.toggle('show');
}

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

function toggleDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    dropdown.classList.toggle('show');
}



function toggleAccess() {
  const role = document.getElementById('role').value;
  const userId = document.querySelector('input[name="userId"]').value;
  const username = document.getElementById('username');
  const password = document.getElementById('password');

  if (role === 'student') {
      username.disabled = true;
      password.disabled = true;
      username.value = ''; 
      password.value = ''; 
  } else {
      password.disabled = false;

      if (role === 'admin' || role === 'treasurer' || role === 'representative') {
          if (userId) {
              username.value = userId; 
              username.disabled = false; 
          } else {
              username.value = ''; 
          }
          password.value = generateRandomPassword(role);
      } else {
          username.disabled = false; 
          username.value = ''; 
          password.value = '';
      }
  }
}

function generateRandomPassword(role) {
  const prefix = role.charAt(0).toUpperCase(); 
  const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return prefix + randomPart; 
}

window.onload = function() {
  const notification = document.getElementById('notification');
  if (notification) {
      notification.style.display = 'block';

      setTimeout(() => {
          notification.style.display = 'none';
      }, 5000); 
  }
};

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

function toggleDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    dropdown.classList.toggle('show');
}
