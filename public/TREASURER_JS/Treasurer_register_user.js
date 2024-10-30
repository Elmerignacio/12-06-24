function toggleDropdown(dropdownId) {
  const dropdowns = document.getElementsByClassName("dropdown-content");
  for (let i = 0; i < dropdowns.length; i++) {
      if (dropdowns[i].id !== dropdownId) {
          dropdowns[i].classList.remove('show');
      }
  }
  const dropdown = document.getElementById(dropdownId);
  dropdown.classList.toggle('show');
}

window.onclick = function (event) {
  if (!event.target.matches('.dropbtn') && !event.target.matches('.arrow')) {
      const dropdowns = document.getElementsByClassName("dropdown-content");
      for (let i = 0; i < dropdowns.length; i++) {
          const openDropdown = dropdowns[i];
          if (openDropdown.classList.contains('show')) {
              openDropdown.classList.remove('show');
          }
      }
  }
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