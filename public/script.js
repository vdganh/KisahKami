document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('nav ul li a');
    const contents = document.querySelectorAll('.content');
    const uploadButton = document.getElementById('uploadButton');
    const fileInput = document.getElementById('fileInput');
    const descriptionInput = document.getElementById('description');
    const dateInput = document.getElementById('date');
    const photoGallery = document.getElementById('photoGallery');
    const favoriteGallery = document.getElementById('favoriteGallery');
    const deleteGallery = document.getElementById('deleteGallery');
    const trash = document.getElementById('trash');
    const homeTab = document.getElementById('home');

    const securityCode = '260823'; // Security code
    let attempts = 0;
    let isLocked = false;

    // Navigation link click event
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            if (targetId === 'upload') {
                if (isLocked) {
                    showPenaltyAlert();
                    navigateToHome();
                    return;
                }
                requestSecurityCode();
            } else {
                showContent(targetId);
            }
        });
    });

    function showContent(targetId) {
        contents.forEach(content => {
            content.classList.remove('active');
            if (content.id === targetId) {
                content.classList.add('active');
                if (targetId === 'galeri') {
                    loadFromUploads(); // Memuat foto dari folder uploads
                } else if (targetId === 'favorit') {
                    loadFavoriteGallery(); // Memuat galeri favorit
                }
            }
        });
        if (targetId === 'delete') {
            loadDeleteGallery();
        }
    }

    function showAlert(message, type = 'success') {
        const customAlert = document.getElementById('customAlert');
        const alertMessage = document.getElementById('alertMessage');
        const alertContent = document.querySelector('.alert-content');

        alertMessage.innerText = message;
        alertContent.className = 'alert-content'; // Reset the class
        alertContent.classList.add(type); // Add the success/error class
        customAlert.classList.add('show');
        customAlert.style.display = 'flex';

        // Close the alert when the close button is clicked
        document.querySelector('.close-alert').onclick = () => {
            customAlert.classList.remove('show');
            customAlert.style.display = 'none';
        };
    }

    function requestSecurityCode() {
        const securityModal = document.getElementById('securityModal');
        const securityCodeInput = document.getElementById('securityCodeInput');
        const submitCodeButton = document.getElementById('submitCodeButton');
        const attemptMessage = document.getElementById('attemptMessage');

        securityModal.style.display = 'block';

        submitCodeButton.onclick = function () {
            const inputCode = securityCodeInput.value;
            if (inputCode === securityCode) {
                attempts = 0;
                securityModal.style.display = 'none';
                securityCodeInput.value = '';
                navigateToUpload();
            } else {
                handleFailedAttempt(attemptMessage);
            }
        };

        document.getElementById('modalClose').onclick = function () {
            securityModal.style.display = 'none';
        };
    }

    function handleFailedAttempt(attemptMessage) {
        attempts++;
        attemptMessage.innerText = `Kode salah. Anda telah mencoba sebanyak ${attempts} kali.`;
        if (attempts >= 3) {
            showAlert('Terlalu banyak percobaan yang salah. Anda akan diblokir selama 5 menit.', 'error');
            isLocked = true;
            setTimeout(() => {
                isLocked = false;
                showAlert('Anda sekarang dapat mencoba lagi.', 'success');
            }, 5 * 60 * 1000); // 5 minutes
            navigateToHome();
        }
    }

    function navigateToUpload() {
        showContent('upload');
        loadFromLocalStorage(); // Load photos from local storage
    }

    function navigateToHome() {
        showContent('home');
    }

    uploadButton.addEventListener('click', () => {
        const file = fileInput.files[0];
        const description = descriptionInput.value;
        const date = dateInput.value;
        if (file && description && date) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const photoCard = createPhotoCard(e.target.result, description, date);
                photoGallery.appendChild(photoCard);
                saveToLocalStorage(); // Pastikan foto disimpan di local storage
                fileInput.value = '';
                descriptionInput.value = '';
                dateInput.value = '';
            };
            reader.readAsDataURL(file);
        } else {
            showAlert('Mohon masukkan foto, deskripsi, dan tanggal.', 'error');
        }
    });

    photoGallery.addEventListener('click', (event) => {
        if (event.target.tagName === 'IMG') {
            openModal(event.target);
        }
    });

    deleteGallery.addEventListener('click', (event) => {
        if (event.target.tagName === 'IMG') {
            const photoCard = event.target.parentElement;
            photoCard.classList.toggle('selected');
            updateTrashVisibility();
        }
    });

    trash.addEventListener('click', () => {
        const selectedPhotos = deleteGallery.querySelectorAll('.selected');
        if (selectedPhotos.length === 0) {
            showAlert("Tidak ada foto yang dipilih untuk dihapus.", 'error');
            return;
        }
        selectedPhotos.forEach(photo => {
            const imgSrc = photo.querySelector('img').src;
            photo.classList.add('fade-out');
            photo.addEventListener('animationend', () => {
                photo.remove();
                removePhotoFromLocalStorage(imgSrc);
                loadDeleteGallery();
            });
        });
        updateTrashVisibility();
    });

    function updateTrashVisibility() {
        const selectedPhotos = deleteGallery.querySelectorAll('.selected');
        trash.classList.toggle('active', selectedPhotos.length > 0);
    }

    function loadDeleteGallery() {
        deleteGallery.innerHTML = '';
        for (let i = 1; i <= 24; i++) {
            const imgSrc = `uploads/foto${i}.jpg`;
            const photoCard = document.createElement('div');
            photoCard.classList.add('photo-card');
            photoCard.innerHTML = `<img src="${imgSrc}" alt="Foto">`;
            deleteGallery.appendChild(photoCard);
        }
        updateTrashVisibility();
    }

    function openModal(image) {
        const modal = document.getElementById('imageModal');
        const modalImage = document.getElementById('modalImage');
        const captionText = document.getElementById('caption');
        const description = image.nextElementSibling.innerText;
        const date = image.nextElementSibling.nextElementSibling.innerText;

        modal.style.display = 'block';
        modalImage.src = image.src;
        captionText.innerHTML = `<strong>Deskripsi:</strong> ${description}<br><strong>Tanggal:</strong> ${date}`;

        // Menutup modal ketika ikon close diklik
        const closeModal = document.getElementById('modalClose');
        closeModal.onclick = function () {
            modal.style.display = 'none';
        };

        // Menutup modal ketika area di luar gambar diklik
        modal.onclick = function (event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };
    }

    function createPhotoCard(src, description, date) {
        const photoCard = document.createElement('div');
        photoCard.classList.add('photo-card');
        photoCard.innerHTML = `
            <img src="${src}" alt="Foto">
            <div class="description">${description}</div>
            <div class="date">${date}</div>
            <span class="favorite">&#9825;</span>
        `;

        const favoriteIcon = photoCard.querySelector('.favorite');
        favoriteIcon.addEventListener('click', (event) => {
            event.stopPropagation();
            const isCurrentlyLiked = event.target.classList.toggle('liked');
            event.target.style.color = isCurrentlyLiked ? 'red' : ''; // Change icon color
            if (isCurrentlyLiked) {
                addToFavorites(photoCard);
            } else {
                removeFromFavorites(photoCard);
            }
            loadFavoriteGallery(); // Memuat galeri favorit setiap kali favorit diubah
        });

        // Check if the photo is already favorited and update the UI
        const imgSrc = src.split('/').pop(); // Get the image name
        const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        if (favorites.includes(imgSrc)) {
            favoriteIcon.classList.add('liked');
            favoriteIcon.style.color = 'red';
        }

        return photoCard;
    }

    function addToFavorites(photoCard) {
        const imgSrc = photoCard.querySelector('img').src.split('/').pop(); // Get the image name
        const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        if (!favorites.includes(imgSrc)) {
            favorites.push(imgSrc);
            localStorage.setItem('favorites', JSON.stringify(favorites));
        }
    }

    function removeFromFavorites(photoCard) {
        const imgSrc = photoCard.querySelector('img').src.split('/').pop(); // Get the image name
        const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        const index = favorites.indexOf(imgSrc);
        if (index > -1) {
            favorites.splice(index, 1);
            localStorage.setItem('favorites', JSON.stringify(favorites));
        }
        loadFavoriteGallery(); // Update the favorite gallery after removing
    }

    function loadFromUploads() {
        photoGallery.innerHTML = ''; // Clear existing gallery
        const photos = []; // Array to store image paths

        for (let i = 1; i <= 24; i++) {
            photos.push(`uploads/foto${i}.jpg`); // Store image paths in an array
        }

        // Load images and add them to the gallery
        photos.forEach((imgSrc, index) => {
            const img = new Image();
            img.src = imgSrc;

            img.onload = function () {
                const description = `KENANGAN SELAMA 1 TAHUN KAMI ${index + 1}`; // Adjust description as desired
                const date = `DIBUAT 26 AGUSTUS 2024`; // Change to the appropriate date
                const photoCard = createPhotoCard(imgSrc, description, date);
                photoGallery.appendChild(photoCard);
            };

            img.onerror = function () {
                console.error(`Gagal memuat gambar: ${imgSrc}`);
            };
        });
    }

    function loadFromLocalStorage() {
        photoGallery.innerHTML = '';
        const favorites = JSON.parse(localStorage.getItem('favorites')) || [];

        // Load all photos into the gallery
        for (let i = 1; i <= 24; i++) {
            const imgSrc = `uploads/foto${i}.jpg`;
            const description = `Deskripsi untuk foto ${i}`; // Adjust with desired description
            const date = `2024-08-10`; // Change to the appropriate date
            const photoCard = createPhotoCard(imgSrc, description, date);

            // Check if the image can be loaded
            const img = new Image();
            img.src = imgSrc;
            img.onload = function() {
                photoGallery.appendChild(photoCard);
                // Check if this photo is a favorite
                if (favorites.includes(`foto${i}.jpg`)) {
                    const favoriteIcon = photoCard.querySelector('.favorite');
                    favoriteIcon.classList.add('liked');
                    favoriteIcon.style.color = 'red';
                }
            };
            img.onerror = function() {
                console.error(`Gagal memuat gambar: ${imgSrc}`);
            };
        }

        // After loading all photos, load the favorite gallery
        loadFavoriteGallery(favorites);
    }

    function loadFavoriteGallery() {
        favoriteGallery.innerHTML = ''; // Clear favorite gallery
        const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        favorites.forEach(favSrc => {
            const photoCard = createPhotoCard(`uploads/${favSrc}`, `Deskripsi untuk ${favSrc}`, `2024-08-10`); // Adjust description and date
            favoriteGallery.appendChild(photoCard);
        });
    }
});
