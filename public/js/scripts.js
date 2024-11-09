fetch('/projects')
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    const projectsContainer = document.getElementById('projects');
    projectsContainer.innerHTML = ''; // Clear any existing content
    data.forEach(project => {
      const projectCard = document.createElement('div');
      projectCard.className = 'ui card custom-card hover-animate';
      projectCard.innerHTML = `
        <div class="content">
          <div class="header">${project.name}</div>
          ${project.description ? `<div class="description">${project.description}</div>` : ''}
        </div>
        <div class="extra content">
          <a href="${project.html_url}" target="_blank" class="ui button">Voir le projet</a>
        </div>
      `;
      projectsContainer.appendChild(projectCard);
    });
  })
  .catch(error => console.error('Error fetching projects:', error));

// Highlight active section in the menu
const menuItems = document.querySelectorAll('.ui.fixed.menu .item');
window.addEventListener('scroll', () => {
  let currentSection = '';
  document.querySelectorAll('h1[id]').forEach(section => {
    const sectionTop = section.offsetTop - 70;
    if (pageYOffset >= sectionTop) {
      currentSection = section.getAttribute('id');
    }
  });
  menuItems.forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('href').substring(1) === currentSection) {
      item.classList.add('active');
    }
  });

  // Add animation classes on scroll
  document.querySelectorAll('.animate__animated').forEach(element => {
    if (element.getBoundingClientRect().top < window.innerHeight) {
      element.classList.add('animate__fadeInUp');
    }
  });

  // Show or hide the back-to-top button
  const backToTopButton = document.getElementById('back-to-top');
  if (window.scrollY > 300) {
    backToTopButton.style.display = 'block';
  } else {
    backToTopButton.style.display = 'none';
  }
});

document.getElementById('back-to-top').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Smooth scroll for href="#projects"
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const targetId = this.getAttribute('href').substring(1);
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      window.scrollTo({
        top: targetElement.offsetTop - 60, // Adjust for fixed menu height
        behavior: 'smooth'
      });
    }
  });
});

function createRandomCircle() {
  const circle = document.createElement('div');
  const size = Math.random() * 200 + 50;
  const posX = Math.random() * window.innerWidth;
  const posY = Math.random() * document.body.scrollHeight;
  circle.className = 'circle';
  circle.style.width = `${size}px`;
  circle.style.height = `${size}px`;
  circle.style.left = `${posX}px`;
  circle.style.top = `${posY}px`;
  document.querySelector('.circle-container').appendChild(circle);
}

for (let i = 0; i < 20; i++) {
  createRandomCircle();
}