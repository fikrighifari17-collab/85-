// public/js/profile.js

window.initProfilePageLogic = function() {
  const avatarInput = document.getElementById('avatar-input');
  const avatarForm  = document.getElementById('avatar-form');
  const avatarImg   = document.getElementById('profile-avatar-display');
  const cropperModal = document.getElementById('cropper-modal');
  const cropperImage = document.getElementById('cropper-image');
  const cropSave     = document.getElementById('crop-save-btn');
  const zoomSlider   = document.getElementById('cropper-zoom-slider');

  if (avatarInput && avatarForm && !avatarInput.dataset.bound) {
    avatarInput.dataset.bound = '1';
    
    avatarInput.addEventListener('change', () => {
      const files = avatarInput.files;
      if (!files || !files.length) return;

      const file = files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        window.openCropper({
          src: e.target.result,
          title: 'Crop Profile Photo',
          aspectRatio: 1,
          onSave: (canvas) => {
            canvas.toBlob(async (blob) => {
              if (!blob) return;

              const formData = new FormData();
              formData.append('avatar', blob, 'avatar.jpg');

              const btn = document.querySelector('button[onclick*="avatar-input"]');
              const isIconBtn = btn && btn.classList.contains('avatar-edit-btn');
              const originalContent = btn ? btn.innerHTML : 'Change Photo';

              try {
                if (btn) {
                  btn.disabled = true;
                  if (!isIconBtn) btn.textContent = 'Updating...';
                }

                const response = await fetch(avatarForm.action, {
                  method: 'POST',
                  body: formData,
                  headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                  }
                });

                const data = await response.json();

                if (data.success) {
                  if (avatarImg) avatarImg.src = data.avatar_url;
                  document.querySelectorAll('img[alt="avatar"]').forEach(img => img.src = data.avatar_url);
                  if (typeof showToast === 'function') showToast(data.message, 'success');
                } else {
                  if (typeof showToast === 'function') showToast(data.message, 'error');
                }
              } catch (error) {
                console.error('Upload error:', error);
                if (typeof showToast === 'function') showToast('Failed to upload photo.', 'error');
              } finally {
                if (btn) {
                  btn.disabled = false;
                  btn.innerHTML = originalContent;
                }
              }
            }, 'image/jpeg', 0.9);
          }
        });
      };
      reader.readAsDataURL(file);
      avatarInput.value = ''; // Reset input
    });
  }

  // Password toggle
  document.querySelectorAll('.password-toggle').forEach(btn => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => {
      const input = btn.parentElement.querySelector('input');
      const isPass = input.type === 'password';
      input.type = isPass ? 'text' : 'password';
      
      // Update icon (Eye vs Eye-off)
      if (isPass) {
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
      } else {
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
      }
    });
  });
};

// Auto-run if loaded directly, or wait to be called by blade
if (document.getElementById('avatar-input')) {
  window.initProfilePageLogic();
}
