/**
 * Wedding Invitation - Aiman & Rafhanah
 * JavaScript functionality
 */

document.addEventListener('DOMContentLoaded', function () {
    const openBtn = document.getElementById('openInvitation');
    const cover = document.getElementById('cover');
    const mainContent = document.getElementById('mainContent');
    const bgAudio = document.getElementById('background-audio');
    const musicToggle = document.getElementById('musicToggle');
    const navItems = document.querySelectorAll('.nav-item[data-section]');

    // =====================================================
    // Open Invitation & Auto-Start
    // =====================================================
    if (openBtn) {
        openBtn.addEventListener('click', function () {
            // Trigger Door Animation
            cover.classList.add('open');

            // Show main content
            mainContent.classList.remove('hidden');

            // Re-render icons just in case
            if (typeof lucide !== 'undefined') lucide.createIcons();

            // Start audio
            if (bgAudio) {
                bgAudio.play().catch(e => console.log("Autoplay blocked"));
            }

            // Remove cover from layout after animation completes (1.5s transition + buffer)
            setTimeout(() => {
                cover.style.display = 'none';

                // START AUTO SCROLL AUTOMATICALLY
                startAutoScroll();
            }, 1800);
        });
    }

    // =====================================================
    // Scroll Reveal Animation
    // =====================================================
    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Reveal only once
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px" // Trigger slightly before full view
    });

    revealElements.forEach(el => revealObserver.observe(el));

    // =====================================================
    // Auto Scroll Logic (Automated)
    // =====================================================
    let isScrolling = false;
    const scrollSpeed = 1; // Pixels per tick
    const scrollDelay = 4; // Ultra-fast scroll (was 8)

    function startAutoScroll() {
        if (isScrolling) return;
        isScrolling = true;

        autoScrollInterval = setInterval(() => {
            // Stop if reached bottom
            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 20) {
                stopAutoScroll();
                return;
            }
            window.scrollBy(0, scrollSpeed);
        }, scrollDelay);
    }

    function stopAutoScroll() {
        if (!isScrolling) return;
        isScrolling = false;
        clearInterval(autoScrollInterval);
    }

    // Stop auto-scroll on manual interaction
    ['mousedown', 'wheel', 'touchstart', 'keydown'].forEach(evt => {
        document.addEventListener(evt, () => {
            if (isScrolling) stopAutoScroll();
        }, { passive: true });
    });

    // =====================================================
    // Music Toggle
    // =====================================================
    if (musicToggle && bgAudio) {
        musicToggle.addEventListener('click', function () {
            if (bgAudio.paused) {
                bgAudio.play();
                musicToggle.style.opacity = "1";
            } else {
                bgAudio.pause();
                musicToggle.style.opacity = "0.5";
            }
        });
    }

    // =====================================================
    // Navigation & Scrolling
    // =====================================================
    navItems.forEach(item => {
        item.addEventListener('click', function () {
            const sectionId = this.getAttribute('data-section');
            if (sectionId) {
                const targetSection = document.getElementById(sectionId);
                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });

    // =====================================================
    // Carousel Logic
    // =====================================================
    const track = document.getElementById('carouselTrack');
    const dots = document.querySelectorAll('.dot');
    let currentSlide = 0;

    function updateCarousel(index) {
        if (!track) return;
        track.style.transform = `translateX(-${index * 100}%)`;
        dots.forEach(d => d.classList.remove('active'));
        if (dots[index]) dots[index].classList.add('active');
    }

    // Auto slide
    setInterval(() => {
        if (dots.length > 0) {
            currentSlide = (currentSlide + 1) % dots.length;
            updateCarousel(currentSlide);
        }
    }, 4000);

    // Manual slide via dots
    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            const index = parseInt(dot.getAttribute('data-index'));
            currentSlide = index;
            updateCarousel(currentSlide);
        });
    });

    // =====================================================
    // RSVP Logic
    // =====================================================
    const rsvpForm = document.getElementById('rsvpForm');
    const attendanceRadios = document.querySelectorAll('input[name="attendance"]');
    const attendingFields = document.getElementById('attendingFields');
    const submitBtn = document.getElementById('submitBtn');

    // Toggle fields based on attendance
    attendanceRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'Hadir') {
                attendingFields.style.display = 'block';
                document.getElementById('guestCount').required = true;
                document.getElementById('timeSlot').required = true;
            } else {
                attendingFields.style.display = 'none';
                document.getElementById('guestCount').required = false;
                document.getElementById('timeSlot').required = false;
            }
        });
    });

    if (rsvpForm) {
        rsvpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const originalBtnText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Menghantar...';

            const formData = new FormData(rsvpForm);
            // Example URL - replace with user's actual Google Script URL if provided
            const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx6RkmO_2BzpLZylX4VDECCxPkNX2RVBO8wqyBO7QpA1Uvec-xofpKhmyuW0f5B7mMx/exec';

            try {
                // Using no-cors as standard for Google Apps Script forms
                await fetch(GOOGLE_SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    body: formData
                });

                alert('Terima kasih! RSVP anda telah dihantar.');
                rsvpForm.reset();
                if (attendingFields) attendingFields.style.display = 'block'; // Reset to default
            } catch (error) {
                console.error('Error:', error);
                alert('Maaf, terdapat ralat. Sila cuba lagi.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        });
    }

    // =====================================================
    // Modal Logic (Gift & Contact)
    // =====================================================
    // Gift Modal
    const giftBtn = document.getElementById('giftBtn');
    const giftModal = document.getElementById('giftModal');
    const closeGiftModal = document.getElementById('closeGiftModal');

    // Contact Modal
    // NOTE: We need to find the specific 'Hubungi' button in the nav
    const contactBtn = document.getElementById('contactNavBtn');
    const contactModal = document.getElementById('contactModal');
    const closeContactModal = document.getElementById('closeContactModal');

    // Setup Gift Modal
    if (giftBtn && giftModal) {
        giftBtn.addEventListener('click', () => giftModal.classList.add('active'));
    }
    if (closeGiftModal && giftModal) {
        closeGiftModal.addEventListener('click', () => giftModal.classList.remove('active'));
    }

    // Setup Contact Modal (Override default scroll behavior if present)
    if (contactBtn && contactModal) {
        contactBtn.addEventListener('click', (e) => {
            e.preventDefault();
            contactModal.classList.add('active');
        });
    }
    if (closeContactModal && contactModal) {
        closeContactModal.addEventListener('click', () => contactModal.classList.remove('active'));
    }

    // Close Modals on Outside Click
    window.addEventListener('click', (e) => {
        if (giftModal && e.target === giftModal) giftModal.classList.remove('active');
        if (contactModal && e.target === contactModal) contactModal.classList.remove('active');
    });

    const copyAccBtn = document.getElementById('copyAccBtn');
    if (copyAccBtn) {
        copyAccBtn.addEventListener('click', () => {
            const accNum = document.getElementById('accNumber').innerText.replace(/\s/g, '');
            navigator.clipboard.writeText(accNum).then(() => {
                const originalText = copyAccBtn.innerHTML;
                copyAccBtn.innerHTML = '<i data-lucide="check"></i> Disalin!';
                setTimeout(() => copyAccBtn.innerHTML = originalText, 2000);
            });
        });
    }

    // =====================================================
    // Universal Calendar Save (.ics)
    // =====================================================
    const saveDateBtn = document.getElementById('saveDateBtn');
    if (saveDateBtn) {
        saveDateBtn.addEventListener('click', () => {
            // Event Details: Feb 22, 2025, 11:00 AM - 4:00 PM
            const event = {
                title: "Walimatul Urus: Aiman & Rafhanah",
                location: "Rindu Glass Hall, Kuala Lumpur",
                description: "Majlis Perkahwinan Aiman & Rafhanah\nLokasi: Rindu Glass Hall, Kuala Lumpur",
                startTime: "20250222T110000",
                endTime: "20250222T160000"
            };

            const icsContent = [
                'BEGIN:VCALENDAR',
                'VERSION:2.0',
                'PRODID:-//Aiman Rafhanah//Wedding//EN',
                'BEGIN:VEVENT',
                'UID:wedding-aiman-rafhanah-' + new Date().getTime(),
                'DTSTAMP:' + new Date().toISOString().replace(/[-:.]/g, ''),
                'DTSTART:' + event.startTime,
                'DTEND:' + event.endTime,
                'SUMMARY:' + event.title,
                'DESCRIPTION:' + event.description,
                'LOCATION:' + event.location,
                'END:VEVENT',
                'END:VCALENDAR'
            ].join('\r\n');

            const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.setAttribute('download', 'Majlis_Aiman_Rafhanah.ics');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }

    // =====================================================
    // Floating Particles Generation
    // =====================================================
    function createParticle() {
        const container = document.getElementById('particles');
        if (!container) return;

        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = Math.random() * 3 + 'px';
        particle.style.height = particle.style.width;
        particle.style.background = 'rgba(212, 175, 55, ' + (Math.random() * 0.5 + 0.2) + ')';
        particle.style.borderRadius = '50%';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = '100%';
        particle.style.zIndex = '10';

        const duration = Math.random() * 10 + 10;
        particle.style.transition = `transform ${duration}s linear, opacity ${duration}s linear`;

        container.appendChild(particle);

        setTimeout(() => {
            particle.style.transform = `translateY(-${window.innerHeight + 100}px) translateX(${Math.random() * 40 - 20}px)`;
            particle.style.opacity = '0';
        }, 100);

        setTimeout(() => {
            particle.remove();
        }, duration * 1000);
    }

    setInterval(createParticle, 500);

    // Initialize Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // =====================================================
    // Countdown Timer
    // =====================================================
    const countdownContainer = document.getElementById('countdown');
    if (countdownContainer) {
        // Set the date we're counting down to
        const weddingDate = new Date("Feb 22, 2025 00:00:00").getTime();

        const updateCountdown = () => {
            const now = new Date().getTime();
            const distance = weddingDate - now;

            if (distance < 0) {
                document.getElementById("days").innerText = "00";
                document.getElementById("hours").innerText = "00";
                document.getElementById("minutes").innerText = "00";
                document.getElementById("seconds").innerText = "00";
            } else {
                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);

                document.getElementById("days").innerText = days < 10 ? '0' + days : days;
                document.getElementById("hours").innerText = hours < 10 ? '0' + hours : hours;
                document.getElementById("minutes").innerText = minutes < 10 ? '0' + minutes : minutes;
                document.getElementById("seconds").innerText = seconds < 10 ? '0' + seconds : seconds;
            }
        };

        // Update the count down every 1 second
        setInterval(updateCountdown, 1000);
        updateCountdown();
    }
});
