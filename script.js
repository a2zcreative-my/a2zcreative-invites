document.addEventListener('DOMContentLoaded', () => {
    // Only run wedding Invite logic if we are on that page
    const openBtn = document.getElementById('openInvitation');
    if (openBtn) {
        const cover = document.getElementById('cover');
        const mainContent = document.getElementById('main-content');
        const floatingNav = document.getElementById('floating-nav');
        const bgMusic = document.getElementById('bg-music');
        const musicIcon = document.getElementById('music-icon');

        // Countdown Logic
        const weddingDate = new Date("Feb 24, 2024 11:00:00").getTime();

        // Set initial music state
        let isPlaying = false;

        openBtn.addEventListener('click', () => {
            cover.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            cover.style.opacity = '0';
            cover.style.transform = 'translateY(-100%)';

            setTimeout(() => {
                cover.style.display = 'none';
                mainContent.classList.remove('hidden');
                floatingNav.classList.remove('hidden');
                toggleMusic(); // Start music
            }, 800);
        });

        window.toggleMusic = function () {
            if (isPlaying) {
                bgMusic.pause();
                musicIcon.classList.remove('bx-music');
                musicIcon.classList.add('bx-volume-mute');
                isPlaying = false;
            } else {
                bgMusic.play().catch(e => console.log("Audio play blocked:", e));
                musicIcon.classList.remove('bx-volume-mute');
                musicIcon.classList.add('bx-music');
                isPlaying = true;
            }
        };

        // Modal Logic
        window.openModal = function (modalType) {
            const modal = document.getElementById(`modal-${modalType}`);
            if (modal) {
                modal.style.display = 'flex';
            }
        };

        window.closeModal = function (modalType) {
            const modal = document.getElementById(`modal-${modalType}`);
            if (modal) {
                modal.style.display = 'none';
            }
        };

        // Close modal when clicking outside
        window.onclick = function (event) {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = "none";
            }
        };

        // RSVP Pax Logic
        window.togglePax = function (val) {
            const paxGroup = document.getElementById('pax-group');
            if (val === 'Hadir') {
                paxGroup.style.display = 'block';
            } else {
                paxGroup.style.display = 'none';
            }
        };

        // Simple Copy Function
        window.copyToClipboard = function (text) {
            navigator.clipboard.writeText(text).then(() => {
                alert("No. Akaun disalin!");
            });
        };

        // Countdown interval
        setInterval(() => {
            const now = new Date().getTime();
            const distance = weddingDate - now;

            if (distance < 0) {
                document.getElementById("days").parentElement.style.display = "none"; // Hide if passed
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            document.getElementById("days").innerText = days;
            document.getElementById("hours").innerText = hours;
            document.getElementById("minutes").innerText = minutes;
            document.getElementById("seconds").innerText = seconds;
        }, 1000);

        // RSVP Submission Mockup
        window.handleRSVP = function (e) {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const status = document.getElementById('attendance').value;

            alert(`Terima kasih ${name} atas respon anda! (${status})`);
            e.target.reset();
        };
    }
});
