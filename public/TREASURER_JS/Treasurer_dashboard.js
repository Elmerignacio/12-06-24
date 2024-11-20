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

window.onclick = function(event) {
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
