document.addEventListener('DOMContentLoaded', () => {
    // Modal Logic
    // Modal Helpers
    const setupModal = (btnId, modalId, closeClass) => {
        const btn = document.getElementById(btnId);
        const modal = document.getElementById(modalId);
        const closeBtn = modal.querySelector(`.${closeClass}`);

        if (btn && modal && closeBtn) {
            btn.onclick = () => {
                modal.classList.remove('hidden');
                setTimeout(() => modal.classList.add('show'), 10);
            };

            closeBtn.onclick = () => {
                modal.classList.remove('show');
                setTimeout(() => modal.classList.add('hidden'), 300);
            };

            // Close on outside click
            modal.onclick = (event) => {
                if (event.target == modal) {
                    modal.classList.remove('show');
                    setTimeout(() => modal.classList.add('hidden'), 300);
                }
            };
        }
    };

    // Setup Modals
    setupModal('verified-badge-btn', 'business-card-modal', 'close-modal');
    setupModal('social-media-btn', 'social-media-modal', 'close-social');

    // Form Submission Logic
    const form = document.getElementById('client-form');
    const submitBtn = document.getElementById('submit-btn');
    const msgDiv = document.getElementById('form-message');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Disable button
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        msgDiv.classList.add('hidden');
        msgDiv.className = 'hidden'; // Reset classes

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            // IMPORTANT: Replace this with your Cloudflare Worker URL if deploying separately
            // e.g., const API_URL = 'https://a2zcreative-profile.yourname.workers.dev/api/submit';
            const API_URL = 'https://a2zcreative-worker.aliffarhan1997.workers.dev';

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                // Form reset and success message
                setTimeout(() => {
                    msgDiv.textContent = 'Trima Kasih! Details sent successfully.';
                    msgDiv.classList.remove('hidden');
                    msgDiv.classList.add('success');
                    form.reset();
                }, 500);

            } else {
                throw new Error('Network response was not ok');
            }
        } catch (error) {
            console.error('Error:', error);
            msgDiv.textContent = 'Error sending details. Please try again.';
            msgDiv.classList.remove('hidden');
            msgDiv.classList.add('error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Details';
        }
    });
});
