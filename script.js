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

    const securityCode = '260823'; // Kode keamanan yang baru
    let attempts = 0;
    let isLocked = false;

    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const targetId = link.getAttribute('href').substring(1);

            if (targetId === 'upload') {
                if (isLocked) {
                    showPenaltyAlert(); // Tampilkan alert pinalti jika terkunci
                    navigateToHome(); // Kembali ke halaman Home jika terkunci
                    return;
                }
                requestSecurityCode(); // Minta kode keamanan
            } else {
                contents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === targetId) {
                        content.classList.add('active');
                    }
                });
                if (targetId === 'delete') {
                    loadDeleteGallery(); // Muat galeri hapus saat tab delete dipilih
                }
            }
        });
    });

    function showAlert(message, type = 'success') {
        const customAlert = document.getElementById('customAlert');
        const alertMessage = document.getElementById('alertMessage');
        const alertContent = document.querySelector('.alert-content');
    
        alertMessage.innerText = message;
    
        // Set the appropriate class based on the alert type
        alertContent.className = 'alert-content'; // Reset the class
        alertContent.classList.add(type); // Add the success/error class
    
        customAlert.classList.add('show'); // Show the alert
        customAlert.style.display = 'flex'; // Display the modal
    
        // Close the modal when the close button is clicked
        document.querySelector('.close-alert').onclick = () => {
            customAlert.classList.remove('show'); // Hide the alert
            customAlert.style.display = 'none'; // Hide the modal after animation ends
        };
    
        // Close the modal when clicking outside the modal
        window.onclick = (event) => {
            if (event.target === customAlert) {
                customAlert.classList.remove('show'); // Hide the alert
                customAlert.style.display = 'none'; // Hide the modal after animation ends
            }
        };
    }
    

    function requestSecurityCode() {
        const securityModal = document.getElementById('securityModal');
        const securityCodeInput = document.getElementById('securityCodeInput');
        const submitCodeButton = document.getElementById('submitCodeButton');
        const attemptMessage = document.getElementById('attemptMessage');

        securityModal.style.display = 'block'; // Tampilkan modal

        submitCodeButton.onclick = function () {
            const inputCode = securityCodeInput.value;
            if (inputCode === securityCode) {
                attempts = 0; // Reset jumlah percobaan jika berhasil
                securityModal.style.display = 'none'; // Sembunyikan modal
                securityCodeInput.value = ''; // Kosongkan input
                navigateToUpload(); // Tampilkan tab upload
                loadDeleteGallery(); // Muat galeri hapus saat masuk ke upload
            } else {
                attempts++;
                attemptMessage.innerText = `Kode salah. Anda telah mencoba sebanyak ${attempts} kali.`;
                securityCodeInput.value = ''; // Kosongkan input
                if (attempts >= 3) {
                    if (attempts >= 3) {
                        showAlert('Terlalu banyak percobaan yang salah. Anda akan diblokir selama 5 menit.', 'error');
                        isLocked = true;
                        setTimeout(() => {
                            isLocked = false; // Buka kunci setelah 5 menit
                            showAlert('Anda sekarang dapat mencoba lagi.', 'success');
                        }, 5 * 60 * 1000); // 5 menit dalam milidetik
                    }                                      
                    securityModal.style.display = 'none'; // Sembunyikan modal setelah diblokir
                    navigateToHome(); // Kembali ke halaman Home
                }
            }
        };

        // Menutup modal
        document.getElementById('modalClose').onclick = function () {
            securityModal.style.display = 'none'; // Sembunyikan modal
        };

        window.onclick = function (event) {
            if (event.target === securityModal) {
                securityModal.style.display = 'none'; // Sembunyikan modal jika klik di luar
            }
        };
    }

    function navigateToUpload() {
        contents.forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById('upload').classList.add('active'); // Tampilkan tab upload
        loadFromLocalStorage(); // Memuat foto dari localStorage saat masuk ke upload
    }

    function navigateToHome() {
        contents.forEach(content => {
            content.classList.remove('active');
        });
        homeTab.classList.add('active'); // Alihkan ke tab Home
    }

    uploadButton.addEventListener('click', () => {
        const file = fileInput.files[0];
        const description = descriptionInput.value;
        const date = dateInput.value; // Ambil tanggal
        if (file && description && date) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const photoCard = createPhotoCard(e.target.result, description, date);
                photoGallery.appendChild(photoCard);
                saveToLocalStorage(); // Simpan ke localStorage
                loadDeleteGallery(); // Muat ulang galeri hapus
                // Reset input fields after upload
                fileInput.value = '';
                descriptionInput.value = '';
                dateInput.value = '';
            };
            reader.readAsDataURL(file);
        } else {
            showAlert('Mohon masukkan foto, deskripsi, dan tanggal.', true); // Menggunakan showAlert
        }
    });

    // Membuka modal saat mengklik gambar
    photoGallery.addEventListener('click', (event) => {
        if (event.target.tagName === 'IMG') {
            openModal(event.target);
        }
    });

    favoriteGallery.addEventListener('click', (event) => {
        if (event.target.tagName === 'IMG') {
            openModal(event.target);
        }
    });

    // Menghapus foto dari galeri
    deleteGallery.addEventListener('click', (event) => {
        if (event.target.tagName === 'IMG') {
            const photoCard = event.target.parentElement; // Ambil elemen photo-card
            photoCard.classList.toggle('selected'); // Pilih foto untuk dihapus
            updateTrashVisibility(); // Perbarui tampilan tempat sampah
        }
    });

    trash.addEventListener('click', () => {
        const selectedPhotos = deleteGallery.querySelectorAll('.selected');
        const galleryData = JSON.parse(localStorage.getItem('galleryData')) || [];
    
        if (selectedPhotos.length === 0) {
            alert("Tidak ada foto yang dipilih untuk dihapus.");
            return; // Jika tidak ada foto yang dipilih, keluar dari fungsi
        }
    
        selectedPhotos.forEach(photo => {
            const imgSrc = photo.querySelector('img').src; // Ambil src gambar untuk menghapus dari galeri
    
            // Tambahkan animasi ketika foto dihapus
            photo.classList.add('fade-out');
            photo.addEventListener('animationend', () => {
                photo.remove(); // Hapus foto yang dipilih setelah animasi selesai
    
                // Hapus foto dari galleryData dan hanya simpan yang tidak dihapus
                const remainingPhotos = galleryData.filter(data => data.imgSrc !== imgSrc);
                localStorage.setItem('galleryData', JSON.stringify(remainingPhotos)); // Simpan perubahan ke local storage
                
                // Hapus foto dari galeri utama
                const mainGalleryPhotos = photoGallery.childNodes;
                mainGalleryPhotos.forEach(photoCard => {
                    if (photoCard.querySelector('img').src === imgSrc) {
                        photoCard.remove(); // Hapus dari galeri utama
                    }
                });
    
                // Hapus foto dari galeri favorit juga
                const favoritePhotos = favoriteGallery.childNodes;
                favoritePhotos.forEach(favCard => {
                    if (favCard.querySelector('img').src === imgSrc) {
                        favCard.remove(); // Hapus dari galeri favorit
                    }
                });
    
                loadDeleteGallery(); // Muat ulang galeri hapus setelah menghapus
            });
        });
        updateTrashVisibility(); // Perbarui tampilan tempat sampah
    });
     

    function updateTrashVisibility() {
        const selectedPhotos = deleteGallery.querySelectorAll('.selected');
        if (selectedPhotos.length > 0) {
            trash.classList.add('active'); // Tampilkan tempat sampah
        } else {
            trash.classList.remove('active'); // Sembunyikan tempat sampah
        }
    }

    function loadDeleteGallery() {
        deleteGallery.innerHTML = ''; // Kosongkan galeri hapus
        const galleryData = JSON.parse(localStorage.getItem('galleryData')) || [];
        if (galleryData.length === 0) {
            console.log('Tidak ada foto yang tersimpan di local storage.');
        } else {
            galleryData.forEach(data => {
                const photoCard = document.createElement('div');
                photoCard.classList.add('photo-card');
                photoCard.innerHTML = `
                    <img src="${data.imgSrc}" alt="Foto">
                `;
                deleteGallery.appendChild(photoCard);
            });
        }
        updateTrashVisibility(); // Perbarui tampilan tempat sampah
    }

    function openModal(image) {
        const modal = document.getElementById('imageModal');
        const modalImage = document.getElementById('modalImage');
        const captionText = document.getElementById('caption');
        const description = image.nextElementSibling.innerText; // Ambil deskripsi foto
        const date = image.nextElementSibling.nextElementSibling.innerText; // Ambil tanggal foto
        modal.style.display = 'block';
        modalImage.src = image.src;
        captionText.innerHTML = `<strong>Deskripsi:</strong> ${description}<br><strong>Tanggal:</strong> ${date}`; // Tampilkan deskripsi dan tanggal di modal

        const closeModal = document.getElementById('modalClose');
        closeModal.onclick = function() {
            modal.style.display = 'none'; // Sembunyikan modal saat tombol ditutup
        };

        window.onclick = function(event) {
            if (event.target === modal) {
                modal.style.display = 'none'; // Sembunyikan modal jika klik di luar
            }
        };
    }

    function createPhotoCard(src, description, date, isFavorite = false) {
        const photoCard = document.createElement('div');
        photoCard.classList.add('photo-card');
        photoCard.innerHTML = `
            <img src="${src}" alt="Foto">
            <div class="description">${description}</div>
            <div class="date">${date}</div>
            <span class="favorite ${isFavorite ? 'liked' : ''}">&#9825;</span>
        `;

        const favoriteIcon = photoCard.querySelector('.favorite');
        favoriteIcon.addEventListener('click', (event) => {
            event.stopPropagation(); // Menghentikan propagasi klik ke gambar
            const isCurrentlyLiked = event.target.classList.contains('liked');
            event.target.classList.toggle('liked');
            if (isCurrentlyLiked) {
                event.target.style.color = ''; // Mengembalikan warna ikon
                removeFromFavorites(photoCard); // Hapus dari favorit
            } else {
                event.target.style.color = 'red'; // Mengubah warna ikon menjadi merah
                addToFavorites(photoCard); // Tambahkan ke favorit
            }
            saveToLocalStorage(); // Simpan ke localStorage setelah menambahkan atau menghapus dari favorit
        });

        // Atur warna ikon berdasarkan status favorit saat pembuatan
        favoriteIcon.style.color = isFavorite ? 'red' : ''; // Jika favorit, warna ikon menjadi merah

        return photoCard;
    }

    // Menambahkan foto ke favorit
    function addToFavorites(photoCard) {
        const newPhotoCard = photoCard.cloneNode(true); // Clone photoCard agar tetap di galeri
        favoriteGallery.appendChild(newPhotoCard);
    }

    // Menghapus foto dari favorit berdasarkan src gambar
    function removeFromFavorites(photoCard) {
        const imgSrc = photoCard.querySelector('img').src; // Ambil src gambar untuk menghapus dari galeri favorit
        removeFromFavoritesByImgSrc(imgSrc);
    }

    // Fungsi untuk menghapus foto dari favorit berdasarkan src gambar
    function removeFromFavoritesByImgSrc(imgSrc) {
        const favoriteCards = favoriteGallery.childNodes;
        favoriteCards.forEach(favCard => {
            if (favCard.querySelector('img').src === imgSrc) {
                favoriteGallery.removeChild(favCard);
            }
        });
    }    

    // Menyimpan galeri ke localStorage
    function saveToLocalStorage() {
        const galleryData = [];
        photoGallery.childNodes.forEach(photoCard => {
            const imgSrc = photoCard.querySelector('img').src;
            const description = photoCard.querySelector('.description').innerText;
            const date = photoCard.querySelector('.date').innerText;
            const isFavorite = photoCard.querySelector('.favorite').classList.contains('liked');
            galleryData.push({ imgSrc, description, date, isFavorite });
        });
        localStorage.setItem('galleryData', JSON.stringify(galleryData)); // Simpan ke localStorage
    }

    // Memuat data galeri dari localStorage saat halaman dimuat
    function loadFromLocalStorage() {
        const galleryData = JSON.parse(localStorage.getItem('galleryData')) || [];
        photoGallery.innerHTML = ''; // Kosongkan galeri foto sebelum memuat ulang
        galleryData.forEach(data => {
            const photoCard = createPhotoCard(data.imgSrc, data.description, data.date, data.isFavorite);
            photoGallery.appendChild(photoCard);
            if (data.isFavorite) {
                const newFavoriteCard = photoCard.cloneNode(true); // Clone photoCard agar ditambahkan ke favorit
                favoriteGallery.appendChild(newFavoriteCard);
            }
        });
        loadDeleteGallery(); // Muat galeri hapus saat memuat data
    }

    loadFromLocalStorage(); // Memuat foto dari localStorage saat halaman dimuat
});
