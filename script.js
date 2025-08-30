// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-menu a');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            const expanded = hamburger.getAttribute('aria-expanded') === 'true';
            hamburger.setAttribute('aria-expanded', !expanded);
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
            // Trap focus inside menu when open
            if (!expanded) {
                navLinks[0].focus();
            }
        });
    }

    // Close mobile menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
        });
    });

    // Keyboard navigation for mobile menu
    navMenu.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
            hamburger.focus();
        }
    });
});

// Smooth scrolling for anchor links
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            // Only prevent default if link is for an anchor on this page
            const href = this.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
                // If mobile nav is open, close it after click
                const navMenu = document.querySelector('.nav-menu');
                const hamburger = document.querySelector('.hamburger');
                if (navMenu && navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                    hamburger.classList.remove('active');
                    hamburger.setAttribute('aria-expanded', 'false');
                }
            }
        });
    });
});

// Donation amount button selection
document.addEventListener('DOMContentLoaded', function() {
    const amountButtons = document.querySelectorAll('.amount-btn');
    
    amountButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            amountButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
        });
    });
});

// Contact form now posts directly to Google Apps Script; no JS interception.

// Header scroll effect
window.addEventListener('scroll', function() {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
        header.style.backdropFilter = 'blur(10px)';
    } else {
        header.style.background = '#fff';
        header.style.backdropFilter = 'none';
    }
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', function() {
    const animatedElements = document.querySelectorAll('.service-card, .donation-card, .stat');
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Counter animation for statistics
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const startTime = performance.now();
    
    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + (target - start) * easeOut);
        
        element.textContent = current.toLocaleString() + '+';
        
        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target.toLocaleString() + '+';
        }
    }
    
    requestAnimationFrame(updateCounter);
}

// Trigger counter animations when stats section becomes visible
const statsObserver = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const counters = entry.target.querySelectorAll('.stat h4');
            counters.forEach(counter => {
                const text = counter.textContent.replace(/[^\d]/g, '');
                const target = parseInt(text);
                if (target) {
                    animateCounter(counter, target);
                }
            });
            statsObserver.unobserve(entry.target);
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const statsSection = document.querySelector('.stats');
    if (statsSection) {
        statsObserver.observe(statsSection);
    }
});

// Donate Modal Logic
document.addEventListener('DOMContentLoaded', function() {
    const openBtn = document.getElementById('openDonateModal');
    const modalOverlay = document.getElementById('donateModal');
    const closeBtn = document.getElementById('closeDonateModal');
    let lastFocused;

    function openModal(e){
        if(e) e.preventDefault();
        if(!modalOverlay) return;
        lastFocused = document.activeElement;
        modalOverlay.classList.add('active');
        modalOverlay.setAttribute('aria-hidden','false');
        // Focus first focusable element
        if(closeBtn) closeBtn.focus();
        document.body.style.overflow = 'hidden';
    }

    function closeModal(){
        if(!modalOverlay) return;
        modalOverlay.classList.remove('active');
        modalOverlay.setAttribute('aria-hidden','true');
        document.body.style.overflow = '';
        if(lastFocused && typeof lastFocused.focus === 'function'){
            lastFocused.focus();
        }
    }

    if(openBtn){ openBtn.addEventListener('click', openModal); }
    if(closeBtn){ closeBtn.addEventListener('click', closeModal); }
    if(modalOverlay){
        modalOverlay.addEventListener('click', function(e){
            if(e.target === modalOverlay) closeModal();
        });
    }
    document.addEventListener('keydown', function(e){
        if(e.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('active')){
            closeModal();
        }
    });
});

// Add loading states and error handling
function showLoading(element) {
    element.style.opacity = '0.7';
    element.style.pointerEvents = 'none';
}

function hideLoading(element) {
    element.style.opacity = '1';
    element.style.pointerEvents = 'auto';
}

// Keyboard navigation improvements
document.addEventListener('keydown', function(e) {
    // Escape key closes mobile menu
    if (e.key === 'Escape') {
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');
        if (hamburger && navMenu) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        }
    }
});
