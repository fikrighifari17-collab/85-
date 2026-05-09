/**
 * SoundNest – profile.js
 * Letakkan di: public/js/profile.js
 */

document.addEventListener('DOMContentLoaded', () => {
  const avatarInput = document.getElementById('avatar-input');
  const avatarForm  = document.getElementById('avatar-form');

  if (avatarInput && avatarForm) {
    avatarInput.addEventListener('change', () => {
      if (avatarInput.files.length) avatarForm.submit();
    });
  }
});